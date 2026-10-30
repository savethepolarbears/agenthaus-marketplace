'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {listSkills,readSidecar,inspectPermissions,validateSkillFile,parseFrontmatter}=require('../src/skill-metadata.js');
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'skill-metadata-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const plugin=path.join(root,'sample');
 const write=(rel,content)=>{const p=path.join(plugin,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof content==='string'?content:JSON.stringify(content));return p;};
 write('.claude-plugin/plugin.json',{name:'sample',skills:['./skills/example']});
 const skill=write('skills/example/SKILL.md','---\nname: example\ndescription: Use when testing skill metadata.\n---\nBody.');
 return {root,plugin,write,skill};
}
test('actual corpus has 48 valid uniquely identified skills with preserved aliases',()=>{
 const skills=listSkills(path.resolve(__dirname,'../plugins'));
 assert.equal(skills.length,48);assert.equal(new Set(skills.map(s=>s.id)).size,48);
 assert.deepEqual(skills.find(s=>s.id==='neuronwriter:skill:seo-content').aliases,['seo-content-optimization']);
 assert.deepEqual(skills.find(s=>s.id==='openclaw-bridge:skill:conversion').aliases,['agenthaus-to-openclaw']);
});
test('optional scalar fields and metadata string map parse without granting permission',t=>{
 const f=fixture(t);f.write('skills/example/SKILL.md',"---\nname: example\ndescription: 'Use when testing: metadata.'\nlicense: MIT\ncompatibility: Requires Node.js\nallowed-tools: Read Bash(git:*)\nmetadata:\n  author: 'AgentHaus'\n  version: \"1.0\"\n---\nBody");
 const [s]=listSkills(f.root);assert.equal(s.allowedTools,'Read Bash(git:*)');assert.deepEqual(s.metadata,{author:'AgentHaus',version:'1.0'});
 const inspect=inspectPermissions(f.plugin,{skill:'example'});assert.equal(inspect.declaration_status,'undeclared');assert.equal(inspect.enforcement_status,'not_enforced');assert.equal(inspect.requested.tools,null);
});
test('missing sidecar remains undeclared with unknown permissions',t=>{
 const f=fixture(t);assert.equal(readSidecar(f.plugin),null);assert.deepEqual(inspectPermissions(f.plugin).requested,{tools:null,hosts:null,environment:null,security:null});
});
test('sidecar aliases and requested permissions are declarations only',t=>{
 const f=fixture(t);f.write('agenthaus.json',{schema_version:1,plugin:'sample',permissions:{tools:['Read'],hosts:['api.example.com'],environment:['API_TOKEN'],security:{requires_approval:true}},skills:{example:{aliases:['old-example'],triggers:['inspect metadata']}}});
 const [s]=listSkills(f.root);assert.deepEqual(s.aliases,['old-example']);const out=inspectPermissions(f.plugin,{skill:'example'});assert.equal(out.declaration_status,'declared');assert.equal(out.enforcement_status,'not_enforced');assert.deepEqual(out.requested.environment,['API_TOKEN']);
});
test('malformed, unsupported and duplicate YAML fails with location diagnostics',()=>{
 for(const front of ['name: example\nname: other\ndescription: Test','name: example\ndescription: |\n  multiline','name: example\ndescription: *alias','name: example\ndescription: Test\nmetadata:\n  author: Alice\n  author: Bob','name: example\ndescription: Test\nunknown: field']){
  assert.throws(()=>parseFrontmatter('---\n'+front+'\n---\nBody','fixture'),/fixture/);
 }
});
test('frontmatter enforces names, descriptions and optional field boundaries',()=>{
 for(const front of ['name: Bad\ndescription: Test','name: a--b\ndescription: Test','name: '+ 'a'.repeat(65)+'\ndescription: Test','name: example\ndescription: '+ 'x'.repeat(1025),'name: example\ndescription: Test\ncompatibility: '+ 'x'.repeat(501),'name: example\ndescription: Test\nmetadata:\n  count: 123']) assert.throws(()=>parseFrontmatter('---\n'+front+'\n---','fixture'));
 assert.equal(parseFrontmatter('---\nname: example\ndescription: '+ 'x'.repeat(1024)+'\n---','fixture').description.length,1024);
});
test('skill identity and directory containment reject traversal and escaping symlinks',t=>{
 const f=fixture(t);assert.throws(()=>listSkills(f.root,{plugins:['../sample']}),/plugin/);
 f.write('skills/example/SKILL.md','---\nname: wrong\ndescription: Test\n---');assert.throws(()=>validateSkillFile(f.skill,f.plugin),/match/);
 fs.rmSync(path.join(f.plugin,'skills/example'),{recursive:true});const outside=path.join(f.root,'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside,'SKILL.md'),'---\nname: example\ndescription: Test\n---');fs.symlinkSync(outside,path.join(f.plugin,'skills/example'));assert.throws(()=>listSkills(f.root,{plugins:['sample']}),/contain|escape/);
});
test('sidecars reject unknown versions, identities, env values, hosts and unsafe skill keys',t=>{
 const f=fixture(t);
 for(const extra of [{schema_version:2},{plugin:'wrong'},{unknown:true},{permissions:{environment:['TOKEN=secret']}},{permissions:{hosts:['https://user:pass@example.com/path']}},{skills:{'../escape':{}}},{skills:{missing:{}}},{skills:{example:{aliases:['example']}}}]){
  f.write('agenthaus.json',{schema_version:1,plugin:'sample',...extra});assert.throws(()=>readSidecar(f.plugin));
 }
});
test('installed plugin symlink is valid but sidecar escape and excessive file sizes fail',t=>{
 const f=fixture(t);const installed=path.join(f.root,'installed');fs.mkdirSync(installed);fs.symlinkSync(f.plugin,path.join(installed,'sample'));assert.equal(listSkills(installed).length,1);
 const external=path.join(f.root,'external.json');fs.writeFileSync(external,'{}');fs.symlinkSync(external,path.join(f.plugin,'agenthaus.json'));assert.throws(()=>readSidecar(f.plugin),/contain|escape/);
 fs.unlinkSync(path.join(f.plugin,'agenthaus.json'));f.write('agenthaus.json',' '.repeat(65537));assert.throws(()=>readSidecar(f.plugin),/limit/);
});
test('oversized skills and headers fail before unbounded file ingestion',t=>{
 const f=fixture(t);f.write('skills/example/SKILL.md','x'.repeat(1024*1024+1));assert.throws(()=>validateSkillFile(f.skill,f.plugin),/limit/);
 assert.throws(()=>parseFrontmatter('---\nname: example\ndescription: '+ 'x'.repeat(16384)+'\n---','fixture'),/limit/);
});
test('permission inspection remains additive and never prints an invalid declaration value',t=>{
 const f=fixture(t);
 f.write('agenthaus.json',{schema_version:1,plugin:'sample',permissions:{tools:['Read'],security:{requires_approval:true}},skills:{example:{permissions:{tools:['Write'],environment:[],security:{requires_approval:false}}}}});
 const out=inspectPermissions(f.plugin,{skill:'example'});assert.deepEqual(out.requested.tools,['Read','Write']);assert.deepEqual(out.requested.environment,[]);assert.equal(out.requested.hosts,null);assert.equal(out.requested.security.requires_approval,true);assert.equal(out.enforcement_status,'not_enforced');
 f.write('agenthaus.json',{schema_version:1,plugin:'sample',permissions:{environment:['SYNTHETIC=not-a-real-credential']}});
 assert.throws(()=>readSidecar(f.plugin),error=>!error.message.includes('not-a-real-credential'));
});

test('implicit YAML numbers must be quoted when used as string metadata',()=>{for(const value of ['0xFF','1e3','.nan','.inf','0o77']) assert.throws(()=>parseFrontmatter('---\nname: example\ndescription: Test\nmetadata:\n  value: '+value+'\n---','fixture'),/quote/);});
