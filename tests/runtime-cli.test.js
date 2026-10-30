'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const bin = path.resolve('bin/agenthaus.js');
const plugins = path.resolve('plugins');
function run(args) { return spawnSync(process.execPath,[bin,...args],{encoding:'utf8',timeout:20000}); }
test('new discovery CLI builds schema-valid body-free output and pages it',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-runtime-cli-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const manifest=path.join(root,'capabilities.json');
 const built=run(['capabilities','build','--plugins-dir',plugins,'--output',manifest]);assert.equal(built.status,0,built.stderr);assert.ok(fs.existsSync(manifest));
 const page=run(['capabilities','page','--manifest',manifest,'--limit','3']);assert.equal(page.status,0,page.stderr);const result=JSON.parse(page.stdout);assert.equal(result.entries.length,3);assert.ok(result.next_cursor);
 const next=run(['capabilities','page','--manifest',manifest,'--limit','3','--cursor',result.next_cursor]);assert.equal(next.status,0,next.stderr);assert.notEqual(JSON.parse(next.stdout).entries[0].id,result.entries[0].id);
 const large=run(['capabilities','page','--manifest',manifest,'--limit','100']);assert.equal(large.status,0,large.stderr);assert.ok(Buffer.byteLength(large.stdout)<=8000,'actual formatted page exceeds Tier1 estimate budget');
});
test('skill read, validation and permission inspection are read-only and resolve canonical identities',()=>{
 const read=run(['skill','read','agent-memory/memory-protocol','--plugins-dir',plugins,'--json']);assert.equal(read.status,0,read.stderr);assert.match(JSON.parse(read.stdout).content,/Optional Memory Protocol/);
 const validate=run(['skill','validate','--plugins-dir',plugins]);assert.equal(validate.status,0,validate.stderr);assert.equal(JSON.parse(validate.stdout).skills,48);
 const permissions=run(['permissions','agent-memory','--plugins-dir',plugins]);assert.equal(permissions.status,0,permissions.stderr);assert.equal(JSON.parse(permissions.stdout).enforcement_status,'not_enforced');
 const bad=run(['skill','read','../outside','--plugins-dir',plugins]);assert.equal(bad.status,1);
 const unscoped=run(['capabilities','build']);assert.equal(unscoped.status,1);
});
