import test from 'node:test';
import assert from 'node:assert/strict';
import {createWritingContentHandler,LIMITS} from '../supabase/functions/writing-content/handler.mjs';
import {createWritingGithubFixture} from './helpers/writing-github-fixture.mjs';
import {parseArticle} from '../assets/js/writing-content.mjs';

const OWNER='38531f7e-e05e-473a-a587-500b1d3aebe5';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=','base64');
const article=(slug='existing')=>`---\ntitle: "Existing article"\nslug: "${slug}"\ndate: "2026-09-18"\ncategory: "Architecture"\ncover: "/writing/${slug}/cover.png"\ncover_alt: "Original image"\nexcerpt: "Original excerpt"\nfeatured: true\ndisplay_order: 7\ntags:\n  - "AI"\n  - "Architecture"\n---\nOriginal body.\n\n![Original inline image](/writing/${slug}/cover.png)\n`;
function setup(options={}){
 const fixture=options.fixture||createWritingGithubFixture({articles:{existing:article()},media:{'public/writing/existing/cover.png':PNG},extraFiles:{'private/secret.txt':'not public','index.html':'unchanged site'},onRequest:options.onRequest});
 const users={owner:{id:OWNER,email_confirmed_at:'yes'},other:{id:'other',email_confirmed_at:'yes'},anonymous:{id:OWNER,email_confirmed_at:'yes',is_anonymous:true},unconfirmed:{id:OWNER},forged:{id:'other',email_confirmed_at:'yes',user_metadata:{owner:true,id:OWNER}}};
 const env={SUPABASE_URL:'https://fixture.invalid',SUPABASE_SERVICE_ROLE_KEY:'service-secret',MAIN_WRITING_GITHUB_TOKEN:'github-secret',...options.env};
 const h=createWritingContentHandler({getEnv:k=>env[k],createClient:()=>({auth:{getUser:async token=>({data:{user:users[token]}})}}),fetchImpl:fixture.fetch,now:options.now});
 const request=(body,token='owner',headers={})=>h(new Request('https://backend.invalid/writing-content',{method:'POST',headers:{origin:'https://main.ycsu.cc',...(token?{authorization:'Bearer '+token}:{}),...headers},body:JSON.stringify(body)}));
 return {fixture,h,request,async read(){const r=await request({operation:'read-article',slug:'existing'});assert.equal(r.status,200);return r.json();},async save(data,extras={}){const {revision}=await this.read();return request({operation:'save-article',slug:'existing',revision,data,uploads:[],...extras});}};
}

test('content API verifies exact confirmed owner and never exposes credentials or accepts arbitrary paths',async()=>{
 const c=setup();for(const token of ['', 'other','anonymous','unconfirmed','forged','invalid']){
  for(const operation of ['read-article','save-article'])assert.ok([401,403].includes((await c.request({operation,slug:'existing',...(operation==='save-article'?{data:{},revision:'a'.repeat(40)}:{})},token)).status));
 }
 assert.equal(c.fixture.calls.length,0);
 for(const slug of ['../secret','existing/other','%2e%2e','existing.md','EXISTING'])assert.equal((await c.request({operation:'read-article',slug})).status,400);
 assert.equal(c.fixture.calls.length,0);assert.equal((await c.request({operation:'read-public',repo:'other/repo'},'')).status,400);
 assert.equal((await c.request({operation:'read-public'},'',{origin:'https://evil.invalid'})).status,403);
 const out=await c.read();assert.equal(out.article.body,parseArticle(article()).body);assert.deepEqual(out.assets,['/writing/existing/cover.png']);assert.match(out.revision,/^[a-f0-9]{40}$/);assert.doesNotMatch(JSON.stringify(out),/github-secret|service-secret|not public|private\/secret/);
 for(const call of c.fixture.calls){assert.equal(call.options.redirect,'error');assert.ok(call.options.signal);}
});

