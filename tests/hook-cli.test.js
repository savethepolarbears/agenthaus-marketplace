'use strict';
const { test } = require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {spawnSync}=require('node:child_process');const bin=path.resolve('bin/agenthaus.js');
function fixture(t,status='blocked') {const dir=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-hook-cli-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'hook.json');fs.writeFileSync(file,JSON.stringify({event:'PreToolUse',executable:process.execPath,args:['-e',`console.log(JSON.stringify({status:${JSON.stringify(status)}}))`],cwd:dir,envAllowlist:[],requireProcessTree:process.platform!=='win32',rule:{id:'fixture',reason:'Review required',remediation:'Review the original request.'}}));return file;}
test('hook CLI reports capabilities without launching and native block remains exit2',t=>{
 let r=spawnSync(process.execPath,[bin,'hook','capabilities'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).filesystem,false);
 const file=fixture(t);r=spawnSync(process.execPath,[bin,'hook','run','--config',file,'--claude'],{input:'{}',encoding:'utf8'});assert.equal(r.status,2,r.stderr);assert.equal(r.stdout,'');assert.match(r.stderr,/Review/);
});
test('typed hook diagnostics return nonzero for blocked and zero only for allowed',t=>{
 for(const status of ['blocked','allowed']) {const file=fixture(t,status);const r=spawnSync(process.execPath,[bin,'hook','run','--config',file],{input:'{}',encoding:'utf8'});assert.equal(r.status,status==='allowed'?0:1,r.stderr);assert.equal(JSON.parse(r.stdout).status,status);}
});
test('malformed JSON config cannot echo its sensitive-looking contents',t=>{
 const file=fixture(t);fs.writeFileSync(file,'{"SYNTHETIC_PRIVATE_VALUE":"not valid JSON');const r=spawnSync(process.execPath,[bin,'hook','run','--config',file],{input:'{}',encoding:'utf8'});assert.equal(r.status,1);assert.equal((r.stdout+r.stderr).includes('SYNTHETIC_PRIVATE_VALUE'),false);
});
