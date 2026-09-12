import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {setupEmailOtp} from '../assets/js/email-otp.mjs';
import {setupOwnerAccess} from '../assets/js/owner-access.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tick=()=>new Promise(r=>setTimeout(r,15));
function fixture(){
 const dom=new JSDOM(html,{url:'https://main.example.invalid'}),w=dom.window,d=w.document;
 Object.assign(globalThis,{window:w,document:d,location:w.location,localStorage:w.localStorage});
 const dialog=d.getElementById('owner-dialog');
 dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new w.Event('close'));};
 const get=id=>d.getElementById(id);
 const submit=id=>get(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 return {dom,w,d,dialog,get,submit};
}
test('single mobile OTP field, request contract, leading-zero paste, cooldown and resend',async()=>{
 const f=fixture();let clock=0,sent=[],verified=[];
 const client={auth:{signInWithOtp:async input=>{sent.push(input);return {error:null}},verifyOtp:async input=>{verified.push(input);return {data:{session:{access_token:'fixture'}},error:null}}}};
 const otp=setupEmailOtp({dialog:f.dialog,loadClient:async()=>client,validateSession:async()=>{f.dialog.close();return 'owner'},now:()=>clock});
 try{
 otp.open();const code=f.get('owner-code');
 assert.equal(code.type,'text');assert.equal(code.inputMode,'numeric');assert.equal(code.autocomplete,'one-time-code');assert.equal(code.maxLength,6);
 f.get('owner-email').value='owner@example.invalid';f.submit('owner-form');f.submit('owner-form');await tick();
 assert.equal(sent.length,1);assert.deepEqual(sent[0],{email:'owner@example.invalid',options:{shouldCreateUser:false,emailRedirectTo:'https://main.example.invalid/'}});
 assert.equal(f.get('owner-form').hidden,true);assert.equal(f.get('owner-code-form').hidden,false);assert.equal(f.get('owner-resend').disabled,true);
 const paste=new f.w.Event('paste',{cancelable:true});Object.defineProperty(paste,'clipboardData',{value:{getData:()=> ' 012 345 '}});code.dispatchEvent(paste);assert.equal(code.value,'012345');
 clock=60000;await new Promise(r=>setTimeout(r,1050));assert.equal(f.get('owner-resend').disabled,false);f.get('owner-resend').click();await tick();assert.equal(sent.length,2);assert.equal(code.value,'');
 code.value='012345';f.submit('owner-code-form');await tick();assert.deepEqual(verified[0],{email:'owner@example.invalid',token:'012345',type:'email'});assert.equal(f.dialog.open,false);assert.equal(code.value,'');
 assert.equal(f.w.localStorage.length,0,'UI must not store OTP or ownership');
 }finally{otp.reset();f.dom.window.close();}
});
test('invalid, expired and used code, network, rate limit, and change-email paths stay recoverable',async()=>{
 const f=fixture();let sendError=null,verifyError=null,calls=0;
 const otp=setupEmailOtp({dialog:f.dialog,loadClient:async()=>({auth:{signInWithOtp:async()=>({error:sendError}),verifyOtp:async()=>{calls++;return {error:verifyError}}}}),validateSession:async()=>{throw Error('must not authorize failed OTP')}});
 try{
 otp.open();f.get('owner-email').value='not-email';f.submit('owner-form');await tick();assert.equal(f.get('owner-code-form').hidden,true);
 f.get('owner-email').value='owner@example.invalid';sendError=new Error('private provider error');f.submit('owner-form');await tick();assert.match(f.get('owner-message').textContent,/Could not send/);assert.doesNotMatch(f.get('owner-message').textContent,/private/);
 sendError=null;f.submit('owner-form');await tick();
 f.get('owner-code').value='123';f.submit('owner-code-form');await tick();assert.equal(calls,0);assert.match(f.get('owner-message').textContent,/6-digit/);
 for(const error of [{code:'otp_expired',status:403},{status:400},{status:403}]){
 verifyError=error;f.get('owner-code').value='123456';f.submit('owner-code-form');await tick();assert.match(f.get('owner-message').textContent,/Invalid or expired/);assert.equal(f.get('owner-verify').disabled,false);
 }
 verifyError=new Error('network');f.get('owner-code').value='123456';f.submit('owner-code-form');await tick();assert.match(f.get('owner-message').textContent,/connection/);
 verifyError={status:429};f.get('owner-code').value='123456';f.submit('owner-code-form');await tick();assert.match(f.get('owner-message').textContent,/Too many attempts/);
 f.get('owner-change-email').click();assert.equal(f.get('owner-form').hidden,false);assert.equal(f.get('owner-code').value,'');assert.equal(f.get('owner-send').disabled,true,'changing email cannot bypass resend cooldown');
 }finally{otp.reset();f.dom.window.close();}
});
test('closing pending request prevents stale UI and send rate limit has a cooldown',async()=>{
 const f=fixture();let resolveSend,error={status:429};
 const otp=setupEmailOtp({dialog:f.dialog,loadClient:async()=>({auth:{signInWithOtp:async()=>{if(error)return {error};return new Promise(r=>{resolveSend=r})}}}),validateSession:async()=> 'owner'});
 try{
 otp.open();f.get('owner-email').value='owner@example.invalid';f.submit('owner-form');await tick();assert.match(f.get('owner-message').textContent,/Too many requests/);assert.equal(f.get('owner-send').disabled,true);
 }finally{otp.reset();f.dom.window.close();}
 const g=fixture();const pending=setupEmailOtp({dialog:g.dialog,loadClient:async()=>({auth:{signInWithOtp:()=>new Promise(r=>{resolveSend=r})}}),validateSession:async()=> 'owner'});
 try{
 pending.open();g.get('owner-email').value='owner@example.invalid';g.submit('owner-form');await tick();g.dialog.close();resolveSend({error:null});await tick();assert.equal(g.dialog.open,false);assert.equal(g.get('owner-code-form').hidden,true);assert.equal(g.get('owner-email').value,'');
 }finally{pending.reset();g.dom.window.close();}
});
test('OTP establishes standard owner access, rejects non-owner, preserves logout and newer Auth events',async()=>{
 const f=fixture();let callback,active=null,allowed=false,owner=null,resolveVerify,delay=false,identity='owner',holdAuthorize=false,authResolvers=[];
 const oldFetch=globalThis.fetch;
 const auth={onAuthStateChange:fn=>{callback=fn},getSession:async()=>({data:{session:active}}),signOut:async()=>{active=null;callback('SIGNED_OUT',null);return {error:null}},signInWithOtp:async()=>({error:null}),verifyOtp:async()=>{
  const returned={access_token:identity};active=returned;callback('SIGNED_IN',returned);
  if(delay)await new Promise(r=>{resolveVerify=r});return {data:{session:returned},error:null};
 }};
 f.w.supabase={createClient:()=>({auth})};const append=f.d.head.append.bind(f.d.head);f.d.head.append=script=>{append(script);queueMicrotask(()=>script.onload());};
 globalThis.fetch=async(_url,options)=>{
  if(options.headers.Authorization!=='Bearer owner')return new Response('{}',{status:403});
  const {operation}=JSON.parse(options.body);
  if(operation==='authorize'&&holdAuthorize)await new Promise(r=>authResolvers.push(r));
  return Response.json(operation==='authorize'?{ok:true,canReadLinks:true,canReorder:true}:{ok:true,products:[{mainUrl:'https://owner.example.invalid'}]});
 };
 async function begin(){f.get('owner-access').click();await tick();f.get('owner-email').value='account@example.invalid';f.submit('owner-form');await tick();f.get('owner-code').value='012345';f.submit('owner-code-form');await tick();}
 try{
 await setupOwnerAccess({url:'https://backend.example.invalid',key:'public',setAllowed:v=>{allowed=v},isLive:()=>true,status:f.get('reorder-status'),onOwnerData:v=>{owner=v},onGuest:()=>{owner=null}});
 await begin();assert.equal(allowed,true);assert.ok(owner);assert.equal(f.dialog.open,false);
 f.get('owner-access').click();assert.equal(allowed,false);assert.equal(owner,null);await tick();
 // Reopen and advance the request cooldown by stubbing Date only around this flow.
 const realNow=Date.now;Date.now=()=>realNow()+61000;
 try{identity='other';await begin();assert.equal(allowed,false);assert.equal(owner,null);assert.match(f.get('owner-message').textContent,/does not have owner access/);f.dialog.close();f.get('owner-access').click();await tick();}finally{Date.now=realNow;}
 const realNow2=Date.now;Date.now=()=>realNow2()+122000;
 try{
 identity='owner';delay=true;holdAuthorize=true;await begin();assert.ok(resolveVerify);active=null;callback('SIGNED_OUT',null);assert.equal(owner,null);resolveVerify();await tick();authResolvers.splice(0).forEach(r=>r());await tick();assert.equal(owner,null);assert.equal(allowed,false,'late OTP completion cannot resurrect a signed-out identity');assert.match(f.get('owner-message').textContent,/state changed/);f.dialog.close();
 }finally{Date.now=realNow2;}
 const realNow3=Date.now;Date.now=()=>realNow3()+183000;
 try{await begin();active={access_token:'other'};callback('SIGNED_IN',active);resolveVerify();await tick();authResolvers.splice(0).forEach(r=>r());await tick();assert.equal(owner,null);assert.equal(allowed,false,'newer non-owner session must win over the old OTP response');assert.match(f.get('owner-message').textContent,/state changed/);}finally{Date.now=realNow3;}
 }finally{f.dialog.close();globalThis.fetch=oldFetch;f.dom.window.close();}
});
