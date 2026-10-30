'use strict';
const{test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const os=require('node:os');const path=require('node:path');const crypto=require('node:crypto');
const{installPlugin,updatePlugin,uninstallPlugin}=require('../src/installer.js');const provider=require('../src/providers/codex.js');
function fixture(t) {
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'codex-preflight-boundary-')));
  const realCwd=process.cwd(),repoAgents=path.resolve(__dirname,'../AGENTS.md'),repoAgentsBefore=fs.readFileSync(repoAgents);
  t.after(()=>{
    try { process.chdir(realCwd); assert.deepEqual(fs.readFileSync(repoAgents),repoAgentsBefore,'Codex fixtures must not modify repository instructions'); }
    finally { fs.rmSync(root,{recursive:true,force:true}); }
  });
  const source=path.join(root,'source/sample'),project=path.join(root,'project'),target=path.join(project,'.codex/agenthaus-skills'),config=path.join(project,'.codex/config.toml');
  fs.mkdirSync(path.join(source,'.claude-plugin'),{recursive:true});fs.mkdirSync(path.join(source,'skills/review'),{recursive:true});fs.mkdirSync(path.dirname(config),{recursive:true});
  fs.writeFileSync(path.join(source,'.claude-plugin/plugin.json'),JSON.stringify({name:'sample',version:'1.0.0',description:'Preflight fixture'}));
  fs.writeFileSync(path.join(source,'skills/review/SKILL.md'),'# Reviewed fixture');
  fs.writeFileSync(path.join(source,'.mcp.json'),JSON.stringify({mcpServers:{probe:{command:process.execPath,args:[]}}}));
  fs.writeFileSync(config,'# User config\nuser_setting = "keep"\n');fs.writeFileSync(path.join(project,'AGENTS.md'),'User instructions\n');
  // Codex intentionally locates project guidance from cwd, not from targetDir.
  process.chdir(project);
  return{root,source,project,target,config};
}
function snapshot(root){const result=[];function walk(dir=''){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const rel=path.posix.join(dir,entry.name),file=path.join(root,rel);if(entry.isDirectory()){result.push([rel,'directory']);walk(rel);}else if(entry.isSymbolicLink())result.push([rel,'symlink',fs.readlinkSync(file)]);else result.push([rel,'file',crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]);}}walk();return result.sort(([a],[b])=>a.localeCompare(b));}
for(const action of ['install','update','uninstall'])test(`actual Codex ${action} preflights malformed TOML before any payload/config/instruction/backup mutation`,t=>{const f=fixture(t);if(action!=='install')installPlugin(f.source,f.target,{method:'copy',provider});fs.writeFileSync(f.config,'[mcp_servers.invalid\n');if(action==='update'){fs.writeFileSync(path.join(f.source,'.claude-plugin/plugin.json'),JSON.stringify({name:'sample',version:'1.1.0',description:'Updated fixture'}));fs.writeFileSync(path.join(f.source,'skills/review/SKILL.md'),'Reviewed new source');}const before=snapshot(f.project);assert.throws(()=>{if(action==='install')installPlugin(f.source,f.target,{method:'copy',provider});else if(action==='update')updatePlugin(f.source,f.target,{provider});else uninstallPlugin(f.target,'sample',{provider,sourceDir:f.source});});assert.deepEqual(snapshot(f.project),before);});
test('temporary preflight fixtures leave their caller instruction file byte-identical',()=>{const caller=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'codex-caller-isolation-'))),realCwd=process.cwd(),cleanups=[];fs.writeFileSync(path.join(caller,'AGENTS.md'),'Caller instructions must remain unchanged\n');const before=fs.readFileSync(path.join(caller,'AGENTS.md'));try{process.chdir(caller);const f=fixture({after:fn=>cleanups.push(fn)});installPlugin(f.source,f.target,{method:'copy',provider});assert.deepEqual(fs.readFileSync(path.join(caller,'AGENTS.md')),before);}finally{for(const cleanup of cleanups.reverse())cleanup();process.chdir(realCwd);fs.rmSync(caller,{recursive:true,force:true});}});

test('valid isolated Codex install leaves actual repository AGENTS byte-identical',t=>{const repoAgents=path.resolve(__dirname,'../AGENTS.md'),before=fs.readFileSync(repoAgents),f=fixture(t);installPlugin(f.source,f.target,{method:'copy',provider});assert.deepEqual(fs.readFileSync(repoAgents),before);assert.match(fs.readFileSync(path.join(f.project,'AGENTS.md'),'utf8'),/agenthaus:codex-skills/);});
