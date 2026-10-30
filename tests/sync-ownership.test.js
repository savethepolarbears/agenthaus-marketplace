'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const {spawnSync}=require('node:child_process');const bin=path.resolve('bin/agenthaus.js');
test('ordinary sync cannot register a foreign unowned copied plugin directory',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-unowned-sync-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const source=path.join(root,'source/sample'),foreign=path.join(root,'.cursor/plugins/sample');
 for(const dir of [source,foreign]){fs.mkdirSync(path.join(dir,'.claude-plugin'),{recursive:true});fs.mkdirSync(path.join(dir,'.cursor'),{recursive:true});fs.writeFileSync(path.join(dir,'.claude-plugin/plugin.json'),'{"name":"sample","version":"1.0.0","description":"Fixture"}');fs.writeFileSync(path.join(dir,'.cursor/mcp.json'),JSON.stringify({mcpServers:{foreign:{command:'node',args:[]}}}));}
 const state=path.join(root,'ownership.json');const result=spawnSync(process.execPath,[bin,'sync','--target','cursor','--mode','project'],{cwd:root,env:{...process.env,AGENTHAUS_PLUGINS_DIR:path.dirname(source),AGENTHAUS_STATE_FILE:state},encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(fs.existsSync(path.join(root,'.cursor/mcp.json')),false);assert.equal(fs.existsSync(state),false);assert.equal(fs.existsSync(path.join(foreign,'.claude-plugin/plugin.json')),true);
});
