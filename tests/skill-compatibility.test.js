'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const definitions=fs.readFileSync(process.env.PLUGIN_VALIDATOR_UNDER_TEST || path.join(root,'scripts/validate-plugins.sh'),'utf8').split('\n# Main\n')[0];
function check(t,reference,{scalar=false}={}) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'skill-compatibility-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 for(const folder of ['scripts','schemas','plugins/sample/.claude-plugin','plugins/sample/skills/example']) fs.mkdirSync(path.join(dir,folder),{recursive:true});
 fs.copyFileSync(path.join(root,'scripts/validate-schema.js'),path.join(dir,'scripts/validate-schema.js'));
 fs.copyFileSync(path.join(root,'schemas/plugin.schema.json'),path.join(dir,'schemas/plugin.schema.json'));
 fs.writeFileSync(path.join(dir,'plugins/sample/.claude-plugin/plugin.json'),JSON.stringify({name:'sample',version:'1.0.0',description:'Compatibility fixture',skills:scalar?reference:[reference]}));
 fs.writeFileSync(path.join(dir,'plugins/sample/skills/example/SKILL.md'),'---\nname: example\ndescription: Use when testing compatibility.\n---\nTest');
 fs.writeFileSync(path.join(dir,'scripts/run.sh'),definitions+'\nvalidate_plugin "$PLUGINS_DIR/sample"\nif [[ "$fail_count" -gt 0 ]]; then exit 1; fi\n');
 return spawnSync('bash',[path.join(dir,'scripts/run.sh')],{encoding:'utf8'});
}
test('local plugin validator accepts explicit native skill directory references',t=>{const r=check(t,'./skills/example');assert.equal(r.status,0,r.stdout+r.stderr);});
test('local plugin validator rejects obsolete skill file references',t=>{const r=check(t,'./skills/example/SKILL.md');assert.equal(r.status,1,r.stdout+r.stderr);});
test('local plugin validator rejects escaping skill directories',t=>{const r=check(t,'./../');assert.equal(r.status,1,r.stdout+r.stderr);});

test('local plugin validator checks scalar skill directory paths instead of skipping them',t=>{assert.equal(check(t,'./skills/example',{scalar:true}).status,0);assert.equal(check(t,'./skills/missing',{scalar:true}).status,1);assert.equal(check(t,'./skills/example/SKILL.md',{scalar:true}).status,1);});
