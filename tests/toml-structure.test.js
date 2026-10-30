'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseToml,findManagedBlocks,serverKeys}=require('../src/toml-structure.js');
const {findTomlSyntaxError}=require('../src/codex-toml.js');
const start=n=>`# >>> agenthaus:${n} (managed by agenthaus; edits are overwritten) >>>`;
const end=n=>`# <<< agenthaus:${n} <<<`;
test('TOML structure decodes quoted and dotted server keys without mistaking literal dots',()=>{
 const document=parseToml(`'mcp_servers'.'dotted.name'.command = "node"\n["mcp_servers".other]\ncommand = 'node'\n`);
 assert.deepEqual([...serverKeys(document)].sort(),['dotted.name','other']);
});
test('actual values and duplicate semantic keys fail rather than merely balancing brackets',()=>{
 for(const text of ['x = unquoted\n','x = 01\n','x = 1__2\n','x = tru\n','x = "bad\\q"\n','x = 1\n"x" = 2\n','a.b = 1\n[a]\nx = 2\n','[a]\n[a]\n','x = { a = 1, a = 2 }\n','x = [1 2]\n','x = "a" "b"\n','x = {a=1,}\n']){
  assert.throws(()=>parseToml(text),/TOML|unsupported/);assert.notEqual(findTomlSyntaxError(text),null);
 }
});
test('supported arrays, inline tables, multiline strings and escaped quoted keys validate',()=>{
 const text=`title = "safe" # comment\nenabled = true\ncount = -1_000\nratio = 1.2e+3\nhex = 0xA_B\narray = [\n "a", # comment\n { k = [1, 2] },\n]\nmessage = """\nline \\\n  continued """\n['quoted\\path'."unicode\\u002ekey"]\nx = { nested.key = "value" }\n`;
 assert.equal(findTomlSyntaxError(text),null);assert.ok(parseToml(text));
});
test('marker-like comments inside multiline values are user data',()=>{
 const text=`notes = '''\n${start('sample')}\n[mcp_servers.fake]\n${end('sample')}\n'''\n`;
 assert.equal(findManagedBlocks(parseToml(text)).size,0);assert.deepEqual([...serverKeys(parseToml(text))],[]);
});
test('malformed, nested, duplicate and unmatched real markers fail closed',()=>{
 for(const text of [`${start('sample')}\n`,`${end('sample')}\n`,`${start('sample')}\n${start('other')}\n${end('other')}\n${end('sample')}\n`,`${start('sample')}\n${end('sample')}\n${start('sample')}\n${end('sample')}\n`,'# >>> agenthaus:sample broken\n','# >> agenthaus:sample broken\n','# <<< agenthaus sample\n']) assert.throws(()=>findManagedBlocks(parseToml(text)),/managed|marker/);
});
test('unsupported valid TOML and over-budget inputs fail explicitly',()=>{
 assert.throws(()=>parseToml('[[items]]\nx = 1\n'),/unsupported/);
 assert.throws(()=>parseToml('when = 2026-10-24\n'),/unsupported|value/);
 assert.throws(()=>parseToml('#'.repeat(4*1024*1024+1)),/limit/);
});
test('dotted assignments cannot redefine an explicit header table',()=>{
 for(const text of ['[a.b]\nd=2\n[a]\nb.c=1\n','[a.b]\nx=1\n[a]\nb.c.d=2\n'])assert.throws(()=>parseToml(text),/redefin/);
 assert.ok(parseToml('[a.b.c]\nx=1\n[a]\nb.d=2\n'));
});
test('array comments resembling ownership markers cannot capture user data',()=>{
 const text=`values = [\n${start('sample')}\n "keep",\n${end('sample')}\n]\n`;
 assert.equal(findManagedBlocks(parseToml(text)).size,0);
});
test('unmanaged assignments depending on a managed table fail instead of silently changing scope',()=>{
 const text=`${start('sample')}\n[mcp_servers.sample]\ncommand="node"\n${end('sample')}\nextra="user-owned"\n`;
 assert.throws(()=>findManagedBlocks(parseToml(text)),/unmanaged assignment/);
});
