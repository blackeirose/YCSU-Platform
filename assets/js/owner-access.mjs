import { setupEmailOtp } from './email-otp.mjs';
/** Existing Supabase owner session; no custom owner flag or Registry management secret. */
export async function setupOwnerAccess({url,key,setAllowed,isLive,status,onOwnerData=()=>{},onGuest=()=>{}}) {
 const dialog=document.getElementById('owner-dialog');
 const button=document.getElementById('owner-access'),toolbar=document.getElementById('reorder-toolbar'),message=document.getElementById('owner-message');
 let client,clientPromise,session=null,verified=false,revision=0,pending;
 function revoke(){
  ++revision;pending?.abort();pending=null;verified=false;setAllowed(false);toolbar.hidden=true;onGuest();
 }
 async function request(operation,token,signal){
  const r=await fetch(`${url}/functions/v1/registry-ops`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({operation}),cache:'no-store',signal});
  if(!r.ok){const error=new Error('Owner request denied');error.status=r.status;throw error;}return r.json();
 }
 async function validateSession(next){
  revoke();const current=revision;session=next;button.textContent=next?'Sign out':'Owner sign in';
  if(!next)return 'guest';
  const controller=new AbortController();pending=controller;
  try{
   const auth=await request('authorize',next.access_token,controller.signal);
   if(current!==revision||!auth.canReadLinks||!auth.canReorder)return;
   const data=await request('read-owner',next.access_token,controller.signal);
   if(current!==revision)return;
   if(!data.ok||!Array.isArray(data.products))throw new Error('Invalid owner data');
   verified=true;onOwnerData(data);toolbar.hidden=false;setAllowed(isLive());
   status.textContent='';
   if(dialog.open)dialog.close();
   return 'owner';
  }catch(error){
   if(current!==revision)return;
   verified=false;setAllowed(false);onGuest();toolbar.hidden=true;
   // Non-owners browse the same safe metadata as guests.
   return error.status===403?'non-owner':'unavailable';
  }
 }
 async function loadClient(){
  if(client)return client;if(clientPromise)return clientPromise;
  clientPromise=(async()=>{
   await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/assets/vendor/supabase-2.116.0.js';script.onload=resolve;script.onerror=reject;document.head.append(script);});
   client=window.supabase.createClient(url,key,{auth:{storageKey:'ycsu-main-owner-session',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
   client.auth.onAuthStateChange((_event,next)=>{
    // Clear privileged DOM synchronously, including cross-tab SIGNED_OUT.
    revoke();session=next;button.textContent=next?'Sign out':'Owner sign in';
    if(!next)return;
    // Do not await Auth SDK calls inside its callback.
    const scheduled=revision;setTimeout(()=>{if(scheduled===revision)void validateSession(next);},0);
   });return client;
  })();
  try{return await clientPromise;}catch(error){clientPromise=null;throw error;}
 }
 const otp=setupEmailOtp({dialog,loadClient,validateSession:next=>{
  // Auth events are authoritative: an old verification response must not
  // resurrect a session superseded by sign-out or another tab's identity.
  if(!next||session?.access_token!==next.access_token)return 'stale';
  return validateSession(next);
 }});
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   if(session){
    revoke();otp.reset();session=null;button.textContent='Owner sign in';
    const c=await loadClient();await c.auth.signOut({scope:'local'});
   }else{await loadClient();otp.open();}
  }catch{message.textContent='Sign-in could not load. Please try again.';dialog.showModal();}
  finally{button.disabled=false;}
 });
 let remembered=false;try{remembered=!!localStorage.getItem('ycsu-main-owner-session');}catch{}
 if(remembered||/(?:access_token|error_description)=/.test(location.hash)){
  try{const c=await loadClient();const initial=revision;const {data}=await c.auth.getSession();if(initial===revision)await validateSession(data.session);}catch{revoke();}
 }
 return {
  refreshAvailability(){setAllowed(verified&&isLive());},
  async writingRequest(payload){
   if(!verified||!client)throw new Error('Owner session required');
   if(!['read-owner','settings','home-order','read-article','save-article'].includes(payload.operation))throw new Error('Unsupported Writing operation');
   const current=revision;const {data,error}=await client.auth.getSession();
   if(current!==revision||!verified)throw new Error('Session changed');
   if(error||!data.session){revoke();throw new Error('Session expired');}
   const response=await fetch(url+'/functions/v1/'+(['read-article','save-article'].includes(payload.operation)?'writing-content':'writing-ops'),{method:'POST',headers:{apikey:key,Authorization:'Bearer '+data.session.access_token,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(current!==revision||!verified)throw new Error('Session changed');
   if(!response.ok){if(response.status===401||response.status===403)revoke();const error=new Error(response.status===409?'Changed elsewhere. Reload the article before saving.':'Writing save failed');error.status=response.status;throw error;}
   const result=await response.json();if(current!==revision||!verified)throw new Error('Session changed');return result;
  },
  async save(payload){
   if(!verified||!isLive()||!client)throw new Error('Owner session required');
   const {data,error}=await client.auth.getSession();
   if(error||!data.session){revoke();throw new Error('Session expired');}
   const current=revision;
   const response=await fetch(`${url}/functions/v1/registry-ops`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(current!==revision)throw new Error('Session changed');
   if(!response.ok){if(response.status===401||response.status===403)revoke();throw new Error('Save failed');}
   const result=await response.json();if(current!==revision||!verified)throw new Error('Session changed');if(!result.ok)throw new Error('Save failed');return result;
  },
 };
}
