/** Existing Supabase owner session; no custom owner flag or Registry management secret. */
export async function setupOwnerAccess({url,key,setAllowed,isLive,status,onOwnerData=()=>{},onGuest=()=>{}}) {
 const dialog=document.getElementById('owner-dialog'),form=document.getElementById('owner-form');
 const button=document.getElementById('owner-access'),toolbar=document.getElementById('reorder-toolbar'),message=document.getElementById('owner-message');
 let client,clientPromise,session=null,verified=false,revision=0,pending;
 function revoke(){
  ++revision;pending?.abort();pending=null;verified=false;setAllowed(false);toolbar.hidden=true;onGuest();
 }
 async function request(operation,token,signal){
  const r=await fetch(`${url}/functions/v1/registry-ops`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({operation}),cache:'no-store',signal});
  if(!r.ok)throw new Error('Owner request denied');return r.json();
 }
 async function validateSession(next){
  revoke();const current=revision;session=next;button.textContent=next?'Sign out':'Owner sign in';
  if(!next)return;
  const controller=new AbortController();pending=controller;
  try{
   const auth=await request('authorize',next.access_token,controller.signal);
   if(current!==revision||!auth.canReadLinks||!auth.canReorder)return;
   const data=await request('read-owner',next.access_token,controller.signal);
   if(current!==revision)return;
   if(!data.ok||!Array.isArray(data.products))throw new Error('Invalid owner data');
   verified=true;onOwnerData(data);toolbar.hidden=false;setAllowed(isLive());
   status.textContent='Drag the grip with a mouse, or hold a non-link card area for half a second. On touch, hold the grip. Arrow keys also work.';
   if(dialog.open)dialog.close();
  }catch{
   if(current!==revision)return;
   verified=false;setAllowed(false);onGuest();toolbar.hidden=true;
   // Non-owners browse the same safe metadata as guests.
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
 button.addEventListener('click',async()=>{
  button.disabled=true;
  try{
   if(session){
    revoke();session=null;button.textContent='Owner sign in';
    const c=await loadClient();await c.auth.signOut({scope:'local'});
   }else{await loadClient();message.textContent='';dialog.showModal();}
  }catch{message.textContent='Sign-in could not load. Please try again.';dialog.showModal();}
  finally{button.disabled=false;}
 });
 document.getElementById('owner-close').addEventListener('click',()=>dialog.close());
 form.addEventListener('submit',async event=>{
  event.preventDefault();const submit=form.querySelector('[type=submit]');submit.disabled=true;
  try{const c=await loadClient();const {error}=await c.auth.signInWithOtp({email:document.getElementById('owner-email').value.trim(),options:{shouldCreateUser:false,emailRedirectTo:location.origin+'/'}});if(error)throw error;message.textContent='Check your email for a sign-in link. Open it to return here and enable owner links and reordering.';}
  catch{message.textContent='Unable to send a sign-in link. Check your email address or try again later.';}
  finally{submit.disabled=false;}
 });
 let remembered=false;try{remembered=!!localStorage.getItem('ycsu-main-owner-session');}catch{}
 if(remembered||/(?:access_token|error_description)=/.test(location.hash)){
  try{const c=await loadClient();const initial=revision;const {data}=await c.auth.getSession();if(initial===revision)await validateSession(data.session);}catch{revoke();}
 }
 return {
  refreshAvailability(){setAllowed(verified&&isLive());},
  async save(payload){
   if(!verified||!isLive()||!client)throw new Error('Owner session required');
   const {data,error}=await client.auth.getSession();
   if(error||!data.session){revoke();throw new Error('Session expired');}
   const current=revision;
   const response=await fetch(`${url}/functions/v1/registry-ops`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store',signal:AbortSignal.timeout(15000)});
   if(current!==revision)throw new Error('Session changed');
   if(!response.ok){if(response.status===401||response.status===403)revoke();throw new Error('Save failed');}
   const result=await response.json();if(!result.ok)throw new Error('Save failed');return result;
  },
 };
}
