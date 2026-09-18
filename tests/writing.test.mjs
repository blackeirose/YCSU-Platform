import test from 'node:test';import assert from 'node:assert/strict';import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {stripTypeScriptTypes} from 'node:module';import {PGlite} from '@electric-sql/pglite';import {JSDOM} from 'jsdom';
import {parseArticle,markdown,buildWriting} from '../scripts/writing-content.mjs';
import {defaults,featuredArticle,articleOrder,mixedCards,writingCard,validateSettings,readPresentation} from '../assets/js/writing-model.mjs';
import {createWritingViewer,wireImages} from '../assets/js/writing-viewer.mjs';
const fixture=await readFile(new URL('fixtures/content/writing/qa-first.md',import.meta.url),'utf8');
test('Markdown frontmatter validates schema, rejects ambiguous/malformed/unsafe input and escapes raw HTML',()=>{
 const a=parseArticle(fixture);assert.equal(a.title,'QA only: A quieter place to read');assert.match(a.html,/<h2>/);assert.match(a.html,/<figure>/);assert.match(a.html,/<strong>test content/);
 for(const bad of [fixture.replace('slug: "qa-first"','slug: "../secret"'),fixture.replace('date: "2026-09-18"','date: "2026-02-30"'),fixture.replace('featured: true','featured: "true"'),fixture.replace('title:','unknown:'),fixture.replace('---\n',''),fixture.replace('display_order: 20','display_order: [20]'),fixture.replace('---\nThis','title: "duplicate"\n---\nThis')])assert.throws(()=>parseArticle(bad));
 assert.match(markdown('<script>alert(1)</script>'),/&lt;script&gt;/);assert.throws(()=>markdown('[click](javascript:alert)'),/HTTPS/);assert.throws(()=>markdown('![](/writing/a/a.webp)'),/alt/);assert.throws(()=>markdown('```\ncode'),/Unclosed/);
});
test('featured, article index, and mixed homepage order remain independent; new/stale product IDs reconcile',()=>{
 const articles=[{slug:'a',date:'2026-09-17',featured:true,display_order:20},{slug:'b',date:'2026-09-18',display_order:10}];
 assert.equal(featuredArticle(articles).slug,'a');assert.deepEqual(articleOrder(articles).map(a=>a.slug),['b','a']);
 assert.equal(featuredArticle(articles,{featured_slug:'b',article_order:['a','b']}).slug,'b');assert.equal(featuredArticle(articles.map(a=>({...a,featured:false}))).slug,'b');
 const products=[{id:'p1'},{id:'p2'}];assert.deepEqual(mixedCards(products,['old','writing','p2','writing']).map(p=>p.id),['writing','p2','p1']);assert.equal(products.length,2);assert.deepEqual(articleOrder(articles,{article_order:['a','b']}).map(a=>a.slug),['a','b']);
});
test('Writing card has a mandatory title, exactly one card, no Product status/version metadata and safe empty/media fallback',()=>{
 const dom=new JSDOM(writingCard([],defaults)),card=dom.window.document.querySelector('.card');assert.equal(card.dataset.productId,'writing');assert.equal(card.querySelector('h2').textContent,'Writing');assert.match(card.textContent,/No published articles/);assert.equal(card.querySelectorAll('img,.badge,.maturity-tag,.version-row,.cert-badge').length,0);assert.equal(card.querySelector('a').getAttribute('href'),'/writing/');
 const html=writingCard([{title:'<script>',slug:'safe',date:'2026-09-18',cover:'javascript:bad'}],defaults);assert.doesNotMatch(html,/<script>|src="javascript/);dom.window.close();
});
test('presentation projection never includes raw owner metadata; settings reject unsafe URLs, unexpected fields and duplicate order',()=>{
 assert.throws(()=>readPresentation({ok:true,settings:{},home_order:[],revision:4}),/Invalid/);
 for(const settings of [{secret:'x'},{cover:'//evil.invalid/x'},{cover:'/writing/a/../../secret'},{video_url:'javascript:alert(1)'},{article_order:['a','a']},{title:''}])assert.throws(()=>validateSettings(settings));
 assert.equal(readPresentation({ok:true,settings:{title:'Notes'},home_order:[]}).settings.title,'Notes');
});
test('static deep links render real article content and metadata without JS; production is empty and includes no demo media',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'main-writing-'));try{
  await mkdir(path.join(dir,'content/writing'),{recursive:true});await writeFile(path.join(dir,'content/writing/a.md'),fixture.replaceAll('cover: "/writing/qa-first/cover.webp"\n','').replace(/!\[QA[^\n]+\n/,''));
  const template=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.equal(await buildWriting({root:dir,out:path.join(dir,'out'),template}),1);
  const html=await readFile(path.join(dir,'out/writing/qa-first/index.html'),'utf8');assert.match(html,/id="writing-static"/);assert.match(html,/Space for a clear idea/);assert.match(html,/rel="canonical" href="https:\/\/main.ycsu.cc\/writing\/qa-first\//);assert.match(html,/from '\/assets/);assert.match(html,/property="og:title"/);
  await writeFile(path.join(dir,'content/writing/a.md'),fixture);await assert.rejects(buildWriting({root:dir,out:path.join(dir,'out'),template}),/Missing article media/);
  const prod=JSON.parse(await readFile(new URL('../dist/data/writing.json',import.meta.url),'utf8'));assert.deepEqual(prod.articles,[]);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('singleton RPC is atomic CAS, preserves independent fields, and forbids every browser role',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');await db.exec(await readFile(new URL('../supabase/migrations/20260918185542_main_writing_presentation.sql',import.meta.url),'utf8'));
  for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.exec('select * from main_presentation'),/permission denied/);await assert.rejects(db.exec("select * from update_main_presentation(0,'{}','[]')"),/permission denied/);await db.exec('reset role')}
  await db.exec('set role service_role');const a=await db.query("select * from update_main_presentation(0,'{\"featured_slug\":\"a\",\"article_order\":[\"b\",\"a\"]}',null)");assert.equal(a.rows[0].revision,1);
  assert.equal((await db.query("select * from update_main_presentation(0,'{\"title\":\"stale\"}',null)")).rows.length,0);
  const b=await db.query("select * from update_main_presentation(1,null,'[\"writing\",\"product\"]')");assert.equal(b.rows[0].settings.featured_slug,'a');assert.deepEqual(b.rows[0].settings.article_order,['b','a']);
 }finally{await db.close()}
});
test('Writing endpoint permits only exact confirmed nonanonymous owner writes and explicit public projection',async()=>{
 const source=stripTypeScriptTypes(await readFile(new URL('../supabase/functions/writing-ops/handler.ts',import.meta.url),'utf8')).replace('../../../assets/js/writing-model.mjs',new URL('../assets/js/writing-model.mjs',import.meta.url).href);
 const {createWritingHandler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));let writes=0;
 const row={settings:{},home_order:[],revision:7,secret:'never'};const h=createWritingHandler({getEnv:()=>'',createClient:()=>({auth:{getUser:async token=>({data:{user:token==='owner'?{id:'38531f7e-e05e-473a-a587-500b1d3aebe5',email_confirmed_at:'yes'}:token==='anonymous'?{id:'38531f7e-e05e-473a-a587-500b1d3aebe5',email_confirmed_at:'yes',is_anonymous:true}:token==='other'?{id:'other',email_confirmed_at:'yes'}:null}})},from:()=>({select(){return this},eq(){return this},single:async()=>({data:row})}),rpc:async(_name,args)=>{writes++;return {data:args.expected_revision===7?[{...row,revision:8}]:[]}}})});
 const req=(body,token='',origin='https://main.ycsu.cc')=>h(new Request('https://test.invalid',{method:'POST',headers:{authorization:token?'Bearer '+token:'',origin},body:JSON.stringify(body)}));
 const pub=await req({operation:'read-public'});assert.equal(pub.status,200);assert.deepEqual(Object.keys(await pub.json()),['ok','settings','home_order']);
 for(const token of ['', 'forged','other','anonymous'])assert.notEqual((await req({operation:'settings',revision:7,data:{title:'Notes'}},token)).status,200);
 assert.equal(writes,0);assert.equal((await req({operation:'settings',revision:7,data:{secret:'x'}},'owner')).status,400);assert.equal((await req({operation:'settings',revision:7,data:{title:'Notes'}},'owner')).status,200);assert.equal((await req({operation:'settings',revision:6,data:{title:'Notes'}},'owner')).status,409);assert.equal((await req({operation:'read-public'},'','https://evil.invalid')).status,403);
});
test('viewer supports deep entry, list/article transitions, history, focus, scroll lock and missing images',async()=>{
 const dom=new JSDOM('<body><a href="/writing/a/" data-writing-link>Writing</a>',{url:'https://main.example.invalid/'}),w=dom.window;
 Object.assign(globalThis,{window:w,document:w.document,location:w.location,history:w.history});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.HTMLElement.prototype.scrollIntoView=function(){};
 const viewer=createWritingViewer();viewer.setData([{slug:'a',title:'A',date:'2026-09-18',reader_html:'<h1>A</h1><img src="/missing.webp" alt="Diagram">'},{slug:'b',title:'B',date:'2026-09-17',reader_html:'<h1>B</h1>'}],defaults);
 const trigger=w.document.querySelector('a');trigger.focus();trigger.click();assert.equal(w.location.pathname,'/writing/a/');assert.equal(w.document.body.style.overflow,'hidden');assert.equal(w.document.querySelector('dialog').open,true);
 w.document.querySelector('.writing-reader img')?.dispatchEvent(new w.Event('error'));assert.match(w.document.querySelector('.writing-reader').textContent,/Image unavailable/);
 w.document.querySelector('.writing-back').click();assert.equal(w.location.pathname,'/writing/');assert.equal(w.document.querySelector('dialog').classList.contains('is-list'),true);w.document.querySelector('a[href="/writing/b/"]').click();assert.equal(w.location.pathname,'/writing/b/');
 w.history.back();await new Promise(r=>setTimeout(r,20));assert.equal(w.location.pathname,'/writing/');w.history.forward();await new Promise(r=>setTimeout(r,20));assert.equal(w.location.pathname,'/writing/b/');
 w.document.querySelector('.writing-close').click();await new Promise(r=>setTimeout(r,20));assert.equal(w.location.pathname,'/');assert.equal(w.document.body.style.overflow,'');assert.equal(w.document.activeElement,trigger);
 w.history.replaceState(null,'','/writing/a/');viewer.setData([{slug:'a',title:'A',date:'2026-09-18',reader_html:'<h1>A</h1>'}],defaults);assert.equal(w.document.querySelector('dialog').open,true);w.document.querySelector('.writing-back').click();assert.equal(w.location.pathname,'/writing/');w.document.querySelector('dialog').dispatchEvent(new w.Event('cancel',{cancelable:true}));assert.equal(w.location.pathname,'/');dom.window.close();
});