test('missing GitHub secret fails closed for owner and public can use only public Git reads',async()=>{
 const c=setup({env:{MAIN_WRITING_GITHUB_TOKEN:undefined}});const response=await c.request({operation:'read-article',slug:'existing'});assert.equal(response.status,503);assert.equal((await response.json()).code,'EDITOR_NOT_CONFIGURED');assert.equal(c.fixture.calls.length,0);
 const pub=await c.request({operation:'read-public'},'');assert.equal(pub.status,200);assert.equal((await pub.json()).articles.length,1);assert.ok(c.fixture.calls.every(call=>!call.options.headers.Authorization));
});

test('public manifest uses immutable media and supports 100 articles with bounded concurrency and cache',async()=>{
 let active=0,peak=0,time=0;const articles={},media={};for(let i=0;i<100;i++){const slug='article-'+i;articles[slug]=article(slug);media[`public/writing/${slug}/cover.png`]=PNG;}
 const fixture=createWritingGithubFixture({articles,media,onRequest:async call=>{if(call.endpoint.startsWith('/git/blobs/')&&call.method==='GET'){active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;}}});
 const c=setup({fixture,now:()=>time});const result=await (await c.request({operation:'read-public'},'')).json();assert.equal(result.ok,true);assert.equal(result.schema,1);assert.equal(result.articles.length,100);assert.ok(peak<=4&&peak>1);assert.match(result.articles[0].cover,new RegExp('/'+fixture.head+'/public/writing/'));assert.match(result.articles[0].reader_html,/raw\.githubusercontent\.com/);assert.equal(result.articles[0].body,undefined);assert.equal(result.revision,undefined);
 const calls=fixture.calls.length;await c.request({operation:'read-public'},'');assert.equal(fixture.calls.length,calls+1);time=30001;await c.request({operation:'read-public'},'');assert.ok(fixture.calls.length>calls);
});

test('article and replacement images update atomically, preserve protected metadata and invalidate manifest cache',async()=>{
 const c=setup();const originalHead=c.fixture.head;await c.request({operation:'read-public'},'');
 const name='replacement-abcdefgh1234.png',url='/writing/existing/'+name;
 const r=await c.save({title:'Corrected title',date:'2026-09-17',category:'Design',excerpt:'Corrected excerpt',body:`Corrected paragraph.\n\n![New inline image](${url})\n`,cover:url,cover_alt:'New image',video_url:'https://example.com/video',linkedin_url:'https://www.linkedin.com/posts/example',facebook_url:'https://www.facebook.com/example'},{uploads:[{name,base64:PNG.toString('base64')}]});
 assert.equal(r.status,200);const result=await r.json();assert.equal(result.unchanged,false);assert.notEqual(c.fixture.head,originalHead);
 const saved=parseArticle(c.fixture.read('content/writing/existing.md').toString());assert.equal(saved.title,'Corrected title');assert.match(saved.body,/Corrected paragraph/);assert.equal(saved.featured,true);assert.equal(saved.display_order,7);assert.deepEqual(saved.tags,['AI','Architecture']);assert.equal(saved.slug,'existing');assert.equal(saved.cover,url);assert.equal(saved.video_url,'https://example.com/video');assert.equal(saved.excerpt,'Corrected excerpt');assert.equal(saved.linkedin_url,'https://www.linkedin.com/posts/example');
 assert.deepEqual(c.fixture.read('public/writing/existing/cover.png'),PNG);assert.deepEqual(c.fixture.read('public/writing/existing/'+name),PNG);assert.equal(c.fixture.read('index.html').toString(),'unchanged site');
 const tree=c.fixture.calls.find(call=>call.method==='POST'&&call.endpoint==='/git/trees');assert.deepEqual(tree.body.tree.map(n=>n.path).sort(),['content/writing/existing.md','public/writing/existing/'+name]);assert.ok(tree.body.tree.every(n=>n.sha));
 const commits=c.fixture.calls.filter(call=>call.method==='POST'&&call.endpoint==='/git/commits');assert.equal(commits.length,1);assert.deepEqual(commits[0].body.parents,[originalHead]);const patch=c.fixture.calls.find(call=>call.method==='PATCH');assert.equal(patch.body.force,false);
 const manifest=await (await c.request({operation:'read-public'},'')).json();assert.equal(manifest.articles[0].title,'Corrected title');assert.match(manifest.articles[0].cover,new RegExp(c.fixture.head));
});

