'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {runProtocolMatrix,summarizeNativeMessage,nativeProtocolPassed}=require('../scripts/check-provider-runtime.js');
test('local stdio and HTTP protocol matrix exercises discovery, reads and guarded denial',async()=>{
 const result=await runProtocolMatrix();assert.equal(result.passed,true);assert.equal(result.fixture,true);assert.equal(result.client,'fixture-jsonrpc');assert.equal(result.stdio.read_forwarded,1);assert.equal(result.stdio.mutation_forwarded,0);assert.equal(result.stdio.denied,true);assert.equal(result.http.read_calls,1);assert.equal(result.http.bad_auth_rejected,true);assert.equal(result.native_provider_execution,false);
});
function messages() {
 return ['mcp__guard_fixture__read','mcp__http_fixture__read','mcp__guard_fixture__mutate'].flatMap((name,i)=>[
  {type:'assistant',message:{content:[{type:'tool_use',id:'tool-'+i,name}]}},
  {type:'user',message:{content:[{type:'tool_result',tool_use_id:'tool-'+i,is_error:i===2,content:i===2?'Error: MCP error -32003: Tool call blocked':[{type:'text',text:'LOCAL_RUNTIME_FIXTURE_OK'}]}]}}
 ]);
}
function summary(raw=messages()){return {exit_code:0,events:raw.flatMap(summarizeNativeMessage)};}
test('native receipt correlates each tool result and retains classifications without raw bodies',()=>{
 assert.equal(typeof summarizeNativeMessage,'function');assert.equal(typeof nativeProtocolPassed,'function');
 const receipt=summary();assert.equal(nativeProtocolPassed(receipt),true);
 assert.equal(JSON.stringify(receipt).includes('LOCAL_RUNTIME_FIXTURE_OK'),false);
 assert.equal(JSON.stringify(receipt).includes('MCP error -32003'),false);
});
test('unrelated errors, permission denial and failed reads cannot satisfy native guard acceptance',()=>{
 assert.equal(typeof summarizeNativeMessage,'function');
 for(const attack of ['unrelated-error','permission-denial','wrong-read','wrong-id','missing-result','duplicate-result','duplicate-use']){
  const raw=messages();
  if(attack==='unrelated-error'){raw[1].message.content[0].is_error=true;raw[1].message.content[0].content='MCP error -32003: Tool call blocked';raw[5].message.content[0].is_error=false;raw[5].message.content[0].content='LOCAL_RUNTIME_FIXTURE_OK';}
  if(attack==='permission-denial')raw[5].message.content[0].content='Permission denied by native client';
  if(attack==='wrong-read')raw[1].message.content[0].content='SYNTHETIC_RAW_CONTENT';
  if(attack==='wrong-id')raw[5].message.content[0].tool_use_id='unmatched';
  if(attack==='missing-result')raw.pop();
  if(attack==='duplicate-result')raw.push(structuredClone(raw[5]));
  if(attack==='duplicate-use')raw[4].message.content[0].id='tool-0';
  assert.equal(nativeProtocolPassed(summary(raw)),false,attack);
  assert.equal(JSON.stringify(summary(raw)).includes('SYNTHETIC_RAW_CONTENT'),false);
 }
});
test('native classifier recognizes exact JSON text wrappers but does not accept arbitrary substrings',()=>{
 assert.equal(typeof summarizeNativeMessage,'function');
 const raw=messages();raw[1].message.content[0].content=[{type:'text',text:JSON.stringify([{type:'text',text:'LOCAL_RUNTIME_FIXTURE_OK'}])}];
 assert.equal(nativeProtocolPassed(summary(raw)),true);
 raw[1].message.content[0].content='prefix LOCAL_RUNTIME_FIXTURE_OK suffix';assert.equal(nativeProtocolPassed(summary(raw)),false);
});
test('native summaries discard unexpected metadata and reject malformed error flags',()=>{
 const raw=messages();raw[0].message.content[0].id='SYNTHETIC_SECRET_ID'.repeat(100);raw[0].message.content[0].name='SYNTHETIC_SECRET_TOOL';
 const safe=summary(raw);assert.equal(nativeProtocolPassed(safe),false);assert.equal(JSON.stringify(safe).includes('SYNTHETIC_SECRET'),false);
 const malformed=messages();malformed[1].message.content[0].is_error='true';assert.equal(nativeProtocolPassed(summary(malformed)),false);
});

test('native Claude plain guard message is classified exactly without inventing an error code',()=>{
 const raw=messages();raw[5].message.content[0].content='Tool call blocked';assert.equal(nativeProtocolPassed(summary(raw)),true);
 for(const text of ['Permission denied: Tool call blocked','Tool call blocked by native permissions','prefix Tool call blocked']){raw[5].message.content[0].content=text;assert.equal(nativeProtocolPassed(summary(raw)),false);}
});
