'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { TextDecoder } = require('node:util');
const { canonical } = require('./safety-policy.js');
const { validateCanonicalPaths, validateExceptions, scanText, safeRelative } = require('./unicode-hygiene.js');
const LOCK_FILE = '.agenthaus-lock.json';
const EXCLUSION_POLICY = 'agenthaus-plugin-payload-v1';
const EXECUTABLE_POLICY = process.platform === 'win32' ? 'unavailable-on-windows' : 'posix-executable-bit-v1';
const LIMIT = 128 * 1024 * 1024;
const MAX_FILE = 16 * 1024 * 1024;
const SNAPSHOTS = new WeakMap();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
function failure(code, relativePath) { const error = new Error(`Content integrity failed: ${code}${relativePath ? ' (' + relativePath + ')' : ''}`); error.code = code; error.path = relativePath; return error; }
function markerBytes(plugin) { return Buffer.from(JSON.stringify({ plugin, managedBy: 'agenthaus' },null,2)+'\n'); }
function expectedDerivations(plugin) { return [{ path: '.agenthaus-install.json', kind: 'installer-ownership-v1', sha256: hash(markerBytes(plugin)) }]; }
function secretEnvironment(name) { return /^\.env(?:\.(?:local|development|production|test|staging)(?:\.local)?)?$/i.test(name); }
function record(entry) { return entry.type === 'file' ? { path:entry.path,type:'file',size:entry.size ?? entry.bytes.length,sha256:entry.sha256,executable:Object.hasOwn(entry,'executable')?entry.executable:(process.platform==='win32'?null:Boolean(entry.mode&0o111)) } : { path:entry.path,type:'symlink',target:entry.target,sha256:entry.sha256 }; }
function treeDigest(files) { return hash(canonical(files.map(record))); }
function readBounded(absolute, maximum, expectedStat) {
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile() || before.size > maximum) throw failure('PAYLOAD_LIMIT');
    if (expectedStat && (before.ino !== expectedStat.ino || before.dev !== expectedStat.dev)) throw failure('SOURCE_CHANGED');
    const buffer = Buffer.alloc(before.size + 1);
    let count = 0, read;
    do { read = fs.readSync(fd, buffer, count, buffer.length - count, count); count += read; } while (read > 0 && count < buffer.length);
    const after = fs.fstatSync(fd);
    if (count !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw failure('SOURCE_CHANGED');
    return buffer.subarray(0,count);
  } finally { fs.closeSync(fd); }
}
function hasShebang(absolute) {
  const fd = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try { const bytes = Buffer.alloc(2); return fs.readSync(fd,bytes,0,2,0) === 2 && bytes[0] === 35 && bytes[1] === 33; }
  finally { fs.closeSync(fd); }
}
function collect(root) {
  const files = [], exclusions = []; let total = 0;
  const plugin = path.basename(root);
  function walk(dir = '') {
    for (const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})) {
      const rel = path.posix.join(dir,entry.name), absolute = path.join(root,rel);
      if (rel === LOCK_FILE) continue;
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(absolute); let real;
        try { real = fs.realpathSync(absolute); } catch { throw failure('BROKEN_SYMLINK',rel); }
        if (!real.startsWith(root + path.sep) && real !== root) throw failure('SYMLINK_ESCAPE',rel);
        if (path.isAbsolute(target)) throw failure('ABSOLUTE_SYMLINK',rel);
        files.push({path:rel,type:'symlink',target,sha256:hash(target),realTarget:path.relative(root,real).split(path.sep).join('/')});
      } else if (stat.isDirectory() && ['.git','node_modules','.venv','venv','__pycache__'].includes(entry.name)) {
        exclusions.push({path:rel,reason:'external-dependency-or-vcs-tree'});
      } else if (stat.isFile() && secretEnvironment(entry.name)) {
        if ((stat.mode & 0o111) || hasShebang(absolute)) throw failure('AMBIGUOUS_ENV_PAYLOAD',rel);
        exclusions.push({path:rel,reason:'secret-environment-file'});
      } else if (rel === '.agenthaus-install.json') {
        const expected = expectedDerivations(plugin)[0];
        if (!stat.isFile() || stat.size !== markerBytes(plugin).length || hash(readBounded(absolute,1024,stat)) !== expected.sha256) throw failure('DERIVATION_CHANGED',rel);
      } else if (stat.isDirectory()) walk(rel);
      else if (stat.isFile()) {
        if (stat.size > MAX_FILE || total + stat.size > LIMIT || files.length >= 10000) throw failure('PAYLOAD_LIMIT',rel);
        const bytes = readBounded(absolute, Math.min(MAX_FILE,LIMIT-total),stat); total += bytes.length;
        files.push({path:rel,type:'file',bytes,sha256:hash(bytes),mode:stat.mode & 0o777});
      } else throw failure('UNSUPPORTED_PAYLOAD',rel);
    }
  }
  walk();
  const all = validateCanonicalPaths(files.map(f => f.path)), ranks = new Map(all.map((name,i) => [name,i]));
  files.sort((a,b) => ranks.get(a.path) - ranks.get(b.path));
  for (const entry of files.filter(f => f.type === 'symlink')) {
    if (entry.realTarget && !files.some(f => f.path === entry.realTarget || f.path.startsWith(entry.realTarget + '/'))) throw failure('UNVERIFIED_SYMLINK_TARGET',entry.path);
  }
  return {files,exclusions:exclusions.sort((a,b) => a.path.localeCompare(b.path))};
}
function validatedSourceSnapshot(requestedRoot,{unicodeExceptions=[],permitUnicodeErrors=false,afterRead}={}) {
  const root=fs.realpathSync(requestedRoot);if(!fs.statSync(root).isDirectory())throw failure('INVALID_ROOT');
  const exceptions=validateExceptions(unicodeExceptions),first=collect(root),unicode=[],unicodeCoverage=[];
  for(const file of first.files.filter(f=>f.type==='file')) {
    let text;
    try { text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(file.bytes); }
    catch {
      if (/\.(?:md|mdc|txt|json5?|ya?ml|toml|ini|cfg|conf|[cm]?js|jsx|tsx?|sh|bash|zsh|py|rb|pl|ps1|xml)$/i.test(file.path) || file.bytes.subarray(0,2).toString()==='#!') throw failure('INVALID_TEXT_ENCODING',file.path);
      unicodeCoverage.push({path:file.path,status:'binary-hashed'}); continue;
    }
    unicodeCoverage.push({path:file.path,status:'text-scanned'});
    unicode.push(...scanText(file.path,text,{exceptions}));
    if (unicode.length>4096) throw failure('UNICODE_DIAGNOSTIC_LIMIT');
  }
  if(!permitUnicodeErrors&&unicode.some(d=>d.severity==='error')){const e=failure('UNICODE_HYGIENE');e.diagnostics=unicode;throw e;}
  if(afterRead)afterRead();const second=collect(root);
  if(treeDigest(first.files)!==treeDigest(second.files)||canonical(first.exclusions)!==canonical(second.exclusions))throw failure('SOURCE_CHANGED');
  const snapshot = {root,plugin:path.basename(root),tree_sha256:treeDigest(first.files),files:first.files.map(record),exclusions:first.exclusions,unicode,unicodeCoverage,unicodeExceptions:exceptions};
  SNAPSHOTS.set(snapshot,{files:first.files,plugin:snapshot.plugin,unicodeExceptions:JSON.parse(JSON.stringify(exceptions)),lock:null});
  return snapshot;
}
function lockPolicy(plugin) {
  return {version:1,plugin,algorithm:'sha256',exclusion_policy:EXCLUSION_POLICY,executable_policy:EXECUTABLE_POLICY,
    exclusions:['lock-self','secret-environment-files','node_modules','.git','.venv','venv','__pycache__'],
    limitations:['Hashes detect drift; they do not authenticate a publisher.','Excluded dependencies and secrets are not copied into strict snapshots.','Runtime processes, provider-derived configs and remote APIs require independent evidence.','Only POSIX executable-bit semantics are bound; ACLs, owner and other mode bits are not attested. Windows executable metadata is unavailable.'],
    derived:expectedDerivations(plugin)};
}
function createContentLock(snapshot) {
  const trusted = snapshot && SNAPSHOTS.get(snapshot);
  if (!trusted) throw failure('UNVERIFIED_SNAPSHOT');
  return {...lockPolicy(trusted.plugin),unicode_exceptions:trusted.unicodeExceptions,files:trusted.files.map(record),tree_sha256:treeDigest(trusted.files)};
}
function validateLock(lock,plugin) {
  const keys=['version','plugin','algorithm','exclusion_policy','executable_policy','exclusions','limitations','unicode_exceptions','derived','files','tree_sha256'];
  if(!lock||typeof lock!=='object'||Array.isArray(lock)||Object.keys(lock).sort().join(',')!==keys.sort().join(',')||lock.version!==1||lock.plugin!==plugin||lock.algorithm!=='sha256'||lock.exclusion_policy!==EXCLUSION_POLICY||
    !Array.isArray(lock.files)||lock.files.length>10000||!Array.isArray(lock.exclusions)||!Array.isArray(lock.limitations)||!/^[a-f0-9]{64}$/.test(lock.tree_sha256||''))throw failure('INVALID_LOCK');
  if(lock.executable_policy!==EXECUTABLE_POLICY)throw failure('UNSUPPORTED_EXECUTABLE_METADATA');
  const expected=lockPolicy(plugin);
  if(canonical(lock.exclusions)!==canonical(expected.exclusions)||canonical(lock.derived)!==canonical(expected.derived))throw failure('INVALID_LOCK_POLICY');
  validateExceptions(lock.unicode_exceptions);validateCanonicalPaths(lock.files.map(f=>f.path));
  for(const f of lock.files) {
    if(!safeRelative(f.path)||f.path===LOCK_FILE||!['file','symlink'].includes(f.type)||!/^[a-f0-9]{64}$/.test(f.sha256||'')||
       (f.type==='file'&&(!Number.isSafeInteger(f.size)||f.size<0||Object.keys(f).sort().join(',')!=='executable,path,sha256,size,type'||(EXECUTABLE_POLICY==='posix-executable-bit-v1'?typeof f.executable!=='boolean':f.executable!==null)))||
       (f.type==='symlink'&&(typeof f.target!=='string'||Object.keys(f).sort().join(',')!=='path,sha256,target,type')))throw failure('INVALID_LOCK_ENTRY');
  }
  if(hash(canonical(lock.files))!==lock.tree_sha256)throw failure('INVALID_TREE_DIGEST');
  return lock;
}
function loadLock(root,input) {
  if(input&&typeof input==='object'&&!Array.isArray(input))return input;
  const file=input||path.join(root,LOCK_FILE);
  try {const stat=fs.lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4*1024*1024)throw failure('INVALID_LOCK');return JSON.parse(readBounded(file,4*1024*1024,stat).toString('utf8'));}
  catch(e){if(e.code==='ENOENT')throw failure('MISSING_LOCK');if(e.code&&e.code.startsWith('INVALID'))throw e;throw failure('INVALID_LOCK');}
}
function verifyContentLock(requestedRoot,input,options={}) {
  try {
    if (options.installed && fs.lstatSync(requestedRoot).isSymbolicLink()) throw failure('INSTALLED_SYMLINK');
    const root=fs.realpathSync(requestedRoot);
    if (options.installed && !fs.existsSync(path.join(root,'.agenthaus-install.json'))) throw failure('MISSING_INSTALLER_MARKER');
    const lock=validateLock(loadLock(root,input),path.basename(root));
    const snapshot=validatedSourceSnapshot(root,{...options,unicodeExceptions:lock.unicode_exceptions});const expected=new Map(lock.files.map(f=>[f.path,f])),actual=new Map(snapshot.files.map(f=>[f.path,record(f)])),errors=[];
    for(const [p,value]of expected)if(!actual.has(p))errors.push({code:'MISSING_FILE',path:p});else if(canonical(value)!==canonical(actual.get(p)))errors.push({code:'CHANGED_FILE',path:p});
    for(const p of actual.keys())if(!expected.has(p))errors.push({code:'UNEXPECTED_FILE',path:p});
    if(errors.length)return{ok:false,errors};snapshot.lock=lock;SNAPSHOTS.get(snapshot).lock=JSON.parse(JSON.stringify(lock));return{ok:true,errors:[],snapshot};
  }catch(e){return{ok:false,errors:[{code:e.code||'SOURCE_UNAVAILABLE',...(e.path?{path:e.path}:{})}],...(e.diagnostics?{diagnostics:e.diagnostics}:{})};}
}
function renewContentLock(root,{lockFile=path.join(root,LOCK_FILE),unicodeExceptions=[]}={}) {
  const snapshot=validatedSourceSnapshot(root,{unicodeExceptions});const lock=createContentLock(snapshot),target=path.resolve(lockFile);
  if(target!==path.resolve(root,LOCK_FILE))throw failure('UNSUPPORTED_LOCK_DESTINATION');
  if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw failure('INVALID_LOCK');
  const temp=target+'.'+crypto.randomUUID()+'.tmp';
  try{fs.writeFileSync(temp,JSON.stringify(lock,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,target);}finally{try{fs.unlinkSync(temp);}catch{}}
  return lock;
}
function preflightPlugin(root,{strictIntegrity=false,lockFile}={}) {
  if(!strictIntegrity)return null;const result=verifyContentLock(root,lockFile);if(!result.ok){const e=failure(result.errors[0].code,result.errors[0].path);e.errors=result.errors;throw e;}return result.snapshot;
}
function withVerifiedStage(snapshot,callback) {
  const trusted = snapshot && SNAPSHOTS.get(snapshot);
  if(!trusted || !trusted.lock)throw failure('UNVERIFIED_SNAPSHOT');
  const plugin = trusted.lock.plugin;
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-verified-')),stage=path.join(temp,plugin);
  fs.chmodSync(temp,0o700);fs.mkdirSync(stage,{mode:0o700});fs.chmodSync(stage,0o700);
  function ensureDirectory(relative) {
    let current=stage;
    for(const component of relative.split(/[\\/]/).filter(value=>value&&value!=='.')) {
      current=path.join(current,component);
      try{fs.mkdirSync(current,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}
      if(!fs.lstatSync(current).isDirectory()||fs.lstatSync(current).isSymbolicLink())throw failure('STAGED_PAYLOAD_MISMATCH');
      fs.chmodSync(current,0o700);
    }
  }
  try{
    for(const entry of trusted.files.filter(f=>f.type==='file')){const dest=path.join(stage,entry.path);ensureDirectory(path.dirname(entry.path));if(hash(entry.bytes)!==entry.sha256)throw failure('SNAPSHOT_CHANGED',entry.path);fs.writeFileSync(dest,entry.bytes,{flag:'wx',mode:entry.mode});if(process.platform!=='win32')fs.chmodSync(dest,entry.mode);}
    for(const entry of trusted.files.filter(f=>f.type==='symlink')){const dest=path.join(stage,entry.path);ensureDirectory(path.dirname(entry.path));fs.symlinkSync(entry.target,dest);}
    fs.writeFileSync(path.join(stage,LOCK_FILE),JSON.stringify(trusted.lock,null,2)+'\n',{flag:'wx',mode:0o600});
    const verified=verifyContentLock(stage);if(!verified.ok)throw failure('STAGED_PAYLOAD_MISMATCH');
    return callback(stage,verified.snapshot);
  }finally{fs.rmSync(temp,{recursive:true,force:true,maxRetries:3});}
}
module.exports={LOCK_FILE,EXCLUSION_POLICY,secretEnvironment,validatedSourceSnapshot,createContentLock,verifyContentLock,renewContentLock,preflightPlugin,withVerifiedStage};