test('no-op saves preserve source and main ref; stale article SHA and missing articles cannot write',async()=>{
 const c=setup();const before=c.fixture.head;const current=await c.read();const data=Object.fromEntries(Object.entries(current.article).filter(([key])=>['title','date','category','excerpt','body','cover','cover_alt','video_url','linkedin_url','facebook_url'].includes(key)));
 const r=await c.request({operation:'save-article',slug:'existing',revision:current.revision,data,uploads:[]});assert.equal(r.status,200);assert.equal((await r.json()).unchanged,true);assert.equal(c.fixture.head,before);assert.equal(c.fixture.calls.some(call=>call.method!=='GET'),false);assert.equal(c.fixture.read('content/writing/existing.md').toString(),article());
 assert.equal((await c.request({operation:'save-article',slug:'existing',revision:'0'.repeat(40),data:{title:'Stale'}})).status,409);assert.equal((await c.request({operation:'read-article',slug:'missing'})).status,404);assert.equal(c.fixture.calls.some(call=>call.method!=='GET'),false);
});

test('uploads reject existing paths, SVG, mismatched magic, unused assets, missing media, excess payloads and immutable-field edits',async()=>{
 const c=setup();const {revision}=await c.read();const send=(data,uploads=[])=>c.request({operation:'save-article',slug:'existing',revision,data,uploads});
 const base64=PNG.toString('base64'),name='replacement-abcdefgh.png';
 for(const [data,uploads] of [[{tags:['Changed']},[]],[{slug:'other'},[]],[{featured:false},[]],[{display_order:2},[]],[{body:'<script>bad</script>',cover:'/writing/other/cover.png'},[]],[{cover:'/writing/existing/missing.png'},[]],[{},[{name:'../outside.png',base64}]],[{},[{name:'replacement-abcdefgh.svg',base64}]],[{cover:'/writing/existing/'+name},[{name,base64:btoa('<svg onload="bad">')}]], [{},[{name,base64}]],[{},[{name,base64},{name,base64}]], [{},Array(5).fill({name,base64})]])assert.ok([400,422].includes((await send(data,uploads)).status));
 const tooBig=Buffer.alloc(LIMITS.upload+1).toString('base64');assert.ok([400,413].includes((await send({},[{name,base64:tooBig}])).status));
 const body='x'.repeat(LIMITS.article+1);assert.equal((await send({body})).status,413);
 assert.equal(c.fixture.calls.some(call=>call.method!=='GET'),false);
 const request=new Request('https://backend.invalid',{method:'POST',headers:{'content-length':String(LIMITS.request+1)},body:'{}'});assert.equal((await c.h(request)).status,413);
});

test('branch races before ref update and at atomic ref update return conflict without losing unrelated changes',async()=>{
 for(const when of ['before','atomic']){
  let raced=false;const c=setup({onRequest:(call,f)=>{if(!raced&&((when==='before'&&call.endpoint==='/git/commits'&&call.method==='POST')||(when==='atomic'&&call.method==='PATCH'))){raced=true;f.commitExternal({'index.html':'external update'});}}});
  const response=await c.save({title:'Uncommitted candidate'});assert.equal(response.status,409);assert.equal(c.fixture.read('index.html').toString(),'external update');assert.equal(parseArticle(c.fixture.read('content/writing/existing.md').toString()).title,'Existing article');assert.equal(c.fixture.calls.filter(call=>call.method==='PATCH').length,when==='atomic'?1:0);
 }
});

