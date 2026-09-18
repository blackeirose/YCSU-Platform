// Small Markdown transforms; selection offsets always refer to the returned text.
export function formatSelection(text,start,end,action,url=''){
 start=Math.max(0,Math.min(start,text.length));end=Math.max(start,Math.min(end,text.length));
 if(start===end)throw new Error('Select text in the body first.');
 if([...text.matchAll(/```[\s\S]*?(?:```|$)/g)].some(m=>start<m.index+m[0].length&&end>m.index))throw new Error('Select text outside code blocks.');
 const replace=(a,b,value,from=0,to=value.length)=>({text:text.slice(0,a)+value+text.slice(b),start:a+from,end:a+to});
 if(['h2','h3','quote'].includes(action)){
  const a=text.lastIndexOf('\n',start-1)+1,b=text.indexOf('\n',end-1),stop=b<0?text.length:b;
  const lines=text.slice(a,stop).split('\n'),prefix=action==='quote'?'> ':action==='h2'?'## ':'### ';
  const remove=lines.filter(x=>x.trim()).every(x=>x.startsWith(prefix));
  const value=lines.map(line=>!line.trim()?line:remove?line.slice(prefix.length):action==='quote'?prefix+line:prefix+line.replace(/^#{1,6}\s+/, '')).join('\n');
  return replace(a,stop,value);
 }
 let a=start,b=end;while(a<b&&/\s/.test(text[a]))a++;while(b>a&&/\s/.test(text[b-1]))b--;
 if(a===b)throw new Error('Select some text first.');
 const selected=text.slice(a,b);
 if(/^(?:#{1,6}\s|>\s?|[-*]\s|\d+\.\s)/m.test(selected))throw new Error('Select the text inside a heading, quote or list item.');
 // Do not splice emphasis into code or image/link destinations.
 const protectedRanges=[...text.matchAll(/```[\s\S]*?(?:```|$)|`[^`\n]*`|!?\[[^\]]*\]\([^\s)]+\)/g)];
 if(protectedRanges.some(m=>a<m.index+m[0].length&&b>m.index))throw new Error('Select plain text outside code, images or existing links.');
 if(action==='link'){
  if(!/^https:\/\//i.test(url)||/[\s()<>"\\]/.test(url))throw new Error('Enter a valid HTTPS link.');
  try{const u=new URL(url);if(!u.hostname||u.username||u.password)throw Error()}catch{throw new Error('Enter a valid HTTPS link.');}
  if(/[*\[\]\n]/.test(selected))throw new Error('Select a single line of plain text for a link.');
  return replace(a,b,`[${selected}](${url})`,1,selected.length+1);
 }
 if(!['bold','italic'].includes(action))throw new Error('Unsupported formatting.');
 const mark=action==='bold'?'**':'*',n=mark.length;
 const chunks=selected.split(/(\n\s*\n)/);
 const wholeWrapped=chunks.every((part,i)=>i%2||!part.trim()||(part.startsWith(mark)&&part.endsWith(mark)&&!part.slice(n,-n).includes('*')));
 if(wholeWrapped)return replace(a,b,chunks.map((part,i)=>i%2||!part.trim()?part:part.slice(n,-n)).join(''));
 const left=text.slice(0,a).match(/\*+$/)?.[0].length||0,right=text.slice(b).match(/^\*+/)?.[0].length||0;
 const has=action==='bold'?left>=2&&right>=2:left%2===1&&right%2===1;
 if(has){
  const wrapped=text.slice(a-n,b+n),parts=wrapped.split(/(\n\s*\n)/);
  if(parts.every((part,i)=>i%2||part.startsWith(mark)&&part.endsWith(mark)&&!part.slice(n,-n).includes('*')))return replace(a-n,b+n,parts.map((part,i)=>i%2?part:part.slice(n,-n)).join(''));
 }
 // Existing partial/mixed markup is left untouched instead of guessing delimiter scope.
 if(selected.includes('*')||[...text.matchAll(/\*{1,3}[^*\n]+\*{1,3}/g)].some(m=>a<m.index+m[0].length&&b>m.index)&&!(left===right&&[1,2,3].includes(left)&&!selected.includes('*')))throw new Error('Select the complete emphasized phrase to change its formatting.');
 if(has)return replace(a-n,b+n,selected);
 // Applying emphasis paragraph by paragraph keeps clean Markdown across blank lines.
 const value=selected.split(/(\n\s*\n)/).map((part,i)=>i%2||!part.trim()?part:part.replace(/^(\s*)([\s\S]*?)(\s*)$/,(_,lead,body,tail)=>lead+mark+body+mark+tail)).join('');
 return replace(a,b,value,n,value.length-n);
}
