'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');const {spawnSync}=require('node:child_process');const bin=path.resolve('bin/agenthaus.js'),sqlite='/usr/bin/sqlite3';
function fixture(t){const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-task-cli-')));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const db=path.join(root,'.agenthaus/blackboard/tasks.db');const common=['--root',root,'--db',db,'--sqlite-binary',sqlite];const run=args=>spawnSync(process.execPath,[bin,'task',...args,...common],{encoding:'utf8',timeout:10000,maxBuffer:8*1024*1024});return{root,db,run};}
test('task capability and missing reads create no database',t=>{
 const f=fixture(t);let r=f.run(['capabilities']);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).backend,'sqlite-cli');assert.equal(fs.existsSync(f.db),false);
 r=f.run(['list']);assert.equal(r.status,1);assert.equal(fs.existsSync(f.db),false);
});
test('task CLI enqueues, leases, heartbeats, completes and rejects duplicate completion',{skip:!fs.existsSync(sqlite)},t=>{
 const f=fixture(t),file=path.join(f.root,'task.json'),resultFile=path.join(f.root,'result.json');
 const task={schema_version:1,kind:'task',task_id:crypto.randomUUID(),correlation_id:crypto.randomUUID(),producer:'node:fixture:dispatch',consumer:'node:fixture:worker',created_at:new Date().toISOString(),status:'pending',input:{fixture:true},output:null,evidence:[]};fs.writeFileSync(file,JSON.stringify(task));
 let r=f.run(['enqueue','--envelope',file]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).status,'enqueued');
 r=f.run(['claim','--task-id',task.task_id,'--owner',task.consumer]);assert.equal(r.status,0,r.stderr);const lease=JSON.parse(r.stdout);assert.equal(lease.fence,'1');
 r=f.run(['heartbeat','--task-id',task.task_id,'--owner',task.consumer,'--fence',lease.fence]);assert.equal(r.status,0,r.stderr);
 fs.writeFileSync(path.join(f.root,'output.txt'),'fixture');const result={...task,kind:'result',status:'completed',producer:task.consumer,consumer:task.producer,input:null,output:{fixture:true},created_at:new Date().toISOString(),evidence:[{artifact_path:'output.txt',sha256:crypto.createHash('sha256').update('fixture').digest('hex')}]};fs.writeFileSync(resultFile,JSON.stringify(result));
 const complete=['complete','--task-id',task.task_id,'--owner',task.consumer,'--fence',lease.fence,'--result',resultFile];r=f.run(complete);assert.equal(r.status,0,r.stderr);r=f.run(complete);assert.equal(r.status,1);
 r=f.run(['read','--task-id',task.task_id]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).task.status,'completed');
});
test('migration dry-run does not create state or imply the old owner stopped',t=>{
 const f=fixture(t),mapping=path.join(f.root,'mapping.json');fs.writeFileSync(mapping,JSON.stringify({producer:'node:fixture:dispatch',consumer:'node:fixture:worker'}));
 const r=f.run(['migrate','--dry-run','--mapping',mapping]);assert.equal(r.status,0,r.stderr);assert.equal(fs.existsSync(f.db),false);assert.equal(JSON.parse(r.stdout).version,1);
});
test('unsupported dry-run combinations reject before any write or hook execution',t=>{
 const f=fixture(t),taskFile=path.join(f.root,'pending.json'),manifest=path.join(f.root,'caps.json');const task={schema_version:1,kind:'task',task_id:crypto.randomUUID(),correlation_id:crypto.randomUUID(),producer:'node:fixture:dispatch',consumer:'node:fixture:worker',created_at:new Date().toISOString(),status:'pending',input:{fixture:true},output:null,evidence:[]};fs.writeFileSync(taskFile,JSON.stringify(task));
 let r=f.run(['enqueue','--envelope',taskFile,'--dry-run']);assert.equal(r.status,1);assert.equal(fs.existsSync(f.db),false);
 r=spawnSync(process.execPath,[bin,'capabilities','build','--plugins-dir',path.resolve('plugins'),'--output',manifest,'--dry-run'],{encoding:'utf8'});assert.equal(r.status,1);assert.equal(fs.existsSync(manifest),false);
 const plugin=path.join(f.root,'sample');fs.mkdirSync(path.join(plugin,'.claude-plugin'),{recursive:true});fs.writeFileSync(path.join(plugin,'.claude-plugin/plugin.json'),'{"name":"sample","version":"1.0.0","description":"Fixture"}');
 r=spawnSync(process.execPath,[bin,'lock','renew','--root',plugin,'--dry-run'],{encoding:'utf8'});assert.equal(r.status,1);assert.equal(fs.existsSync(path.join(plugin,'.agenthaus-lock.json')),false);
 const marker=path.join(f.root,'hook-ran'),config=path.join(f.root,'hook.json');fs.writeFileSync(config,JSON.stringify({event:'PreToolUse',executable:process.execPath,args:['-e',`require('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');console.log('{"status":"allowed"}')`],cwd:f.root,envAllowlist:[],rule:{id:'fixture',reason:'Check',remediation:'Review'}}));
 r=spawnSync(process.execPath,[bin,'hook','run','--config',config,'--dry-run'],{input:'{}',encoding:'utf8'});assert.equal(r.status,1);assert.equal(fs.existsSync(marker),false);
});
test('migration dry-run output cannot create database or legacy state',t=>{
 const f=fixture(t),mapping=path.join(f.root,'mapping.json');fs.writeFileSync(mapping,JSON.stringify({producer:'node:fixture:dispatch',consumer:'node:fixture:worker'}));
 for(const output of [f.db,f.db+'-wal',f.db+'-shm',f.db+'-journal',f.db.toUpperCase(),path.join(f.root,'.context/pending/plan.json'),path.join(f.root,'.CONTEXT/pending/plan.json')]) {
  const r=f.run(['migrate','--dry-run','--mapping',mapping,'--output',output]);assert.equal(r.status,1,r.stderr);assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(f.db),false);
 }
 const output=path.join(f.root,'reports/migration-plan.json');const r=f.run(['migrate','--dry-run','--mapping',mapping,'--output',output]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(fs.readFileSync(output)).version,1);assert.equal(fs.existsSync(f.db),false);
});
test('migration preview rejects plans exceeding the apply reader limit before output writes',t=>{
 const f=fixture(t),mapping=path.join(f.root,'mapping.json'),output=path.join(f.root,'reports/plan.json');fs.writeFileSync(mapping,JSON.stringify({producer:'node:fixture:dispatch',consumer:'node:fixture:worker'}));fs.mkdirSync(path.join(f.root,'.context/inbox'),{recursive:true});
 for(let i=0;i<5;i++)fs.writeFileSync(path.join(f.root,'.context/inbox',i+'.json'),JSON.stringify({task_id:'legacy-'+i,requirements:'x'.repeat(900000),status:'pending',assigned_to:null,created_at:new Date().toISOString(),completed_at:null,result:null,priority:'normal',retries:0,max_retries:3}));
 const r=f.run(['migrate','--dry-run','--mapping',mapping,'--output',output]);assert.equal(r.status,1);assert.match(r.stderr,/Migration plan exceeds/);assert.equal(fs.existsSync(output),false);assert.equal(fs.existsSync(f.db),false);
});
