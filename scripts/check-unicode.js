#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { scanUnicode } = require('../src/unicode-hygiene.js');
function main(argv=process.argv.slice(2)) {
  const {values}=parseArgs({args:argv,options:{root:{type:'string'},exceptions:{type:'string'},json:{type:'boolean',default:false}}});
  const root=path.resolve(values.root||path.join(__dirname,'..'));
  const exceptions=values.exceptions?JSON.parse(fs.readFileSync(values.exceptions,'utf8')):[];
  const result=scanUnicode(root,{exceptions});
  console.log(JSON.stringify(result,null,values.json?2:0));
  process.exitCode=result.ok?0:1;
}
if(require.main===module){try{main();}catch(error){console.log(JSON.stringify({ok:false,error:error.code||'UNICODE_SCAN_UNAVAILABLE'}));process.exitCode=1;}}
module.exports={main};