test('an old in-flight public read cannot repopulate cache after a save',async()=>{
 let first=true,release;const c=setup({onRequest:call=>{if(first&&call.method==='GET'&&call.endpoint.startsWith('/git/blobs/')){first=false;return new Promise(r=>{release=()=>r(undefined)});}}});
 const old=c.request({operation:'read-public'},'');while(!release)await new Promise(r=>setTimeout(r,1));
 assert.equal((await c.save({title:'Newest title'})).status,200);release();assert.equal((await old).status,200);
 const fresh=await (await c.request({operation:'read-public'},'')).json();assert.equal(fresh.articles[0].title,'Newest title');
});

test('upstream failures stay sanitized and redirect responses are never followed',async()=>{
 const c=setup({onRequest:()=>Response.json({message:'github-secret service-secret private/secret.txt'},{status:403})});const response=await c.request({operation:'read-public'},'');assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/github-secret|service-secret|private\/secret/);assert.equal(c.fixture.calls[0].options.redirect,'error');
});

test('maximum-size images, optional empty URLs and total upload limits are enforced without regex stack failure',async()=>{
 const c=setup();const padded=Buffer.alloc(LIMITS.upload);PNG.copy(padded);const name='replacement-large1234.png';
 let response=await c.save({cover:'/writing/existing/'+name,video_url:'',linkedin_url:'',facebook_url:''},{uploads:[{name,base64:padded.toString('base64')}]});assert.equal(response.status,200);const saved=parseArticle(c.fixture.read('content/writing/existing.md').toString());assert.equal(saved.video_url,null);assert.equal(saved.linkedin_url,null);assert.equal(c.fixture.read('public/writing/existing/'+name).length,LIMITS.upload);
 response=await c.save({cover:'/writing/existing/'+name},{uploads:[{name,base64:PNG.toString('base64')}]});assert.equal(response.status,400);
 const next=setup();const bytes=Buffer.alloc(3*1024*1024+1);PNG.copy(bytes);const uploads=['replacement-total111.png','replacement-total222.png'].map(name=>({name,base64:bytes.toString('base64')}));response=await next.save({body:uploads.map(u=>`![Alt](/writing/existing/${u.name})`).join('\n')},{uploads});assert.equal(response.status,413);assert.equal(next.fixture.calls.some(call=>call.method!=='GET'),false);
});

test('public requests revalidate unchanged main with one request, owner reads always bypass public cache',async()=>{
 let time=0;const c=setup({now:()=>time});await c.request({operation:'read-public'},'');const count=c.fixture.calls.length;time=30001;await c.request({operation:'read-public'},'');assert.equal(c.fixture.calls.length,count+1);assert.equal(c.fixture.calls.at(-1).endpoint,'/git/ref/heads/main');
 await c.read();assert.ok(c.fixture.calls.length>count+2);
});

test('save result carries immutable committed article and another isolate revalidates its old manifest',async()=>{
 const fixture=createWritingGithubFixture({articles:{existing:article()},media:{'public/writing/existing/cover.png':PNG}}),writer=setup({fixture}),reader=setup({fixture});
 const before=await (await reader.request({operation:'read-public'},'')).json();assert.equal(before.articles[0].title,'Existing article');
 const name='replacement-newest123.png';const result=await (await writer.save({title:'Committed title',cover:'/writing/existing/'+name},{uploads:[{name,base64:PNG.toString('base64')}]})).json();
 assert.equal(result.public_article.title,'Committed title');assert.equal(result.commit,fixture.head);assert.equal(result.public_article.cover,`https://raw.githubusercontent.com/blackeirose/YCSU-Platform/${fixture.head}/public/writing/existing/${name}`);assert.match(result.public_article.reader_html,new RegExp(fixture.head));
 const cached=await (await reader.request({operation:'read-public'},'')).json();assert.equal(cached.articles[0].title,'Committed title');
 const unchanged=await (await writer.save({})).json();assert.equal(unchanged.unchanged,true);assert.equal(unchanged.commit,fixture.head);assert.equal(unchanged.public_article.title,'Committed title');
});
