import {lifecycleFixture} from '../tests/helpers/lifecycle-fixture.mjs';
import {createWritingContentHandler} from '../supabase/functions/writing-content/handler.mjs';
import {createWritingGithubFixture} from '../tests/helpers/writing-github-fixture.mjs';
// Explicit, attended loopback QA only. Never copied into dist. No production calls.
import http from 'node:http';import {readFile,readdir,stat} from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';import {stripTypeScriptTypes} from 'node:module';import {PGlite} from '@electric-sql/pglite';
const root=fileURLToPath(new URL('../',import.meta.url)),base=path.join(root,process.argv.includes('--empty')?'dist':'dist-qa');
const fixture=await lifecycleFixture(),db=fixture.db,handler=fixture.writing;
// The real SQL and handler use only labelled synthetic records in this in-memory DB.
await db.query("update product_registry set slug='ycsu-platform' where id=$1",[fixture.ids[0]]);
const contentRoot=process.argv.includes('--empty')?root:path.join(root,'tests/fixtures'),qaArticles={},qaMedia={};
for(const name of await readdir(path.join(contentRoot,'content/writing'))){if(!name.endsWith('.md'))continue;const slug=name.slice(0,-3);qaArticles[slug]=await readFile(path.join(contentRoot,'content/writing',name),'utf8');try{for(const file of await readdir(path.join(contentRoot,'public/writing',slug)))qaMedia['public/writing/'+slug+'/'+file]=await readFile(path.join(contentRoot,'public/writing',slug,file));}catch{}}
const github=createWritingGithubFixture({articles:qaArticles,media:qaMedia});
const contentHandler=createWritingContentHandler({getEnv:()=> 'qa-token',fetchImpl:github.fetch,createClient:()=>({auth:{getUser:async token=>({data:{user:token==='qa-owner'?{id:'38531f7e-e05e-473a-a587-500b1d3aebe5',email_confirmed_at:'yes'}:null}})}})});

const sdk=`window.supabase={createClient(){let cb;const session=()=>localStorage.getItem('qa-writing-owner')?{access_token:'qa-owner'}:null;return {auth:{onAuthStateChange(fn){cb=fn},async getSession(){return {data:{session:session()}}},async signOut(){localStorage.removeItem('qa-writing-owner');localStorage.removeItem('ycsu-main-owner-session');cb?.('SIGNED_OUT',null);return {}},async signInWithOtp(){return {error:{message:'Use the isolated QA session button.'}}}}}}};`;
const banner=`<aside style="position:fixed;bottom:0;left:0;z-index:10000;padding:4px 8px;background:#142238;color:white;font:12px sans-serif">ISOLATED QA · test content only <button id="qa-owner">Enter test owner session</button> <a style="color:white" href="?qa-theme=light">Light</a> <a style="color:white" href="?qa-theme=dark">Dark</a></aside><script>document.getElementById('qa-owner').onclick=()=>{localStorage.setItem('qa-writing-owner','1');localStorage.setItem('ycsu-main-owner-session','qa-fixture');location.reload()};</script>`;
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png'};
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://127.0.0.1:4173');res.setHeader('cache-control','no-store');
 if(url.pathname==='/functions/v1/writing-content'){
  let body='';for await(const chunk of req)body+=chunk;
  const response=await contentHandler(new Request(url,{method:'POST',headers:{authorization:req.headers.authorization||''},body}));
  const text=(await response.text()).replaceAll(/https:\/\/raw\.githubusercontent\.com\/blackeirose\/YCSU-Platform\/[a-f0-9]{40}\/public/g,'');
  res.writeHead(response.status,{'content-type':'application/json'});res.end(text);return;
 }
 if(url.pathname.startsWith('/writing/')&&!url.pathname.endsWith('/')){const media=github.read('public'+url.pathname);if(media){res.setHeader('content-type',types[path.extname(url.pathname)]||'application/octet-stream');res.end(media);return}}
 if(url.pathname==='/functions/v1/writing-ops'){
  let body='';for await(const chunk of req)body+=chunk;const response=await handler(new Request(url,{method:'POST',headers:{authorization:req.headers.authorization||''},body}));res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());return;
 }
 if(url.pathname==='/functions/v1/registry-ops'){
  let body='';for await(const chunk of req)body+=chunk;
  const response=await fixture.registry(new Request(url,{method:'POST',headers:{authorization:req.headers.authorization||''},body}));
  res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());return;
 }
 if(url.pathname==='/assets/vendor/supabase-2.116.0.js'){res.setHeader('content-type','text/javascript');res.end(sdk);return}
 let file=path.resolve(base,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(base+path.sep)&&file!==base){res.writeHead(403);res.end();return}
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');let content=await readFile(file);const ext=path.extname(file);res.setHeader('content-type',types[ext]||'application/octet-stream');
 if(ext==='.html'){
  let html=content.toString().replaceAll('https://fzydsnxxcdllkjxwdiwn.supabase.co','http://127.0.0.1:4173').replace('</body>',banner+'</body>');
  const theme=url.searchParams.get('qa-theme');if(['light','dark'].includes(theme)){
   html=html.replaceAll('@media (prefers-color-scheme: light)',theme==='light'?'@media screen':'@media not all').replace('/assets/writing.css','/assets/writing.css?qa-theme='+theme);
  }
  content=html;
 }
 if(ext==='.css'&&url.searchParams.has('qa-theme'))content=content.toString().replaceAll('@media(prefers-color-scheme:light)',url.searchParams.get('qa-theme')==='light'?'@media screen':'@media not all');
 res.end(content);
}catch(error){res.writeHead(404);res.end('Not found');console.error(req.url,error.message)}});
server.listen(4173,'127.0.0.1',()=>console.log('Isolated MAIN Writing QA: http://127.0.0.1:4173 (in-memory settings, fake session, no external writes)'));
