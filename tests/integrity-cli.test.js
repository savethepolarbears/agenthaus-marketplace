'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bin = path.resolve('bin/agenthaus.js');
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-integrity-cli-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const source=path.join(root,'source','sample');fs.mkdirSync(path.join(source,'.claude-plugin'),{recursive:true});fs.writeFileSync(path.join(source,'.claude-plugin/plugin.json'),JSON.stringify({name:'sample',version:'1.0.0',description:'Fixture plugin'}));fs.writeFileSync(path.join(source,'README.md'),'Fixture source\n');
 const env={...process.env,AGENTHAUS_PLUGINS_DIR:path.dirname(source),AGENTHAUS_STATE_FILE:path.join(root,'ownership.json')};
 const run=args=>spawnSync(process.execPath,[bin,...args],{cwd:root,env,encoding:'utf8',timeout:10000});return {root,source,run};
}
test('strict install refuses missing or altered locks before target writes',t=>{
 const f=fixture(t);const install=['install','--plugin','sample','--target','cursor','--mode','project','--method','copy','--strict-integrity'];
 let r=f.run(install);assert.equal(r.status,1);assert.equal(fs.existsSync(path.join(f.root,'.cursor')),false);
 r=f.run(['lock','renew','--root',f.source]);assert.equal(r.status,0,r.stderr);
 fs.appendFileSync(path.join(f.source,'README.md'),'tampered');r=f.run(install);assert.equal(r.status,1);assert.equal(fs.existsSync(path.join(f.root,'.cursor')),false);
});
test('strict copied installs and sync preflight preserve a tampered installed tree on rejection',t=>{
 const f=fixture(t);let r=f.run(['lock','renew','--root',f.source]);assert.equal(r.status,0,r.stderr);
 r=f.run(['install','--plugin','sample','--target','cursor','--mode','project','--method','copy','--strict-integrity']);assert.equal(r.status,0,r.stderr);
 const installed=path.join(f.root,'.cursor/plugins/sample');const doc=path.join(installed,'README.md');fs.writeFileSync(doc,'changed installed bytes');
 r=f.run(['sync','--target','cursor','--mode','project','--strict-integrity']);assert.equal(r.status,1);assert.equal(fs.readFileSync(doc,'utf8'),'changed installed bytes');
});
test('ordinary lock verification never renews drifted content',t=>{
 const f=fixture(t);let r=f.run(['lock','renew','--root',f.source]);assert.equal(r.status,0,r.stderr);const file=path.join(f.source,'.agenthaus-lock.json'),before=fs.readFileSync(file);
 fs.appendFileSync(path.join(f.source,'README.md'),'changed');r=f.run(['lock','verify','--root',f.source]);assert.equal(r.status,1);assert.deepEqual(fs.readFileSync(file),before);
});
test('strict multi-plugin update preflights every destination before changing any earlier plugin',t=>{
 const f=fixture(t),base=path.dirname(f.source),alpha=path.join(base,'alpha'),beta=path.join(base,'beta');
 fs.renameSync(f.source,alpha);fs.cpSync(alpha,beta,{recursive:true});
 for(const [name,dir] of [['alpha',alpha],['beta',beta]]) {
  fs.writeFileSync(path.join(dir,'.claude-plugin/plugin.json'),JSON.stringify({name,version:'1.0.0',description:'Fixture plugin'}));
  fs.mkdirSync(path.join(dir,'.cursor'),{recursive:true});fs.writeFileSync(path.join(dir,'.cursor/mcp.json'),JSON.stringify({mcpServers:{fixture:{command:process.execPath,args:['-e','process.exit(0)']}}}));
  const r=f.run(['lock','renew','--root',dir]);assert.equal(r.status,0,r.stderr);
 }
 let r=f.run(['install','--all','--target','cursor','--mode','project','--method','copy','--strict-integrity']);assert.equal(r.status,0,r.stderr);
 fs.writeFileSync(path.join(alpha,'README.md'),'Reviewed alpha update');r=f.run(['lock','renew','--root',alpha]);assert.equal(r.status,0,r.stderr);
 const installed=path.join(f.root,'.cursor/plugins');fs.writeFileSync(path.join(installed,'beta/README.md'),'Tampered beta');
 const originalAlpha=fs.readFileSync(path.join(installed,'alpha/README.md'));const originalConfig=fs.readFileSync(path.join(f.root,'.cursor/mcp.json'));
 r=f.run(['update','--all','--target','cursor','--mode','project','--strict-integrity']);assert.equal(r.status,1);
 assert.deepEqual(fs.readFileSync(path.join(installed,'alpha/README.md')),originalAlpha,'earlier payload changed before later failure');
 assert.deepEqual(fs.readFileSync(path.join(f.root,'.cursor/mcp.json')),originalConfig,'provider config changed before preflight completed');
});
