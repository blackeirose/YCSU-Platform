import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {setupOwnerAccess} from '../assets/js/owner-access.mjs';
const tick=()=>new Promise(r=>setTimeout(r,10));
test('owner hydration, immediate logout, stale full-read rejection and cross-tab sign-out',async()=>{
 const dom=new JSDOM(`<button id="owner-access"></button><div id="reorder-toolbar"><span id="status"></span></div><dialog id="owner-dialog"><form id="owner-form"><input id="owner-email"><button type="submit"></button></form><button id="owner-close"></button><p id="owner-message"></p></dialog>`,{url:'https://main.example.invalid'});
 const w=dom.window;Object.assign(globalThis,{window:w,document:w.document,location:w.location,localStorage:w.localStorage});
 w.localStorage.setItem('ycsu-main-owner-session','standard SDK session fixture');
 let callback,ownerData=null,allowed=false,delayRead=false,resolveRead,signoutStarted=false,resolveSignout,config;
 const session={access_token:'test-owner-session'};
 w.supabase={createClient:(_url,_key,options)=>{config=options;return {auth:{onAuthStateChange:fn=>{callback=fn},getSession:async()=>({data:{session}}),signOut:()=>{signoutStarted=true;return new Promise(r=>{resolveSignout=r})}}}}};
 const append=w.document.head.append.bind(w.document.head);w.document.head.append=script=>{append(script);queueMicrotask(()=>script.onload());};
 const oldFetch=globalThis.fetch;globalThis.fetch=async(_url,options)=>{
 const {operation}=JSON.parse(options.body);assert.equal(options.cache,'no-store');
 if(options.headers.Authorization==='Bearer other')return new Response('{}',{status:403});
 if(operation==='authorize')return Response.json({ok:true,canReadLinks:true,canReorder:true});
 const answer=()=>Response.json({ok:true,products:[{mainUrl:'https://protected.example.invalid'}]});
 if(delayRead)return new Promise(r=>{resolveRead=()=>r(answer())});return answer();
 };
 try{
 await setupOwnerAccess({url:'https://backend.example.invalid',key:'public-key',setAllowed:v=>{allowed=v},isLive:()=>true,status:w.document.getElementById('status'),onOwnerData:d=>{ownerData=d},onGuest:()=>{ownerData=null}});
 assert.ok(ownerData);assert.equal(allowed,true);assert.equal(config.auth.persistSession,true);assert.equal(config.auth.storageKey,'ycsu-main-owner-session');
 delayRead=true;callback('TOKEN_REFRESHED',session);await tick();assert.equal(ownerData,null);
 w.document.getElementById('owner-access').click();assert.equal(ownerData,null);assert.equal(allowed,false);
 await tick();assert.equal(signoutStarted,true);resolveRead();await tick();assert.equal(ownerData,null,'a late full-read cannot restore protected data');resolveSignout();await tick();
 delayRead=false;callback('SIGNED_IN',session);await tick();assert.ok(ownerData);
 callback('TOKEN_REFRESHED',session);callback('SIGNED_IN',{access_token:'other'});await tick();assert.equal(ownerData,null,'newest identity must win');assert.equal(allowed,false);
 callback('TOKEN_REFRESHED',{access_token:'old-owner'});callback('TOKEN_REFRESHED',session);await tick();assert.ok(ownerData,'latest owner token can restore access');
 callback('SIGNED_OUT',null);assert.equal(ownerData,null);assert.equal(allowed,false);
 }finally{globalThis.fetch=oldFetch;dom.window.close();}
});
