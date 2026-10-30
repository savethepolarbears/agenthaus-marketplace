'use strict';
// Deliberately conservative TOML 1.0 subset. Unsupported valid constructs fail
// before edits; this is not a claim of complete TOML support.
const LIMIT = 4 * 1024 * 1024;
function table(origin='implicit',sealed=false){return {kind:'table',origin,sealed,children:new Map()};}
function parseToml(text) {
  if(typeof text!=='string'||text.length>LIMIT||Buffer.byteLength(text)>LIMIT)throw new Error('TOML input exceeds supported size limit.');
  const root=table('root'),comments=[],statements=[];let i=0,line=1,current=root,headerOffset=-1,statementCount=0,nodeCount=0;
  const error=(message,details={})=>{throw Object.assign(new Error(`TOML line ${line}: ${message}`),details);};
  function newline(){if(text[i]==='\r'){if(text[i+1]!=='\n')error('bare carriage return');i++;}if(text[i]==='\n'){i++;line++;return true;}return false;}
  function ws(){while(text[i]===' '||text[i]==='\t')i++;}
  function comment(markable=false){if(comments.length>=20000)error('comment count exceeds limit');const start=i,begin=text.lastIndexOf('\n',i-1)+1;while(i<text.length&&text[i]!=='\n'&&text[i]!=='\r'){if(/[\x00-\x08\x0b-\x1f\x7f]/.test(text[i]))error('control character in comment');i++;}comments.push({start:begin,end:i,text:text.slice(start,i),fullLine:markable&&!text.slice(begin,start).trim()});}
  function gap(multiline,markable=false){for(;;){ws();if(multiline&&text[i]==='#'){comment(markable);continue;}if(multiline&&(text[i]==='\n'||text[i]==='\r')){newline();continue;}break;}}
  function string(key=false){
    const quote=text[i],triple=text.startsWith(quote.repeat(3),i);if(key&&triple)error('multiline key is unsupported');i+=triple?3:1;let value='';
    if(triple&&(text[i]==='\n'||text[i]==='\r'))newline();
    while(i<text.length){
      if(key&&value.length>8192)error('quoted key exceeds size limit');
      if(text[i]===quote){let n=0;while(text[i+n]===quote)n++;if(!triple){i++;return value;}if(n>=3){if(n>5)error('ambiguous multiline string delimiter');if(key)value+=quote.repeat(n-3);i+=n;return value;}if(key)value+=quote.repeat(n);i+=n;continue;}
      const c=text[i];
      if(c==='\n'||c==='\r'){if(!triple)error('newline in single-line string');newline();if(key)value+='\n';continue;}
      if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(c))error('control character in string');
      if(quote==='"'&&c==='\\'){
        i++;const escape=text[i],simple={b:'\b',t:'\t',n:'\n',f:'\f',r:'\r','"':'"','\\':'\\'};
        if(Object.prototype.hasOwnProperty.call(simple,escape)){if(key)value+=simple[escape];i++;continue;}
        if(escape==='u'||escape==='U'){const n=escape==='u'?4:8,hex=text.slice(i+1,i+1+n);if(hex.length!==n||!/^[0-9a-fA-F]+$/.test(hex))error('invalid Unicode string escape');const point=parseInt(hex,16);if(point>0x10ffff||(point>=0xd800&&point<=0xdfff))error('invalid Unicode scalar');if(key)value+=String.fromCodePoint(point);i+=n+1;continue;}
        if(triple&&/[ \t\r\n]/.test(escape??'')){ws();if(text[i]!=='\r'&&text[i]!=='\n')error('invalid multiline continuation');while(i<text.length&&/[ \t\r\n]/.test(text[i])){if(!newline())i++;}continue;}
        error('invalid basic-string escape');
      }
      if(key)value+=c;i++;
    }
    error('unterminated string');
  }
  function keys(){const parts=[];for(;;){ws();if(text[i]==='"'||text[i]==="'")parts.push(string(true));else{const m=/^[A-Za-z0-9_-]+/.exec(text.slice(i));if(!m)error('expected a bare or quoted key');parts.push(m[0]);i+=m[0].length;}if(parts.length>32)error('key path exceeds depth limit');ws();if(text[i]!=='.')return parts;i++;}}
  function insert(base,parts,node,header=false){
    let at=base;
    for(let p=0;p<parts.length;p++){
      if(++nodeCount>100000)error('structural node count exceeds limit');
      if(at.kind!=='table'||at.sealed)error('cannot extend a scalar or inline table');
      const key=parts[p],last=p===parts.length-1;let child=at.children.get(key);
      if(last){
        if(header){if(child){if(child.kind!=='table'||child.sealed||child.origin!=='implicit')error('duplicate or redefined table',{code:'DUPLICATE_TABLE',path:parts});child.origin='header';}else{child=table('header');at.children.set(key,child);}return child;}
        if(child)error('duplicate key or table/value conflict');at.children.set(key,node);return node;
      }
      if(!child){child=table(header?'implicit':'dotted');at.children.set(key,child);}
      else if(!header&&child.kind==='table'&&child.origin==='header')error('dotted key cannot redefine an explicit table');
      if(child.kind!=='table'||child.sealed)error('cannot extend a scalar or inline table');at=child;
    }
  }
  function value(depth=0){
    if(depth>32)error('nesting exceeds supported depth limit');ws();const c=text[i];
    if(c==='"'||c==="'"){string();return {kind:'value'};}
    if(c==='['){i++;gap(true);if(text[i]===']'){i++;return {kind:'value'};}for(;;){value(depth+1);gap(true);if(text[i]===']'){i++;break;}if(text[i]!==',')error('expected array comma or closing bracket');i++;gap(true);if(text[i]===']'){i++;break;}}return {kind:'value'};}
    if(c==='{'){
      const beginLine=line,node=table('inline');i++;ws();if(text[i]==='}'){i++;node.sealed=true;return node;}
      for(;;){const path=keys();if(text[i]!=='=')error('expected inline assignment');i++;const child=value(depth+1);insert(node,path,child);ws();if(line!==beginLine)error('unsupported multiline inline table');if(text[i]==='}'){i++;break;}if(text[i]!==',')error('expected inline comma or closing brace');i++;ws();if(text[i]==='}')error('trailing inline-table comma');}
      node.sealed=true;return node;
    }
    const m=/^[^\s,\]#}]+/.exec(text.slice(i));if(!m)error('missing value');const token=m[0];i+=token.length;
    if(token==='true'||token==='false'||/^[+-]?(?:inf|nan)$/.test(token))return {kind:'value'};
    if(/^[+-]?(?:0|[1-9](?:_?\d)*)$/.test(token)||/^0(?:x[0-9a-fA-F](?:_?[0-9a-fA-F])*|o[0-7](?:_?[0-7])*|b[01](?:_?[01])*)$/.test(token)){
      let number;try{number=BigInt(token.replace(/_/g,''));}catch{error('invalid integer');}if(number<-(1n<<63n)||number>(1n<<63n)-1n)error('integer outside supported signed 64-bit range');return {kind:'value'};
    }
    if(/^[+-]?(?:0|[1-9](?:_?\d)*)(?:\.\d(?:_?\d)*)?(?:[eE][+-]?\d(?:_?\d)*)?$/.test(token)&&/[.eE]/.test(token))return {kind:'value'};
    error('unsupported or invalid bare value (dates/times are not supported)');
  }
  while(i<text.length){
    gap(true,true);if(i>=text.length)break;
    if(++statementCount>20000)error('statement count exceeds limit');
    const statementStart=i;
    if(text[i]==='['){if(text[i+1]==='[')error('unsupported array-of-tables declaration');i++;const path=keys();if(text[i]!==']')error('malformed table header');i++;current=insert(root,path,null,true);headerOffset=statementStart;}
    else{const path=keys();if(text[i]!=='=')error('expected key = value');i++;insert(current,path,value());statements.push({start:statementStart,headerOffset});}
    ws();if(text[i]==='#')comment();if(i<text.length&&!newline())error('unexpected content after statement');
  }
  return {text,root,comments,statements};
}
function serverKeys(document){const node=document.root.children.get('mcp_servers');if(!node)return new Set();if(node.kind!=='table')throw new Error('TOML mcp_servers is not a structural table.');return new Set(node.children.keys());}
function findManagedBlocks(document){
  const blocks=new Map();let active=null;
  const start=/^# >>> agenthaus:([a-zA-Z0-9_-]+) \(managed by agenthaus; edits are overwritten\) >>>$/;
  for(const comment of document.comments){
    if(!comment.fullLine)continue;
    const begin=start.exec(comment.text),finish=/^# <<< agenthaus:([a-zA-Z0-9_-]+) <<<$/.exec(comment.text);
    if(begin){if(active||blocks.has(begin[1]))throw new Error('Ambiguous nested or duplicate managed marker.');active={plugin:begin[1],start:comment.start,markerStart:comment.start,separator:0,metadataSeen:false,firstLineEnd:comment.end};continue;}
    if(finish){if(!active||active.plugin!==finish[1])throw new Error('Unmatched managed marker.');let stop=comment.end;if(document.text[stop]==='\r')stop++;if(document.text[stop]==='\n')stop++;blocks.set(active.plugin,{...active,end:stop});active=null;continue;}
    if(/^#\s*[<>]+\s*agenthaus\b/.test(comment.text))throw new Error('Malformed managed marker.');
    if(active&&/^# agenthaus-separator-bytes:/.test(comment.text)){
      const match=/^# agenthaus-separator-bytes: ([012])$/.exec(comment.text);
      const between=document.text.slice(active.firstLineEnd,comment.start);
      if(!match||active.metadataSeen||!/^\r?\n$/.test(between))throw new Error('Malformed managed separator metadata.');
      const n=Number(match[1]);if(n&&document.text.slice(active.start-n,active.start)!=='\n'.repeat(n))throw new Error('Managed separator does not match owned bytes.');active.separator=n;active.start-=n;active.metadataSeen=true;
    }
  }
  if(active)throw new Error('Unclosed managed marker.');
  const ranges=[...blocks.values()];
  for(const statement of document.statements){
    const enclosing=ranges.find(block=>statement.start>=block.markerStart&&statement.start<block.end);
    if(!enclosing&&ranges.some(block=>statement.headerOffset>=block.markerStart&&statement.headerOffset<block.end))throw new Error('Ambiguous unmanaged assignment depends on a managed table; add an explicit user table header.');
  }
  return blocks;
}
module.exports={parseToml,serverKeys,findManagedBlocks};
