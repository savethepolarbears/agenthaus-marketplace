#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {spawn}=require('node:child_process');const {parseArgs}=require('node:util');
const {writeJsonAtomic}=require('../src/fs-utils.js');
const AUTH='Bearer synthetic-local-fixture-only';
const EXPECTED_TOOLS=['mcp__guard_fixture__mutate','mcp__guard_fixture__read','mcp__http_fixture__read'];
const validToolId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,256}$/.test(id);
function classifyContent(content,depth=0){
 if(depth>4)return 'unknown';
 if(typeof content==='string'){
  if(content.length>32768)return 'unknown';
  const value=content.trim();
  if(value==='LOCAL_RUNTIME_FIXTURE_OK')return 'fixture-read-success';
  // Claude's native tool result retains the guard message but drops its RPC code.
  // The direct JSON-RPC fixture separately verifies -32003; do not infer that here.
  if(value==='Tool call blocked')return 'guard-denied';
  if(/^(?:Error: )?MCP error -32003: Tool call blocked$/.test(value))return 'guard-denied';
  try{return classifyContent(JSON.parse(value),depth+1);}catch{return 'unknown';}
 }
 if(Array.isArray(content))return content.length===1&&content[0]?.type==='text'?classifyContent(content[0].text,depth+1):'unknown';
 if(content&&typeof content==='object'){
  if(content.error?.code===-32003&&content.error?.message==='Tool call blocked')return 'guard-denied';
  if(content.code===-32003&&content.message==='Tool call blocked')return 'guard-denied';
  if(content.isError!==true&&Array.isArray(content.content))return classifyContent(content.content,depth+1);
 }
 return 'unknown';
}
function summarizeNativeMessage(event){
 if(!['assistant','user'].includes(event?.type)||!Array.isArray(event.message?.content))return [];
 return event.message.content.flatMap(c=>{
  if(event.type==='assistant'&&c?.type==='tool_use')return [{type:'tool_use',id:validToolId(c.id)?c.id:null,name:EXPECTED_TOOLS.includes(c.name)?c.name:'unknown-tool'}];
  if(event.type==='user'&&c?.type==='tool_result')return [{type:'tool_result',tool_use_id:validToolId(c.tool_use_id)?c.tool_use_id:null,is_error:c.is_error===true?true:c.is_error===false||c.is_error===undefined?false:null,classification:classifyContent(c.content)}];
  return [];
 });
}
function nativeProtocolPassed(native){
 if(native?.exit_code!==0||!Array.isArray(native.events)||native.events.length!==6)return false;
 const uses=native.events.filter(e=>e.type==='tool_use'),results=native.events.filter(e=>e.type==='tool_result');
 if(uses.length!==3||results.length!==3||JSON.stringify(uses.map(e=>e.name).sort())!==JSON.stringify(EXPECTED_TOOLS))return false;
 if(uses.some(e=>!validToolId(e.id))||results.some(e=>!validToolId(e.tool_use_id))||new Set(uses.map(e=>e.id)).size!==3||new Set(results.map(e=>e.tool_use_id)).size!==3)return false;
 return uses.every(use=>{const result=results.find(e=>e.tool_use_id===use.id);return use.name==='mcp__guard_fixture__mutate'?result?.is_error===true&&result.classification==='guard-denied':result?.is_error===false&&result.classification==='fixture-read-success';});
}
function toolResult(){return {content:[{type:'text',text:'LOCAL_RUNTIME_FIXTURE_OK'}]};}
async function startHttpFixture(){
 const calls=[];const server=http.createServer(async(req,res)=>{
  if(req.url!=='/mcp'){res.writeHead(404);res.end();return;}
  if(req.headers.authorization!==AUTH){res.writeHead(403);res.end();return;}
  if(req.method!=='POST'){res.writeHead(405);res.end();return;}
  const parts=[];let bytes=0;
  for await(const part of req){bytes+=part.length;if(bytes>1024*1024){res.writeHead(413);res.end();return;}parts.push(part);}
  let m;try{m=JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{res.writeHead(400);res.end();return;}
  calls.push({method:m.method,name:m.params?.name});
  if(!Object.hasOwn(m,'id')){res.writeHead(202);res.end();return;}
  let result;
  if(m.method==='initialize')result={protocolVersion:m.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'http-runtime-fixture',version:'1.0.0'}};
  else if(m.method==='tools/list')result={tools:[{name:'read',description:'Synthetic HTTP fixture read',inputSchema:{type:'object',properties:{}}}]};
  else result=toolResult();
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({jsonrpc:'2.0',id:m.id,result}));
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {server,calls,url:`http://127.0.0.1:${server.address().port}/mcp`};
}
function launchStdio(workspace){
 const root=path.resolve(__dirname,'..'),policy=path.join(workspace,'policy.json'),log=path.join(workspace,'calls.jsonl');
 fs.writeFileSync(policy,JSON.stringify({version:1,rules:[{id:'read',tool:'read',action:'allow-read'},{id:'deny',tool:'mutate',action:'deny'}]}));
 const args=[path.join(root,'src/safety-guard.js'),'--policy',policy,'--',process.execPath,path.join(root,'tests/fixtures/runtime-mcp.cjs')];
 const env={LANG:'C',LC_ALL:'C',CALL_LOG:log};if(process.platform==='win32'&&process.env.SystemRoot)env.SystemRoot=process.env.SystemRoot;
 const child=spawn(process.execPath,args,{env,stdio:['pipe','pipe','pipe']});let buffer='',next=1;const pending=new Map();
 child.stderr.on('data',()=>{});
 child.stdout.on('data',data=>{buffer+=data;if(buffer.length>1024*1024){child.kill();return;}let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);let m;try{m=JSON.parse(line);}catch{continue;}const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);p.resolve(m);}}});
 child.on('error',()=>{});
 const send=(method,params,notification=false)=>{const id=next++;const m={jsonrpc:'2.0',method,...(params?{params}:{}),...(notification?{}:{id})};if(notification){child.stdin.write(JSON.stringify(m)+'\n');return Promise.resolve();}return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Fixture protocol timed out'));},10000);pending.set(id,{resolve,timer});child.stdin.write(JSON.stringify(m)+'\n');});};
 return {child,args,log,policy,send,async close(){if(child.exitCode!==null)return;const done=new Promise(resolve=>child.once('close',resolve));child.stdin.end();const timer=setTimeout(()=>child.kill('SIGKILL'),2000);await done;clearTimeout(timer);}};
}
async function runProvider(binary,config,workspace){
 if(!path.isAbsolute(binary)||!fs.statSync(binary).isFile())throw new Error('Explicit native client executable required');
 const args=['--print','--no-session-persistence','--strict-mcp-config','--mcp-config',config,'--setting-sources','','--settings','{"disableAllHooks":true,"autoMemoryEnabled":false}','--tools','','--allowedTools','mcp__guard_fixture__read,mcp__guard_fixture__mutate,mcp__http_fixture__read','--permission-mode','dontAsk','--output-format','stream-json','--verbose','Authorized synthetic local protocol test. Call mcp__guard_fixture__read once with {}, then mcp__http_fixture__read once with {}, then mcp__guard_fixture__mutate once with {}. The mutation is synthetic and deliberately blocked by the local guard. No other tools or retries. Report actual outcomes.'];
 const child=spawn(binary,args,{cwd:workspace,stdio:['ignore','pipe','pipe']});let buffer='',bytes=0;const events=[];
 const completed=new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Native client timed out'));},90000);child.once('error',()=>{clearTimeout(timer);reject(new Error('Native client unavailable'));});child.once('close',code=>{clearTimeout(timer);resolve(code);});});
 child.stderr.on('data',()=>{});
 child.stdout.on('data',data=>{bytes+=data.length;if(bytes>8*1024*1024){child.kill('SIGKILL');return;}buffer+=data;let i;while((i=buffer.indexOf('\n'))>=0){let e;try{e=JSON.parse(buffer.slice(0,i));}catch{}buffer=buffer.slice(i+1);if(!e)continue;
  events.push(...summarizeNativeMessage(e));
 }});
 const exit=await completed;return {exit_code:exit,events};
}
async function runProtocolMatrix({nativeClaude}={}){
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'agenthaus-protocol-')),web=await startHttpFixture(),stdio=launchStdio(workspace);
 let summary;
 try{
  const bad=await fetch(web.url,{method:'POST',body:'{}'});
  if(nativeClaude){
   // Native provider launches its own guarded stdio instance with an isolated fixture config.
   await stdio.close();
   const guarded=require('../src/safety-wiring.js').guardPlugin({name:'runtime-fixture',mcpServers:{guard_fixture:{command:process.execPath,args:[path.resolve(__dirname,'../tests/fixtures/runtime-mcp.cjs')],env:{CALL_LOG:stdio.log}}}},{guardPath:path.resolve(__dirname,'../src/safety-guard.js'),policyFile:stdio.policy});
   const config=path.join(workspace,'mcp.json');fs.writeFileSync(config,JSON.stringify({mcpServers:{...guarded.plugin.mcpServers,http_fixture:{type:'http',url:web.url,headers:{Authorization:AUTH}}}}));
   const native=await runProvider(nativeClaude,config,workspace);const calls=fs.existsSync(stdio.log)?fs.readFileSync(stdio.log,'utf8').trim().split('\n').filter(Boolean).map(s=>JSON.parse(s)):[];
   const mutation=native.events.find(e=>e.type==='tool_use'&&e.name==='mcp__guard_fixture__mutate');
   const denied=native.events.some(e=>e.type==='tool_result'&&e.tool_use_id===mutation?.id&&e.is_error&&e.classification==='guard-denied');
   summary={fixture:true,client:'Claude Code',native_provider_execution:true,native,stdio:{read_forwarded:calls.filter(c=>c.method==='tools/call'&&c.name==='read').length,mutation_forwarded:calls.filter(c=>c.method==='tools/call'&&c.name==='mutate').length,denied},http:{read_calls:web.calls.filter(c=>c.method==='tools/call'&&c.name==='read').length,bad_auth_rejected:bad.status===403}};
  }else{
   await stdio.send('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'fixture-client',version:'1'}});await stdio.send('notifications/initialized',{},true);const listed=await stdio.send('tools/list',{});if(!listed.result?.tools?.length)throw new Error('Fixture discovery failed');await stdio.send('tools/call',{name:'read',arguments:{}});const denied=await stdio.send('tools/call',{name:'mutate',arguments:{}});
   let id=1;const rpc=(method,params)=>fetch(web.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:AUTH},body:JSON.stringify({jsonrpc:'2.0',id:id++,method,params})}).then(r=>r.json());await rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'fixture-client',version:'1'}});await rpc('tools/list',{});const read=await rpc('tools/call',{name:'read',arguments:{}});if(!read.result?.content)throw new Error('HTTP fixture read failed');
   await stdio.close();const calls=fs.readFileSync(stdio.log,'utf8').trim().split('\n').filter(Boolean).map(s=>JSON.parse(s));summary={fixture:true,client:'fixture-jsonrpc',native_provider_execution:false,stdio:{read_forwarded:calls.filter(c=>c.method==='tools/call'&&c.name==='read').length,mutation_forwarded:calls.filter(c=>c.method==='tools/call'&&c.name==='mutate').length,denied:denied.error?.code===-32003},http:{read_calls:web.calls.filter(c=>c.method==='tools/call'&&c.name==='read').length,bad_auth_rejected:bad.status===403}};
  }
  summary.passed=summary.stdio.read_forwarded===1&&summary.stdio.mutation_forwarded===0&&summary.stdio.denied&&summary.http.read_calls===1&&summary.http.bad_auth_rejected&&(!summary.native||nativeProtocolPassed(summary.native));
  return summary;
 }finally{await stdio.close();web.server.closeAllConnections();await new Promise(resolve=>web.server.close(resolve));fs.rmSync(workspace,{recursive:true,force:true});}
}
async function main(){const {values}=parseArgs({options:{'live-claude':{type:'string'},output:{type:'string'}}});const result=await runProtocolMatrix({nativeClaude:values['live-claude']});if(values.output)writeJsonAtomic(path.resolve(values.output),result,{backup:false});process.stdout.write(JSON.stringify(result)+'\n');if(!result.passed)process.exitCode=1;}
if(require.main===module)main().catch(()=>{process.stderr.write('Local provider matrix failed; inspect scoped evidence.\n');process.exitCode=1;});
module.exports={runProtocolMatrix,summarizeNativeMessage,nativeProtocolPassed};
