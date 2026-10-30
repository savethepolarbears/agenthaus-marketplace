'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {validateValue} = require('../scripts/validate-schema.js');
const schema = require('../schemas/hook-result.schema.json');
const EVENTS = ['PreToolUse','PostToolUse'];
const INPUT_LIMIT = 4 * 1024 * 1024;
// These variables can replace the trusted entrypoint before hook code runs.
const STARTUP_CONTROL = /^(?:NODE_OPTIONS|NODE_PATH|NODE_V8_COVERAGE|BASH_ENV|ENV|ZDOTDIR|PYTHONPATH|PYTHONHOME|RUBYOPT|RUBYLIB|PERL5OPT|PERL5LIB|LD_PRELOAD|LD_LIBRARY_PATH|DYLD_.*|PHPRC|PHP_INI_SCAN_DIR|JAVA_TOOL_OPTIONS|JDK_JAVA_OPTIONS|_JAVA_OPTIONS|CLASSPATH)$/i;
const MESSAGES = {
  configuration:['Invalid hook runtime configuration.','Review the trusted executable, arguments, limits and rule configuration.'],
  isolation:['Required isolation or process-tree control is unsupported.','Select an implemented backend or do not execute this hook.'],
  input:['Hook input exceeds the supported byte limit.','Reduce input to at most 4 MiB.'],
  launch:['Hook process could not be launched.','Check the trusted executable and working directory.'],
  timeout:['Hook exceeded its execution deadline.','Review the hook before increasing its bounded timeout.'],
  output:['Hook exceeded its combined output byte limit.','Reduce hook output; raw output has been discarded.'],
  malformed:['Hook returned an invalid typed result.','Emit only a JSON object with an allowed, blocked or error status.'],
  execution:['Hook exited unsuccessfully.','Review the trusted hook locally without exposing raw error output.'],
  reported:['Hook reported an error.','Review the trusted hook implementation.'],
  post:['PostToolUse cannot block an operation that already executed.','Move preventative checks to PreToolUse; inspect the completed operation separately.'],
  cleanup:['Hook cleanup did not close all inherited streams within the bound.','Inspect escaped descendants; process groups are not a security sandbox.']
};
function getIsolationCapabilities() {
  const posix = ['darwin','linux','freebsd'].includes(process.platform);
  return {backend:'environment',platform:process.platform,environment:true,filesystem:false,network:false,process_tree:posix?'posix-process-group':'unsupported',limits:['Environment allowlisting is not filesystem or network isolation.','Descendants creating independent sessions can escape process-group termination.','No protection against same-user modification or an OS security boundary is provided.']};
}
function validRule(rule) {
  return rule && typeof rule === 'object' && !Array.isArray(rule) && Object.keys(rule).every(k=>['id','reason','remediation'].includes(k)) && typeof rule.id==='string' && /^[a-zA-Z0-9_-]{1,64}$/.test(rule.id) && ['reason','remediation'].every(k=>typeof rule[k]==='string' && rule[k].trim() && rule[k].length<=256 && !/[\x00-\x1f\x7f]/.test(rule[k]));
}
function validateConfiguration(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) return false;
  const keys=['event','executable','args','cwd','envAllowlist','timeoutMs','killGraceMs','outputLimitBytes','requiredIsolation','requireProcessTree','rule'];
  if (Object.keys(config).some(k=>!keys.includes(k)) || !EVENTS.includes(config.event) || !validRule(config.rule)) return false;
  if (typeof config.executable!=='string' || config.executable.length>4096 || !path.isAbsolute(config.executable) || typeof config.cwd!=='string' || config.cwd.length>4096 || !path.isAbsolute(config.cwd)) return false;
  const args=config.args??[], names=config.envAllowlist??[];
  if (!Array.isArray(args) || args.length>128 || args.some(a=>typeof a!=='string' || a.length>8192 || a.includes('\0')) || Buffer.byteLength(JSON.stringify(args))>32768) return false;
  if (!Array.isArray(names) || names.length>128 || new Set(names).size!==names.length || names.some(n=>typeof n!=='string' || n.length>128 || STARTUP_CONTROL.test(n) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(n))) return false;
  for (const [key, fallback, min, max] of [['timeoutMs',10000,1,300000],['killGraceMs',100,10,1000],['outputLimitBytes',65536,1,1048576]]) {
    const value=config[key]??fallback;if (!Number.isSafeInteger(value) || value<min || value>max) return false;
  }
  if (!['none','environment','filesystem','network','filesystem-network'].includes(config.requiredIsolation??'environment')) return false;
  if (config.requireProcessTree!==undefined && typeof config.requireProcessTree!=='boolean') return false;
  return true;
}
function validateHookResult(result) {
  if (validateValue(result,schema).length!==0) return false;
  if (result.status!=='allowed') return true;
  const execution=result.execution;
  return execution.launched===true && execution.exit_code===0 && execution.signal===null && execution.timed_out===false && execution.output_limited===false;
}
async function runHook(config, {env=process.env,input=''}={}) {
  const isolation=getIsolationCapabilities();
  const execution={launched:false,exit_code:null,signal:null,timed_out:false,output_limited:false};
  const event=EVENTS.includes(config?.event)?config.event:'unsupported';
  const rule=validRule(config?.rule)?config.rule:{id:'hook-runtime',reason:'Hook check completed.',remediation:'Review the trusted hook configuration.'};
  function outcome(status,cause) {
    if (event==='PostToolUse' && status==='blocked') {status='error';cause='post';}
    const messages=cause?MESSAGES[cause]:[rule.reason,rule.remediation];
    const result={schema_version:1,event,status,rule_id:rule.id,reason:messages[0],remediation:messages[1],execution:{...execution},isolation};
    if (!validateHookResult(result)) throw new Error('Internal hook result contract failure.');
    return result;
  }
  if (!validateConfiguration(config)) return outcome('error','configuration');
  if (!['none','environment'].includes(config.requiredIsolation??'environment') || ((config.requireProcessTree??true) && isolation.process_tree==='unsupported')) return outcome('error','isolation');
  if (!(typeof input==='string' || Buffer.isBuffer(input)) || Buffer.byteLength(input)>INPUT_LIMIT) return outcome('error','input');
  const childEnv=Object.create(null);
  if (process.platform==='win32') {
    for (const k of ['SystemRoot','ComSpec']) if (typeof env?.[k]==='string' && !env[k].includes('\0')) childEnv[k]=env[k];
  }
  let envBytes=0;
  for (const name of config.envAllowlist??[]) {
    if (env && Object.prototype.hasOwnProperty.call(env,name)) {
      if (typeof env[name]!=='string' || env[name].includes('\0') || Buffer.byteLength(env[name])>32768 || (envBytes+=Buffer.byteLength(name)+Buffer.byteLength(env[name])+2)>131072) return outcome('error','configuration');
      childEnv[name]=env[name];
    }
  }
  try {
    if (!fs.statSync(config.executable).isFile() || !fs.statSync(config.cwd).isDirectory()) return outcome('error','launch');
    fs.accessSync(config.executable,fs.constants.X_OK);
  } catch { return outcome('error','launch'); }
  return new Promise(resolve=>{
    let child;
    try { child=spawn(config.executable,config.args??[],{cwd:config.cwd,env:childEnv,shell:false,detached:isolation.process_tree!=='unsupported',stdio:['pipe','pipe','pipe'],windowsHide:true}); }
    catch {resolve(outcome('error','launch'));return;}
    const chunks=[];let outputBytes=0,cause=null,closed=false,escalated=false,settled=false,cleanupStarted=false,deadline,killTimer,drainTimer;
    const limit=config.outputLimitBytes??65536;
    function signal(signal) {
      if (!child.pid) return;
      try { if (isolation.process_tree!=='unsupported') process.kill(-child.pid,signal); else if (execution.exit_code===null && execution.signal===null) child.kill(signal); } catch (error) { if (error.code!=='ESRCH') cause='cleanup'; }
    }
    function finish(force=false) {
      if (settled || (!force && (!closed || !escalated))) return;
      settled=true;clearTimeout(deadline);clearTimeout(killTimer);clearTimeout(drainTimer);
      child.stdin.destroy();child.stdout.destroy();child.stderr.destroy();
      if (cause) {resolve(outcome('error',cause));return;}
      if (execution.exit_code===2) {resolve(outcome('blocked'));return;}
      if (execution.exit_code!==0) {resolve(outcome('error','execution'));return;}
      let parsed;
      try { parsed=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch {resolve(outcome('error','malformed'));return;}
      if (!parsed || typeof parsed!=='object' || Array.isArray(parsed) || Object.keys(parsed).length!==1 || !['allowed','blocked','error'].includes(parsed.status)) {resolve(outcome('error','malformed'));return;}
      resolve(outcome(parsed.status,parsed.status==='error'?'reported':null));
    }
    function cleanup(failure) {
      if (failure && !cause) cause=failure;
      if (failure==='timeout') execution.timed_out=true;
      if (failure==='output') execution.output_limited=true;
      if (cleanupStarted) return;
      cleanupStarted=true;clearTimeout(deadline);signal('SIGTERM');
      killTimer=setTimeout(()=>{
        signal('SIGKILL');escalated=true;
        if (closed) finish();
        else drainTimer=setTimeout(()=>{if(!cause)cause='cleanup';finish(true);},100);
      },config.killGraceMs??100);
    }
    child.once('spawn',()=>{execution.launched=true;});
    child.once('error',()=>{cleanup('launch');});
    child.once('exit',(code,signal)=>{execution.exit_code=code;execution.signal=signal;cleanup();});
    child.once('close',(code,signal)=>{closed=true;if(execution.exit_code===null)execution.exit_code=code;if(execution.signal===null)execution.signal=signal;cleanup();finish();});
    child.stdin.on('error',()=>{}); // Early exit can close stdin; no raw EPIPE diagnostics.
    child.stdout.on('data',chunk=>{
      outputBytes+=chunk.length;
      if(outputBytes>limit){cleanup('output');return;}
      chunks.push(chunk);
    });
    child.stderr.on('data',chunk=>{outputBytes+=chunk.length;if(outputBytes>limit)cleanup('output');});
    deadline=setTimeout(()=>cleanup('timeout'),config.timeoutMs??10000);
    child.stdin.end(input);
  });
}
function adaptClaudeResult(event,result) {
  const valid=validateHookResult(result) && result.event===event;
  const status=valid?result.status:'error';
  if (!EVENTS.includes(event)) return {exitCode:1,stdout:'',stderr:'Unsupported Claude hook event adapter.'};
  if (status==='allowed') return {exitCode:0,stdout:'',stderr:''};
  // Diagnostics come from trusted runtime/configuration, never raw child streams.
  const safe=valid && validRule({id:result?.rule_id,reason:result?.reason,remediation:result?.remediation});
  const message=safe?`[${result.rule_id}] ${result.reason} ${result.remediation}`:'Hook check failed; review trusted configuration.';
  return {exitCode:event==='PreToolUse'?2:1,stdout:'',stderr:event==='PostToolUse'?`PostToolUse cannot undo completed tool execution. ${message}`:message};
}
module.exports={runHook,adaptClaudeResult,getIsolationCapabilities,validateHookResult};
