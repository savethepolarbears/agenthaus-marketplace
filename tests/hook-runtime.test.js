'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {runHook,adaptClaudeResult,getIsolationCapabilities}=require('../src/hook-runtime.js');
const rule={id:'fixture-rule',reason:'Operation requires operator review.',remediation:'Review the exact operation before retrying.'};
function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hook-runtime-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
function typed(status,event='PreToolUse'){return {schema_version:1,event,status,rule_id:rule.id,reason:rule.reason,remediation:rule.remediation,execution:{launched:true,exit_code:0,signal:null,timed_out:false,output_limited:false},isolation:getIsolationCapabilities()};}
function config(cwd,code,extra={}){return {event:'PreToolUse',executable:process.execPath,args:['-e',code],cwd,envAllowlist:[],timeoutMs:1000,killGraceMs:40,outputLimitBytes:4096,requireProcessTree:process.platform!=='win32',rule,...extra};}
test('native adapter keeps PreToolUse deny and runtime error blocking without bypassing normal approvals',()=>{
 for(const status of ['blocked','error']){const r=adaptClaudeResult('PreToolUse',typed(status));assert.equal(r.exitCode,2);assert.equal(r.stdout,'');}
 const allowed=adaptClaudeResult('PreToolUse',typed('allowed'));assert.equal(allowed.exitCode,0);assert.equal(allowed.stdout,'');
 assert.equal(adaptClaudeResult('PostToolUse',typed('blocked','PostToolUse')).exitCode,1);
});
test('runner copies explicit environment names only and never returns raw child stderr',async t=>{
 const cwd=fixture(t),marker='synthetic-canary-not-a-credential';
 const r=await runHook(config(cwd,"if(process.env.DISALLOWED_CANARY!==undefined||process.env.APP_ALLOWED!=='yes')process.exit(3);console.error('synthetic-canary-not-a-credential');console.log(JSON.stringify({status:'allowed'}));",{envAllowlist:['APP_ALLOWED']}),{env:{DISALLOWED_CANARY:marker,APP_ALLOWED:'yes'}});
 assert.equal(r.status,'allowed');assert.equal(r.execution.launched,true);assert.ok(!JSON.stringify(r).includes(marker));
});
test('native exit2 cannot be overridden by allowed stdout',async t=>{
 const r=await runHook(config(fixture(t),"console.log(JSON.stringify({status:'allowed'}));process.exitCode=2;"));assert.equal(r.status,'blocked');assert.equal(adaptClaudeResult('PreToolUse',r).exitCode,2);
});
test('PostToolUse cannot claim to undo an executed operation',async t=>{
 const r=await runHook(config(fixture(t),"console.log(JSON.stringify({status:'blocked'}));",{event:'PostToolUse'}));assert.equal(r.status,'error');assert.match(r.reason,/already|cannot/i);assert.equal(adaptClaudeResult('PostToolUse',r).exitCode,1);
});
test('malformed, extra-field and untrusted child diagnostics fail without leaking values',async t=>{
 const cwd=fixture(t);
 for(const code of ["console.log('synthetic-private-value');","console.log(JSON.stringify({status:'unknown'}));","console.log(JSON.stringify({status:'blocked',reason:'synthetic-private-value'}));"]){const r=await runHook(config(cwd,code));assert.equal(r.status,'error');assert.ok(!JSON.stringify(r).includes('synthetic-private-value'));assert.equal(adaptClaudeResult('PreToolUse',r).exitCode,2);}
});
test('unsupported required isolation fails before child launch',async t=>{
 const cwd=fixture(t),sentinel=path.join(cwd,'launched');
 for(const isolation of ['filesystem','network','filesystem-network']){const r=await runHook(config(cwd,`require('fs').writeFileSync(${JSON.stringify(sentinel)},'bad')`,{requiredIsolation:isolation}));assert.equal(r.status,'error');assert.equal(r.execution.launched,false);assert.equal(fs.existsSync(sentinel),false);}
 assert.equal(getIsolationCapabilities().filesystem,false);assert.equal(getIsolationCapabilities().network,false);
});
test('shell metacharacters remain literal arguments',async t=>{
 const cwd=fixture(t),sentinel=path.join(cwd,'injected'),literal=`$(touch ${sentinel}); echo injected`;
 const r=await runHook({...config(cwd,''),args:['-e',"if(!process.argv[1].startsWith('$(touch '))process.exit(3);console.log(JSON.stringify({status:'allowed'}))",literal]});assert.equal(r.status,'allowed');assert.equal(fs.existsSync(sentinel),false);
});
test('output and input byte ceilings fail safely',async t=>{
 const cwd=fixture(t);const output=await runHook(config(cwd,"process.stderr.write('x'.repeat(20000));setInterval(()=>{},1000)",{outputLimitBytes:128}));assert.equal(output.status,'error');assert.equal(output.execution.output_limited,true);
 const input=await runHook(config(cwd,"console.log(JSON.stringify({status:'allowed'}))"),{input:'x'.repeat(4*1024*1024+1)});assert.equal(input.status,'error');assert.equal(input.execution.launched,false);
});
test('invalid config and unavailable executable do not leak raw values or launch',async t=>{
 const cwd=fixture(t);for(const extra of [{executable:'relative-command'},{executable:path.join(cwd,'missing')},{envAllowlist:['NAME=synthetic-private-value']},{timeoutMs:0},{event:'PermissionRequest'}]){const r=await runHook(config(cwd,'',extra));assert.equal(r.status,'error');assert.equal(r.execution.launched,false);assert.ok(!JSON.stringify(r).includes('synthetic-private-value'));}
});
test('timeout terminates a stubborn descendant and handles a leader exiting before cleanup',async t=>{
 if(process.platform==='win32')return t.skip('POSIX process group fixture');
 const cwd=fixture(t);
 for(const exitsEarly of [false,true]){
  const pidfile=path.join(cwd,exitsEarly?'early.pid':'timeout.pid');
  const childCode="process.on('SIGTERM',()=>{});require('fs').writeFileSync(process.argv[1],String(process.pid));setInterval(()=>{},1000)";
  const code=`const c=require('child_process').spawn(process.execPath,['-e',${JSON.stringify(childCode)},${JSON.stringify(pidfile)}],{stdio:'ignore'});const f=require('fs');const timer=setInterval(()=>{if(f.existsSync(${JSON.stringify(pidfile)})){clearInterval(timer);${exitsEarly?"console.log(JSON.stringify({status:'allowed'}));process.exit(0)":"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"}}},5)`;
  const r=await runHook(config(cwd,code,{timeoutMs:1500,killGraceMs:50}));
  assert.equal(r.execution.timed_out,!exitsEarly);assert.equal(r.status,exitsEarly?'allowed':'error');
  const pid=Number(fs.readFileSync(pidfile,'utf8'));let alive=true;
  for(let n=0;n<30;n++){try{process.kill(pid,0)}catch{alive=false;break;}await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(alive,false,'descendant must not outlive bounded cleanup');
 }
});

test('adapters reject malformed and mismatched allowed results',()=>{
 assert.equal(adaptClaudeResult('PreToolUse',{status:'allowed'}).exitCode,2);
 assert.equal(adaptClaudeResult('PreToolUse',typed('allowed','PostToolUse')).exitCode,2);
});
test('exact output and input byte ceilings allow bounded valid results',async t=>{
 const cwd=fixture(t),raw=JSON.stringify({status:'allowed'});
 const exact=await runHook(config(cwd,`process.stdout.write(${JSON.stringify(raw)})`,{outputLimitBytes:Buffer.byteLength(raw)}));assert.equal(exact.status,'allowed');
 const over=await runHook(config(cwd,`process.stdout.write(${JSON.stringify(raw)})`,{outputLimitBytes:Buffer.byteLength(raw)-1}));assert.equal(over.status,'error');assert.equal(over.execution.output_limited,true);
 const input=await runHook(config(cwd,"let n=0;process.stdin.on('data',b=>n+=b.length);process.stdin.on('end',()=>console.log(JSON.stringify({status:n===4194304?'allowed':'error'})))"),{input:Buffer.alloc(4*1024*1024,120)});assert.equal(input.status,'allowed');
});
test('termination errors cannot produce an allowed result and return bounded safe diagnostics',async t=>{
 if(process.platform==='win32')return t.skip('POSIX process group fixture');
 const cwd=fixture(t),originalKill=process.kill;
 let group;
 try {
  process.kill=function(target,signal){if(target<0){group=target;const error=new Error('synthetic-private-value');error.code='EPERM';throw error;}return originalKill.call(process,target,signal);};
  const r=await runHook(config(cwd,"console.log(JSON.stringify({status:'allowed'}));setInterval(()=>{},1000)",{timeoutMs:120,killGraceMs:20}));
  assert.equal(r.status,'error');assert.ok(!JSON.stringify(r).includes('synthetic-private-value'));assert.match(r.reason,/cleanup/i);
 } finally {process.kill=originalKill;if(group)try{process.kill(group,'SIGKILL')}catch{}}
});
test('contradictory allowed envelopes never become native permission success',()=>{
 for(const patch of [{exit_code:2},{launched:false},{timed_out:true},{output_limited:true},{signal:'SIGTERM'}]) {
  const result=typed('allowed');Object.assign(result.execution,patch);assert.equal(adaptClaudeResult('PreToolUse',result).exitCode,2);
 }
});
test('ambient interpreter startup controls and nonstring rule IDs fail before launch',async t=>{
 const cwd=fixture(t),marker=path.join(cwd,'must-not-run');
 const code=`require('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');console.log('{"status":"allowed"}')`;
 for(const name of ['NODE_OPTIONS','BASH_ENV','PYTHONPATH','LD_PRELOAD','DYLD_INSERT_LIBRARIES']) {
  const result=await runHook(config(cwd,code,{envAllowlist:[name]}),{env:{[name]:'synthetic-startup-control'}});assert.equal(result.status,'error');assert.equal(result.execution.launched,false);
 }
 const result=await runHook(config(cwd,code,{rule:{...rule,id:['fixture-rule']}}));assert.equal(result.status,'error');assert.equal(result.execution.launched,false);assert.equal(fs.existsSync(marker),false);
});
