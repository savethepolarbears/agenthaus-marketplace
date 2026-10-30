'use strict';
const fs=require('node:fs');const readline=require('node:readline');
readline.createInterface({input:process.stdin}).on('line',line=>{
 const m=JSON.parse(line);
 if(process.env.CALL_LOG)fs.appendFileSync(process.env.CALL_LOG,JSON.stringify({method:m.method,name:m.params?.name})+'\n');
 if(!Object.hasOwn(m,'id'))return;
 let result;
 if(m.method==='initialize')result={protocolVersion:m.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'local-runtime-fixture',version:'1.0.0'}};
 else if(m.method==='tools/list')result={tools:['read','mutate'].map(name=>({name,description:'Synthetic local fixture '+name,inputSchema:{type:'object',properties:{}}}))};
 else result={content:[{type:'text',text:'LOCAL_RUNTIME_FIXTURE_OK'}]};
 process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:m.id,result})+'\n');
});
