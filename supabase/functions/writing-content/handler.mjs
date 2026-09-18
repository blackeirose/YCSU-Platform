import {parseArticle,serializeArticle,articleHtml} from '../../../assets/js/writing-content.mjs';
import {validSlug} from '../../../assets/js/writing-model.mjs';

const OWNER='38531f7e-e05e-473a-a587-500b1d3aebe5';
const REPO='blackeirose/YCSU-Platform';
const API=`https://api.github.com/repos/${REPO}`;
const ORIGIN='https://main.ycsu.cc';
const SHA=/^[a-f0-9]{40}$/;
const MEDIA=/^[a-zA-Z0-9_-]+\.(?:png|webp|jpe?g|gif|avif|mp4|webm)$/;
const UPLOAD=/^replacement-[a-zA-Z0-9_-]{8,100}\.(?:png|webp|jpe?g|gif)$/;
const EDITABLE=new Set(['title','date','category','excerpt','body','cover','cover_alt','video_url','linkedin_url','facebook_url']);
const METADATA=['title','slug','date','category','excerpt','cover','cover_alt','video_url','linkedin_url','facebook_url','tags','featured','display_order'];
export const LIMITS=Object.freeze({request:9*1024*1024,article:128*1024,articles:200,manifest:8*1024*1024,upload:4*1024*1024,uploads:4,totalUploads:6*1024*1024,concurrency:4});
const encoder=new TextEncoder();
class Failure extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code;}}
const fail=(status,code,message)=>{throw new Failure(status,code,message)};
const invalid=()=>fail(400,'INVALID_REQUEST','Invalid article request.');
const unavailable=()=>fail(503,'CONTENT_UNAVAILABLE','Writing content is unavailable. Try again later.');
const conflict=()=>fail(409,'CONFLICT','The article or repository changed. Reload before saving.');
function object(value){return !!value&&typeof value==='object'&&!Array.isArray(value);}
function only(value,keys){if(!object(value)||Object.keys(value).some(key=>!keys.includes(key)))invalid();}
function checkedSHA(value){if(typeof value!=='string'||!SHA.test(value))unavailable();return value;}
async function boundedText(source,limit){
 if(Number(source.headers.get('content-length'))>limit)fail(413,'TOO_LARGE','Content exceeds the allowed size.');
 if(!source.body)return '';
 const reader=source.body.getReader(),decoder=new TextDecoder('utf-8',{fatal:true});let size=0,text='';
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();fail(413,'TOO_LARGE','Content exceeds the allowed size.');}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
 finally{reader.releaseLock();}
}
function bytesFromBase64(value,limit){
 if(typeof value!=='string'||value.length>Math.ceil(limit/3)*4||!value.length||value.length%4||/[^A-Za-z0-9+/=]/.test(value))invalid();
 const padding=value.indexOf('=');if(padding!==-1&&(padding<value.length-2||!/^={1,2}$/.test(value.slice(padding))))invalid();
 let binary;try{binary=atob(value)}catch{invalid();}if(binary.length>limit)fail(413,'TOO_LARGE','Content exceeds the allowed size.');
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function imageMatches(bytes,name){
 const ext=name.split('.').at(-1),at=(...v)=>v.every((n,i)=>bytes[i]===n),ascii=(a,b)=>String.fromCharCode(...bytes.slice(a,b));
 if(ext==='png')return bytes.length>=24&&at(137,80,78,71,13,10,26,10)&&ascii(12,16)==='IHDR';
 if(ext==='webp')return bytes.length>=20&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'&&['VP8 ','VP8L','VP8X'].includes(ascii(12,16));
 if(ext==='jpg'||ext==='jpeg')return bytes.length>=4&&at(255,216,255)&&bytes.at(-2)===255&&bytes.at(-1)===217;
 return ext==='gif'&&bytes.length>=14&&['GIF87a','GIF89a'].includes(ascii(0,6))&&bytes.at(-1)===59;
}
function parse(source,slug){
 let article;try{article=parseArticle(source)}catch{fail(422,'INVALID_ARTICLE','Article Markdown or metadata is invalid.');}
 if(article.slug!==slug)fail(422,'INVALID_ARTICLE','Article slug does not match its canonical path.');return article;
}
function fields(article){return Object.fromEntries(METADATA.filter(k=>article[k]!==undefined).map(k=>[k,article[k]]));}
function localReferences(article){
 return [...new Set([article.cover,article.video_url,...[...article.html.matchAll(/(?:src|href)="([^\"]+)"/g)].map(m=>m[1])].filter(url=>typeof url==='string'&&url.startsWith('/writing/')))];
}
function validateReferences(article,assets){
 for(const url of localReferences(article))if(!url.startsWith(`/writing/${article.slug}/`)||!assets.has(url.slice(`/writing/${article.slug}/`.length)))fail(422,'INVALID_MEDIA','Local media must exist in this article directory.');
}
function publicArticle(article,commit){
 const base=`https://raw.githubusercontent.com/${REPO}/${checkedSHA(commit)}/public`;
 const media=value=>typeof value==='string'&&value.startsWith(`/writing/${article.slug}/`)?base+value:value;
 const result=fields(article);for(const key of ['cover','video_url'])if(result[key])result[key]=media(result[key]);
 result.html=article.html.replace(/(src|href)="(\/writing\/[^\"]+)"/g,(_,attr,url)=>`${attr}="${media(url)}"`);
 result.reader_html=articleHtml({...article,...result});return result;
}
async function concurrent(items,run){
 const results=new Array(items.length);let cursor=0;
 await Promise.all(Array.from({length:Math.min(items.length,LIMITS.concurrency)},async()=>{for(;;){const index=cursor++;if(index>=items.length)return;results[index]=await run(items[index]);}}));return results;
}

/** No DB writes, dynamic repo names, arbitrary URLs, or client-supplied file paths. */
export function createWritingContentHandler({createClient,getEnv,fetchImpl=fetch}){
 let cache=null,inflight=null,epoch=0;
 const headers={'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':ORIGIN,'access-control-allow-headers':'authorization, apikey, content-type','access-control-allow-methods':'POST, OPTIONS','vary':'Origin'};
 const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 function github(token){return async(endpoint,method='GET',body)=>{
  const response=await fetchImpl(API+endpoint,{method,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'YCSU-MAIN-Writing',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'YCSU-MAIN-Writing','Content-Type':'application/json',Authorization:`Bearer ${token}`}}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok){if(method==='PATCH'&&[409,422].includes(response.status))conflict();unavailable();}
  let data;try{data=JSON.parse(await boundedText(response,16*1024*1024))}catch(error){if(error instanceof Failure)throw error;unavailable();}return data;
 };}
 async function head(api){return checkedSHA((await api('/git/ref/heads/main')).object?.sha);}
 async function snapshot(api,knownCommit){
  const commit=knownCommit??await head(api),record=await api(`/git/commits/${commit}`),tree=checkedSHA(record.tree?.sha),memo=new Map();
  async function entries(sha){if(!memo.has(sha))memo.set(sha,api(`/git/trees/${checkedSHA(sha)}`).then(data=>{if(data.truncated||!Array.isArray(data.tree))unavailable();return data.tree;}));return memo.get(sha);}
  async function directory(parts){let sha=tree;for(const part of parts){const entry=(await entries(sha)).find(e=>e.path===part);if(!entry)return [];if(entry.type!=='tree'||entry.mode!=='040000')unavailable();sha=checkedSHA(entry.sha);}return entries(sha);}
  const articles=(await directory(['content','writing'])).filter(e=>e.path.endsWith('.md'));
  if(articles.length>LIMITS.articles)fail(503,'CAPACITY_LIMIT','Writing article capacity exceeded.');
  for(const entry of articles)if(!validSlug(entry.path.slice(0,-3))||entry.type!=='blob'||entry.mode!=='100644'||!SHA.test(entry.sha)||entry.size>LIMITS.article)unavailable();
  return {commit,tree,articles,directory};
 }
 async function readSource(api,entry){
  const blob=await api(`/git/blobs/${checkedSHA(entry.sha)}`);if(blob.encoding!=='base64'||typeof blob.content!=='string'||blob.size>LIMITS.article)unavailable();
  const encoded=blob.content.replace(/\n/g,'');let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytesFromBase64(encoded,LIMITS.article));}catch{unavailable();}return text;
 }
 async function assetsFor(snap,slug){
  const entries=await snap.directory(['public','writing',slug]);
  return new Set(entries.filter(e=>e.type==='blob'&&e.mode==='100644'&&MEDIA.test(e.path)).map(e=>e.path));
 }
 async function manifest(token){
  // Every caller checks canonical main, including other Edge isolates after a save.
  const current=epoch,api=github(token),commit=await head(api);
  if(cache?.commit===commit)return cache.value;
  if(inflight?.commit===commit)return inflight.promise;
  const pending=(async()=>{const snap=await snapshot(api,commit);let total=0;
   const articles=await concurrent(snap.articles,async entry=>{const source=await readSource(api,entry);total+=encoder.encode(source).byteLength;if(total>LIMITS.manifest)fail(503,'CAPACITY_LIMIT','Writing content capacity exceeded.');const article=parse(source,entry.path.slice(0,-3));validateReferences(article,await assetsFor(snap,article.slug));return publicArticle(article,snap.commit);});
   const value={ok:true,schema:1,articles};if(epoch===current)cache={value,commit:snap.commit};return value;
  })();const flight={commit,promise:pending};inflight=flight;
  try{return await pending}finally{if(inflight===flight)inflight=null;}
 }
 async function edit(api,body){
  if(!validSlug(body.slug))invalid();
  const snap=await snapshot(api),entry=snap.articles.find(e=>e.path===`${body.slug}.md`);
  if(!entry)fail(404,'ARTICLE_NOT_FOUND','This published article was not found.');
  const source=await readSource(api,entry),article=parse(source,body.slug),assets=await assetsFor(snap,body.slug);
  if(body.operation==='read-article')return {ok:true,article:{...fields(article),body:article.body},revision:entry.sha,assets:[...assets].sort().map(name=>`/writing/${body.slug}/${name}`)};
  if(typeof body.revision!=='string'||!SHA.test(body.revision))invalid();if(body.revision!==entry.sha)conflict();
  only(body.data,[...EDITABLE]);
  const patch={};for(const [key,value] of Object.entries(body.data)){if(value!==null&&typeof value!=='string')invalid();if(value===null&&['body','title','date'].includes(key))invalid();patch[key]=(['cover','video_url','linkedin_url','facebook_url'].includes(key)&&value==='')?null:value;}
  const next={...article,...patch};if(typeof next.body!=='string'||encoder.encode(next.body).length>LIMITS.article)fail(413,'TOO_LARGE','Article exceeds the allowed size.');
  let serialized;try{serialized=serializeArticle(next)}catch{fail(422,'INVALID_ARTICLE','Article Markdown or metadata is invalid.');}if(encoder.encode(serialized).length>LIMITS.article)fail(413,'TOO_LARGE','Article exceeds the allowed size.');
  const checked=parse(serialized,body.slug),uploads=body.uploads??[];
  if(!Array.isArray(uploads)||uploads.length>LIMITS.uploads)invalid();
  let total=0;const names=new Set(),prepared=[];
  const occupied=new Set((await snap.directory(['public','writing',body.slug])).map(entry=>entry.path));
  for(const upload of uploads){
   only(upload,['name','base64']);if(typeof upload.name!=='string'||!UPLOAD.test(upload.name)||names.has(upload.name)||occupied.has(upload.name))invalid();
   const bytes=bytesFromBase64(upload.base64,LIMITS.upload);total+=bytes.length;if(total>LIMITS.totalUploads)fail(413,'TOO_LARGE','Image upload total exceeds the allowed size.');if(!imageMatches(bytes,upload.name))fail(422,'INVALID_IMAGE','Image format does not match its filename.');
   names.add(upload.name);prepared.push(upload);
  }
  const references=new Set(localReferences(checked));
  for(const name of names)if(!references.has(`/writing/${body.slug}/${name}`))fail(422,'UNUSED_UPLOAD','Each uploaded image must be used by the article.');
  validateReferences(checked,new Set([...assets,...names]));
  const changed=Object.entries(patch).some(([key,value])=>(article[key]??null)!==value);
  if(!changed&&!prepared.length){if(await head(api)!==snap.commit)conflict();return {ok:true,unchanged:true,revision:entry.sha,commit:snap.commit,public_article:publicArticle(article,snap.commit),article:{...fields(article),body:article.body}};}
  const nodes=[];
  for(const upload of prepared){const blob=await api('/git/blobs','POST',{content:upload.base64,encoding:'base64'});nodes.push({path:`public/writing/${body.slug}/${upload.name}`,mode:'100644',type:'blob',sha:checkedSHA(blob.sha)});}
  const blob=await api('/git/blobs','POST',{content:serialized,encoding:'utf-8'});nodes.push({path:`content/writing/${body.slug}.md`,mode:'100644',type:'blob',sha:checkedSHA(blob.sha)});
  const tree=await api('/git/trees','POST',{base_tree:snap.tree,tree:nodes});
  const commit=await api('/git/commits','POST',{message:`Update Writing article: ${body.slug}`,tree:checkedSHA(tree.sha),parents:[snap.commit]});
  if(await head(api)!==snap.commit)conflict();
  // force:false is the final atomic check if another commit races this request.
  await api('/git/refs/heads/main','PATCH',{sha:checkedSHA(commit.sha),force:false});
  ++epoch;cache=null;inflight=null;
  return {ok:true,unchanged:false,revision:blob.sha,commit:commit.sha,public_article:publicArticle(checked,commit.sha),article:{...fields(checked),body:checked.body}};
 }
 return async req=>{
  try{
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers});if(req.method!=='POST')return reply(405,{ok:false,error:'POST required.'});
   if(req.headers.get('origin')&&req.headers.get('origin')!==ORIGIN)return reply(403,{ok:false,error:'Origin denied.'});
   let body;try{body=JSON.parse(await boundedText(req,LIMITS.request))}catch(error){if(error instanceof Failure)throw error;invalid();}
   if(!object(body)||!['read-public','read-article','save-article'].includes(body.operation))invalid();
   only(body,body.operation==='read-public'?['operation']:body.operation==='read-article'?['operation','slug']:['operation','slug','revision','data','uploads']);
   if(body.operation!=='read-public'){
    const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return reply(401,{ok:false,error:'Owner session required.'});
    const client=createClient(getEnv('SUPABASE_URL'),getEnv('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await client.auth.getUser(token),user=data?.user;
    if(error||!user||user.id!==OWNER||!user.email_confirmed_at||user.is_anonymous)return reply(403,{ok:false,error:'Owner access required.'});
   }
   const token=getEnv('MAIN_WRITING_GITHUB_TOKEN');
   if(body.operation==='read-public')return reply(200,await manifest(token));
   if(!token)return reply(503,{ok:false,code:'EDITOR_NOT_CONFIGURED',error:'Article editing is not configured yet.'});
   return reply(200,await edit(github(token),body));
  }catch(error){return error instanceof Failure?reply(error.status,{ok:false,code:error.code,error:error.message}):reply(503,{ok:false,code:'CONTENT_UNAVAILABLE',error:'Writing content is unavailable. Reload to check the latest state.'});}
 };
}
