'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildCapabilities, pageCapabilities, readSkill, updateDiscoveryRegion, benchmarkContext } = require('../src/capabilities.js');
function fixture(t) {
 const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-capabilities-'));
 t.after(() => fs.rmSync(root, { recursive: true, force: true }));
 for (const name of ['alpha','beta']) {
  const p=path.join(root,name);fs.mkdirSync(path.join(p,'.claude-plugin'),{recursive:true});fs.mkdirSync(path.join(p,'skills','example'),{recursive:true});
  fs.writeFileSync(path.join(p,'.claude-plugin/plugin.json'),JSON.stringify({name,version:'1.0.0',description:'Fixture plugin',skills:['./skills/example']}));
  fs.writeFileSync(path.join(p,'skills/example/SKILL.md'),'---\nname: example\ndescription: Use when testing bounded discovery.\n---\n\nBODY_SENTINEL_'+name+'\n');
 }
 return root;
}
test('discovery is deterministic, body-free and covers each selected skill',t=>{
 const root=fixture(t),a=buildCapabilities({pluginsDir:root}),b=buildCapabilities({pluginsDir:root});
 assert.deepEqual(a,b);assert.equal(a.entries.length,2);assert.equal(JSON.stringify(a).includes('BODY_SENTINEL'),false);
 const seen=[];let cursor;
 do {const p=pageCapabilities(a,{limit:1,cursor});seen.push(...p.entries.map(e=>e.id));cursor=p.next_cursor;} while(cursor);
 assert.equal(new Set(seen).size,2);
 assert.throws(()=>pageCapabilities(a,{limit:0}));assert.throws(()=>pageCapabilities(a,{cursor:'../bad'}));
});
test('stale paging cursor and changed skill content fail closed',t=>{
 const root=fixture(t),a=buildCapabilities({pluginsDir:root});const cursor=pageCapabilities(a,{limit:1}).next_cursor;
 fs.appendFileSync(path.join(root,'alpha/skills/example/SKILL.md'),'changed');
 const b=buildCapabilities({pluginsDir:root});assert.throws(()=>pageCapabilities(b,{cursor,limit:1}));
 assert.throws(()=>readSkill(a,'alpha/example',{pluginsDir:root}));
});
test('safe read uses current manifest identity and rejects traversal, missing entries and symlink escapes',t=>{
 const root=fixture(t),a=buildCapabilities({pluginsDir:root});
 assert.match(readSkill(a,'alpha/example',{pluginsDir:root}).content,/BODY_SENTINEL_alpha/);
 for(const id of ['../example','alpha/../example','missing/example','alpha/absent'])assert.throws(()=>readSkill(a,id,{pluginsDir:root}));
 const file=path.join(root,'alpha/skills/example/SKILL.md');fs.unlinkSync(file);
 try{fs.symlinkSync(path.join(root,'beta/skills/example/SKILL.md'),file);}catch{fs.rmdirSync(path.dirname(file));fs.symlinkSync(path.join(root,'beta/skills/example'),path.dirname(file),'junction');}
 assert.throws(()=>readSkill(a,'alpha/example',{pluginsDir:root}));
});
test('managed discovery preserves unrelated prose and rejects malformed markers without producing output',()=>{
 const source='# User instructions\nKeep this exact line.\n';const reference='Use agenthaus capabilities page with an explicit plugin root.';
 const once=updateDiscoveryRegion(source,reference,{maxBytes:2048});assert.ok(once.startsWith(source));assert.equal(updateDiscoveryRegion(once,reference,{maxBytes:2048}),once);
 assert.throws(()=>updateDiscoveryRegion('<!-- agenthaus:discovery:start -->\nbroken',reference));
 assert.throws(()=>updateDiscoveryRegion(source,'x'.repeat(3000),{maxBytes:2048}));
});
test('context report distinguishes exact bytes from a labeled estimate and checks routing coverage',t=>{
 const root=fixture(t),a=buildCapabilities({pluginsDir:root});const result=benchmarkContext(a,{pluginsDir:root});
 assert.equal(result.tokenizer,'none');assert.equal(result.token_estimate_method,'ceil(utf8_bytes/4)');assert.equal(result.routing.covered,2);assert.equal(result.routing.missing,0);assert.ok(result.baseline_bytes>0);
});
test('discovery pages stay within the labeled 2000-token estimate budget',t=>{
 const root=fixture(t),a=buildCapabilities({pluginsDir:root});
 const page=pageCapabilities(a,{limit:100,maxBytes:8000});assert.ok(Buffer.byteLength(JSON.stringify(page))<=8000);
 assert.throws(()=>pageCapabilities(a,{limit:100,maxBytes:8001}));
});
test('coercible arrays cannot masquerade as manifest string identities or digests',t=>{
 const root=fixture(t),original=buildCapabilities({pluginsDir:root});
 for(const field of ['plugin','name','sha256']) {
  const bad=structuredClone(original);bad.entries[0][field]=[bad.entries[0][field]];bad.manifest_sha256=require('../src/safety-policy.js').digest(bad.entries);
  assert.throws(()=>pageCapabilities(bad));
 }
});
