import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
import {setupOwnerAccess} from '../assets/js/owner-access.mjs';import {setupWriting} from '../assets/js/writing.mjs';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),tick=()=>new Promise(r=>setTimeout(r,15));
function environment(url='https://main.example.invalid/'){
 const dom=new JSDOM(html,{url}),w=dom.window;Object.assign(globalThis,{window:w,document:w.document,location:w.location,history:w.history,localStorage:w.localStorage,FormData:w.FormData});w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.HTMLElement.prototype.scrollIntoView=function(){};return dom;
}
test('Writing owner requests reject stale sessions before sending and after JSON resolves',async()=>{
 const dom=environment(),w=dom.window,oldFetch=globalThis.fetch;let callback,delaySession=false,resolveSession,resolveBody,sent=0;
 const session={access_token:'fixture-owner'};w.localStorage.setItem('ycsu-main-owner-session','fixture');
 w.supabase={createClient:()=>({auth:{onAuthStateChange:fn=>{callback=fn},getSession:()=>delaySession?new Promise(r=>{resolveSession=()=>r({data:{session}})}):Promise.resolve({data:{session}}),signOut:async()=>({})}})};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=el=>{append(el);queueMicrotask(()=>el.onload())};
 globalThis.fetch=async(url,options)=>{if(url.endsWith('writing-ops')){sent++;return {ok:true,json:()=>new Promise(r=>{resolveBody=()=>r({ok:true,revision:1,settings:{},home_order:[]})})}}return Response.json(JSON.parse(options.body).operation==='authorize'?{ok:true,canReadLinks:true,canReorder:true}:{ok:true,products:[]})};
 try{
  const access=await setupOwnerAccess({url:'https://backend.example.invalid',key:'public',setAllowed(){},isLive:()=>true,status:w.document.getElementById('reorder-status')});
  delaySession=true;const request=access.writingRequest({operation:'read-owner'});callback('SIGNED_OUT',null);resolveSession();await assert.rejects(request,/Session changed/);assert.equal(sent,0);
  delaySession=false;callback('SIGNED_IN',session);await tick();const body=access.writingRequest({operation:'read-owner'});await tick();callback('SIGNED_OUT',null);resolveBody();await assert.rejects(body,/Session changed/);assert.equal(sent,1);
  await assert.rejects(access.writingRequest({operation:'read-owner'}),/Owner session required/);
 }finally{globalThis.fetch=oldFetch;dom.window.close()}
});
test('manifest failure retains static article, waits for public initialization and disables privileged editing',async()=>{
 const dom=environment('https://main.example.invalid/writing/article/'),w=dom.window,oldFetch=globalThis.fetch;let resolvePublic,ownerReads=0,changes=0;
 const staticArticle=w.document.createElement('main');staticArticle.id='writing-static';staticArticle.textContent='Canonical article body';w.document.body.prepend(staticArticle);
 globalThis.fetch=async url=>(url==='/data/writing.json'||url.endsWith('writing-content'))?new Response('',{status:503}):new Promise(r=>{resolvePublic=()=>r(Response.json({ok:true,settings:{},home_order:[]}))});
 try{
  const writing=setupWriting({url:'https://backend.example.invalid',key:'public',getOwner:()=>({writingRequest:async()=>{ownerReads++;return {}}}),onChange:()=>{changes++},onAvailability(){}});writing.setOwner(true);await tick();assert.equal(changes,0);resolvePublic();await writing.ready;
  assert.equal(w.document.getElementById('writing-static').textContent,'Canonical article body');assert.equal(w.document.querySelector('.writing-viewer').open,false);assert.match(writing.card(),/UNAVAILABLE/);assert.equal(ownerReads,0);
 }finally{globalThis.fetch=oldFetch;dom.window.close()}
});
test('logout removes Writing editor and delayed settings response cannot restore controls',async()=>{
 const dom=environment(),w=dom.window,oldFetch=globalThis.fetch;let resolveSave,allowed=false;
 const settings={ok:true,settings:{},home_order:[]};globalThis.fetch=async url=>Response.json((url==='/data/writing.json'||url.endsWith('writing-content'))?{schema:1,articles:[]}:settings);
 try{
  const writing=setupWriting({url:'https://backend.example.invalid',key:'public',getOwner:()=>({writingRequest:async payload=>payload.operation==='read-owner'?{...settings,revision:0}:new Promise(r=>{resolveSave=()=>r({...settings,revision:1})})}),onChange(){},onAvailability:v=>{allowed=v}});await writing.ready;writing.setOwner(true);await tick();assert.equal(allowed,true);
  w.history.replaceState(null,'','/writing/');w.dispatchEvent(new w.PopStateEvent('popstate'));[...w.document.querySelectorAll('button')].find(b=>b.textContent==='Reorder articles').click();assert.ok(w.document.querySelector('.writing-order-form'));
  w.document.querySelector('.writing-order-form').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();writing.setOwner(false);assert.equal(w.document.querySelector('.writing-order-form'),null);assert.equal(allowed,false);resolveSave();await tick();assert.equal(w.document.querySelector('.writing-order-form'),null);assert.equal(allowed,false);
 }finally{globalThis.fetch=oldFetch;dom.window.close()}
});
