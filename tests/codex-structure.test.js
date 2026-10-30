'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const provider=path.resolve(__dirname,'../src/providers/codex.js');
function fixture(t,original){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'codex-structure-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const cwd=path.join(dir,'project'),target=path.join(cwd,'.codex','agenthaus-skills');fs.mkdirSync(path.dirname(target),{recursive:true});const file=path.join(cwd,'.codex','config.toml');fs.writeFileSync(file,original);const source=name=>{const d=path.join(dir,'source',name);fs.mkdirSync(path.join(d,'skills'),{recursive:true});fs.writeFileSync(path.join(d,'.mcp.json'),JSON.stringify({mcpServers:{shared:{command:'node',args:['server.js']}}}));return d;};return {dir,cwd,target,file,source};}
function invoke(f,action,name){const code=`const p=require(${JSON.stringify(provider)});p.${action}(${JSON.stringify(action==='postUninstall'?name:f.source(name))},${JSON.stringify(f.target)});`;return spawnSync(process.execPath,['-e',code],{cwd:f.cwd,env:{...process.env,HOME:f.dir},encoding:'utf8'});}
function snapshot(root){const result={};function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())visit(file);else result[path.relative(root,file)]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');}}visit(root);return result;}
test('malformed or ambiguous TOML prevents every provider write including AGENTS and backups',t=>{
 for(const original of ['model = barevalue\n','model = "a"\nmodel = "b"\n','# >>> agenthaus:sample broken\n','# <<< agenthaus:sample <<<\n','[[unsupported]]\nx = 1\n']){const f=fixture(t,original),before=snapshot(f.cwd);const r=invoke(f,'postInstall','sample');assert.notEqual(r.status,0);assert.deepEqual(snapshot(f.cwd),before);}
});
test('malformed MCP prevents early AGENTS writes',t=>{
 const f=fixture(t,'model = "safe"\n'),source=f.source('sample');fs.writeFileSync(path.join(source,'.mcp.json'),'{bad json');
 const before=snapshot(f.cwd);const code=`require(${JSON.stringify(provider)}).postInstall(${JSON.stringify(source)},${JSON.stringify(f.target)})`;spawnSync(process.execPath,['-e',code],{cwd:f.cwd,env:{...process.env,HOME:f.dir},encoding:'utf8'});assert.deepEqual(snapshot(f.cwd),before);
});
test('quoted root and dotted assignment collisions are namespaced structurally',t=>{
 for(const original of [`['mcp_servers'.shared]\ncommand = 'user'\n`,`'mcp_servers'.shared.command = 'user'\n`]){const f=fixture(t,original);const r=invoke(f,'postInstall','sample');assert.equal(r.status,0,r.stderr);const after=fs.readFileSync(f.file,'utf8');assert.ok(after.startsWith(original));assert.match(after,/\[mcp_servers.sample-shared\]/);}
});
test('multiline marker prose and unmanaged bytes survive install/uninstall exactly',t=>{
 const marker='# >>> agenthaus:sample (managed by agenthaus; edits are overwritten) >>>\n[mcp_servers.fake]\n# <<< agenthaus:sample <<<';
 for(const suffix of ['','\n','\r\n']){const original=`# user\n\n\nnotes = '''\n${marker}\n'''${suffix}`;const f=fixture(t,original);assert.equal(invoke(f,'postInstall','sample').status,0);const installed=fs.readFileSync(f.file,'utf8');assert.ok(installed.startsWith(original));assert.equal(invoke(f,'postUninstall','sample').status,0);assert.equal(fs.readFileSync(f.file,'utf8'),original);}
});
test('colliding plugin owners can uninstall in either order without dropping user entries',t=>{
 for(const order of [['alpha','beta'],['beta','alpha']]){const original='# user config\n[mcp_servers.shared]\ncommand = "user"\n';const f=fixture(t,original);for(const p of ['alpha','beta'])assert.equal(invoke(f,'postInstall',p).status,0);for(const p of order)assert.equal(invoke(f,'postUninstall',p).status,0);assert.equal(fs.readFileSync(f.file,'utf8'),original);}
});
test('invalid rendered candidates and oversized existing config cannot write AGENTS or backups',t=>{
 const f=fixture(t,'# original\nmodel = "safe"\n'),source=f.source('sample');
 fs.writeFileSync(path.join(source,'.mcp.json'),JSON.stringify({mcpServers:{bad:{command:'\ud800'}}}));
 const before=snapshot(f.cwd),code=`require(${JSON.stringify(provider)}).postInstall(${JSON.stringify(source)},${JSON.stringify(f.target)})`;
 const r=spawnSync(process.execPath,['-e',code],{cwd:f.cwd,env:{...process.env,HOME:f.dir},encoding:'utf8'});assert.notEqual(r.status,0);assert.deepEqual(snapshot(f.cwd),before);
 fs.writeFileSync(f.file,'#'.repeat(4*1024*1024+1));const large=snapshot(f.cwd);assert.notEqual(invoke(f,'postInstall','sample').status,0);assert.deepEqual(snapshot(f.cwd),large);
});
test('uninstall rejects malformed or ambiguous config before touching AGENTS',t=>{
 const f=fixture(t,'# >>> agenthaus:sample (managed by agenthaus; edits are overwritten) >>>\n[mcp_servers.shared]\ncommand="node"\n# <<< agenthaus:sample <<<\nextra="unmanaged"\n');
 fs.writeFileSync(path.join(f.cwd,'AGENTS.md'),'# fixture\n- Read skills from .codex/agenthaus-skills/sample/skills/\n');
 const before=snapshot(f.cwd);assert.notEqual(invoke(f,'postUninstall','sample').status,0);assert.deepEqual(snapshot(f.cwd),before);
});
test('provider preflight APIs return plans without any instruction/config mutation',t=>{
 const f=fixture(t,'model="safe"\n'),p=require(provider),source=f.source('sample'),before=snapshot(f.cwd);
 const plan=p.preflightInstall(source,f.target);assert.equal(plan.configPath,f.file);assert.match(plan.next,/\[mcp_servers.shared\]/);assert.deepEqual(snapshot(f.cwd),before);
 const remove=p.preflightUninstall('sample',f.target);assert.equal(remove.next,null);assert.deepEqual(snapshot(f.cwd),before);
 fs.writeFileSync(path.join(source,'.mcp.json'),'{bad JSON');assert.throws(()=>p.preflightInstall(source,f.target),/MCP source/);assert.deepEqual(snapshot(f.cwd),before);
});
function isolated(f,body){const env={LANG:'C',LC_ALL:'C'};if(process.platform==='win32'&&process.env.SystemRoot)env.SystemRoot=process.env.SystemRoot;return spawnSync(process.execPath,['-e',`require('node:os').homedir=()=>${JSON.stringify(f.dir)};const p=require(${JSON.stringify(provider)});${body}`],{cwd:f.cwd,env,encoding:'utf8'});}
test('invalid Codex server definitions preserve existing config instructions and backups',t=>{
 const f=fixture(t,'model="safe"\n'),source=f.source('sample');assert.equal(isolated(f,`p.postInstall(${JSON.stringify(source)},${JSON.stringify(f.target)});`).status,0);
 const before=snapshot(f.cwd);
 for(const server of [{},'not-a-server',{command:true},{command:'node',args:[1]},{command:'node',env:{PRIVATE_VALUE:42}},{type:'http'},{command:'node',cwd:true}]){
  fs.writeFileSync(path.join(source,'.mcp.json'),JSON.stringify({mcpServers:{broken:server}}));
  const preflight=isolated(f,`require('node:assert/strict').throws(()=>p.preflightInstall(${JSON.stringify(source)},${JSON.stringify(f.target)}),/MCP source/);`);assert.equal(preflight.status,0,preflight.stderr);
  const update=isolated(f,`p.postInstall(${JSON.stringify(source)},${JSON.stringify(f.target)});`);assert.equal(update.status,0,update.stderr);assert.deepEqual(snapshot(f.cwd),before);
 }
});
test('Codex uninstall removes only marked owned skill reference and preserves unmarked user prose',t=>{
 const f=fixture(t,'model="safe"\n');const file=path.join(f.cwd,'AGENTS.md');const user='# User\nUser prose: document sample/skills/ convention.\n- Read skills from custom/sample/skills/\n<!-- agenthaus:codex-skills -->\n- Read skills from custom/other/skills/\n';
 fs.writeFileSync(file,user+'\n<!-- agenthaus:codex-skills -->\n- Read skills from .codex/agenthaus-skills/sample/skills/\n');
 const r=isolated(f,`p.postUninstall('sample',${JSON.stringify(f.target)});`);assert.equal(r.status,0,r.stderr);const after=fs.readFileSync(file,'utf8');assert.ok(after.startsWith(user));assert.equal(after.includes('.codex/agenthaus-skills/sample/skills/'),false);
});
