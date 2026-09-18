import {defaults,readPresentation,validateSettings,escapeHtml as esc,mixedCards,writingCard} from './writing-model.mjs';
import {createWritingViewer,wireImages} from './writing-viewer.mjs';
export function setupWriting({url,key,getOwner,onChange,onAvailability}){
 let articles=[],state={ok:true,settings:{...defaults},home_order:[]},revision=null,owner=false,generation=0,manifestReady=false,manifestFailed=false,saving=false;
 const viewer=createWritingViewer(),button=document.createElement('button');button.type='button';button.className='owner-button';button.textContent='Writing settings';button.hidden=true;
 document.getElementById('reorder-toolbar').append(button);
 let editor=null;
 const notify=()=>{if(manifestReady)viewer.setData(articles,state.settings);onChange();onAvailability(owner&&revision!==null&&!saving)};
 async function requestPublic(){const r=await fetch(`${url}/functions/v1/writing-ops`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({operation:'read-public'}),cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Unavailable');return readPresentation(await r.json());}
 const loaded=Promise.all([
  fetch('/data/writing.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Unavailable');return r.json()}).then(data=>{if(data.schema!==1||!Array.isArray(data.articles))throw new Error('Invalid writing index');articles=data.articles;manifestReady=true}).catch(()=>{manifestFailed=true}),
  requestPublic().then(data=>{state=data}).catch(()=>{}),
 ]).then(()=>{notify()}).catch(()=>{notify()});
 async function loadOwner(){
  const current=generation;await loaded;if(!owner||!getOwner()||!manifestReady||current!==generation)return;
  try{const result=readPresentation(await getOwner().writingRequest({operation:'read-owner'}),true);if(!owner||current!==generation)return;
   revision=result.revision;state=readPresentation({ok:true,settings:result.settings,home_order:result.home_order});button.hidden=false;notify();
  }catch{if(current===generation){revision=null;button.hidden=true;notify()}}
 }
 async function save(operation,data){
  if(!owner||revision===null||saving)throw new Error('Owner settings unavailable');const current=generation;saving=true;
  try{
   const result=readPresentation(await getOwner().writingRequest({operation,revision,data}),true);
   if(!owner||current!==generation)throw new Error('Session changed');revision=result.revision;state=readPresentation({ok:true,settings:result.settings,home_order:result.home_order});return state;
  }catch(error){if(current===generation)revision=null;throw error;}
  finally{if(current===generation){saving=false;onAvailability(owner&&revision!==null)}}
 }
 function closeEditor(){if(editor){editor.close();editor.remove();editor=null}}
 function openEditor(){
  if(!owner||revision===null)return;closeEditor();const current=generation;
  editor=document.createElement('dialog');editor.className='writing-editor';editor.setAttribute('aria-labelledby','writing-settings-title');
  const textFields=[['title','Card title',120],['description','Short description',400],['excerpt','Homepage excerpt override',400],['cover','Cover image URL',2048],['video_url','Video URL',2048]];
  editor.innerHTML=`<form><h2 id="writing-settings-title">Writing settings</h2><p>These settings are public. Article text and images are published through Markdown.</p>${textFields.map(([k,label,max])=>`<label>${label}<input name="${k}" maxlength="${max}" value="${esc(state.settings[k])}"${k==='title'?' required':''}></label>`).join('')}
  <label>Featured article<select name="featured_slug"><option value="">Automatic · featured or latest</option>${articles.map(a=>`<option value="${a.slug}"${state.settings.featured_slug===a.slug?' selected':''}>${esc(a.title)}</option>`).join('')}</select></label>
  <fieldset><legend>Article order</legend><p>Use the arrows to set the index order. This does not change the featured article or homepage position.</p><ol class="article-order-editor"></ol></fieldset>
  <p>To move the Writing card on MAIN, close settings and choose Arrange cards.</p><p class="writing-save-status" role="status"></p><div class="editor-actions"><button type="submit">Save settings</button><button type="button" data-close>Cancel</button></div></form>`;
  document.body.append(editor);const form=editor.querySelector('form'),list=editor.querySelector('ol'),status=editor.querySelector('[role=status]');
  const order=mixedArticleOrder();
  const draw=()=>{list.innerHTML=order.map((slug,i)=>`<li><span>${esc(articles.find(a=>a.slug===slug).title)}</span><button type="button" data-index="${i}" data-step="-1" aria-label="Move ${esc(articles.find(a=>a.slug===slug).title)} up"${i===0?' disabled':''}>↑</button><button type="button" data-index="${i}" data-step="1" aria-label="Move ${esc(articles.find(a=>a.slug===slug).title)} down"${i===order.length-1?' disabled':''}>↓</button></li>`).join('')||'<li>No published articles yet.</li>'};draw();
  list.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const from=Number(b.dataset.index),to=from+Number(b.dataset.step);[order[from],order[to]]=[order[to],order[from]];draw();list.querySelectorAll('li')[to]?.querySelector('button:not(:disabled)')?.focus()});
  editor.querySelector('[data-close]').addEventListener('click',closeEditor);editor.addEventListener('cancel',e=>{e.preventDefault();closeEditor()});
  form.addEventListener('submit',async event=>{
   event.preventDefault();const patch=Object.fromEntries(new FormData(form));patch.article_order=order.slice();
   try{validateSettings(patch)}catch{status.textContent='Check the title and media URLs (HTTPS or /writing/slug/file).';return}
   form.querySelectorAll('button,input,select').forEach(e=>e.disabled=true);status.textContent='Saving…';
   try{await save('settings',patch);if(current!==generation)return;closeEditor();notify()}
   catch{if(current!==generation)return;status.textContent='Could not confirm the save. Reload to check the latest settings before trying again.';form.querySelector('[data-close]').disabled=false;}
  });editor.showModal();
 }
 function mixedArticleOrder(){const ranks=new Map(state.settings.article_order.map((s,i)=>[s,i]));return [...articles].sort((a,b)=>(ranks.get(a.slug)??Infinity)-(ranks.get(b.slug)??Infinity)||(a.display_order??Infinity)-(b.display_order??Infinity)||b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug)).map(a=>a.slug)}
 button.addEventListener('click',openEditor);
 return {
  card:()=>manifestFailed?writingCard([],state.settings).replace('0 ARTICLES','UNAVAILABLE').replace('No published articles yet.','Writing could not load. Open to retry.'):writingCard(articles,state.settings),mix:products=>mixedCards(products,state.home_order),images:root=>wireImages(root.querySelector('.writing-card')||document.createElement('div')),
  setOwner(value){owner=!!value;++generation;saving=false;revision=null;button.hidden=true;closeEditor();onAvailability(false);if(owner)void loadOwner()},
  async saveOrder(payload){const next=payload.data.order;await save('home-order',next);return {ok:true,order:next.map((id,sortOrder)=>({id,sortOrder}))}},
  refresh(){if(owner)void loadOwner()},ready:loaded,
 };
}
