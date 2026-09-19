import {defaults,readPresentation,mixedCards,writingCard,articleOrder,escapeHtml as esc} from './writing-model.mjs';
import {createWritingViewer,wireImages} from './writing-viewer.mjs';
import {articleEditor} from './writing-editor.mjs';
export function setupWriting({url,key,getOwner,onChange,onAvailability}){
 let articles=[],state={ok:true,settings:{...defaults},home_order:[]},revision=null,owner=false,generation=0,editorGeneration=0,manifestReady=false,manifestFailed=false,saving=false;
 const viewer=createWritingViewer({onNavigate:()=>{++editorGeneration}});
 const actions={edit:openArticle,feature:setFeatured,reorder:openOrder};
 const notify=()=>{if(manifestReady)viewer.setData(articles,state.settings);viewer.setActions(owner&&revision!==null&&!saving?actions:null);onChange();onAvailability(owner&&revision!==null&&!saving)};
 async function publicRequest(endpoint){const r=await fetch(`${url}/functions/v1/${endpoint}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({operation:'read-public'}),cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('Unavailable');return r.json()}
 const accept=data=>{if(data.schema!==1||!Array.isArray(data.articles))throw new Error('Invalid writing index');articles=data.articles;manifestReady=true;manifestFailed=false};
 async function loadArticles(){try{accept(await publicRequest('writing-content'))}catch{const r=await fetch('/data/writing.json',{cache:'no-store'});if(!r.ok)throw new Error('Unavailable');accept(await r.json())}}
 const loaded=Promise.all([loadArticles().catch(()=>{manifestFailed=true}),publicRequest('writing-ops').then(data=>{state=readPresentation(data)}).catch(()=>{})]).then(notify).catch(notify);
 async function loadOwner(){const current=generation;await loaded;if(!owner||!getOwner()||!manifestReady||current!==generation)return;
  try{const result=readPresentation(await getOwner().writingRequest({operation:'read-owner'}),true);if(!owner||current!==generation)return;revision=result.revision;state=readPresentation({ok:true,settings:result.settings,home_order:result.home_order});notify()}
  catch{if(current===generation){revision=null;notify()}}
 }
 async function save(operation,data){if(!owner||revision===null||saving)throw new Error('Owner settings unavailable');const current=generation;saving=true;
  try{const result=readPresentation(await getOwner().writingRequest({operation,revision,data}),true);if(!owner||current!==generation)throw new Error('Session changed');revision=result.revision;state=readPresentation({ok:true,settings:result.settings,home_order:result.home_order});return state}
  catch(error){if(current===generation)revision=null;throw error}finally{if(current===generation){saving=false;onAvailability(owner&&revision!==null)}}
 }
 const valid=(g,e)=>owner&&generation===g&&editorGeneration===e;
 function message(text){const node=document.createElement('div');node.className='article-edit-form';const p=document.createElement('p');p.setAttribute('role','status');p.textContent=text;const b=document.createElement('button');b.type='button';b.textContent='Back to article';b.onclick=()=>{++editorGeneration;viewer.refresh()};node.append(p,b);viewer.showEditor(node)}
 async function openArticle(slug){if(!owner||revision===null)return;const g=generation,e=++editorGeneration;message('Loading article…');
  try{const result=await getOwner().writingRequest({operation:'read-article',slug});if(!valid(g,e))return;
   if(!result.ok||!result.article||typeof result.revision!=='string')throw new Error('Invalid article');
   viewer.showEditor(articleEditor({article:result.article,assets:result.assets,isCurrent:()=>valid(g,e),cancel:()=>{++editorGeneration;viewer.refresh()},save:async(data,uploads)=>{
    const saved=await getOwner().writingRequest({operation:'save-article',slug,revision:result.revision,data,uploads});if(!valid(g,e))return;if(!saved.ok)throw new Error('Save failed');
    if(!saved.public_article||saved.public_article.slug!==slug||typeof saved.public_article.reader_html!=='string')throw new Error('Save readback missing');
    articles=articles.map(a=>a.slug===slug?saved.public_article:a);++editorGeneration;notify();
   }}));
  }catch{if(valid(g,e))message('Article editing is unavailable. Please try again later.')}
 }
 async function setFeatured(slug){if(!owner||revision===null)return;const g=generation,e=++editorGeneration;message('Saving MAIN cover…');try{await save('settings',{featured_slug:slug});if(owner&&generation===g)notify()}catch{if(valid(g,e))message('Could not confirm the save. Reload to check the MAIN cover.')}}
 function openOrder(){if(!owner||revision===null)return;const g=generation,e=++editorGeneration;const form=document.createElement('form');form.className='article-edit-form writing-order-form';const order=articleOrder(articles,state.settings).map(a=>a.slug),titles=new Map(articles.map(a=>[a.slug,a.title]));
  form.innerHTML='<h2>Reorder articles</h2><p>This changes the article index only.</p><ol class="article-order-editor"></ol><p role="status"></p><div class="editor-actions"><button type="submit">Save order</button><button type="button" data-cancel>Cancel</button></div>';
  const list=form.querySelector('ol'),draw=()=>{list.innerHTML=order.map((slug,i)=>`<li><span>${esc(titles.get(slug))}</span><button type="button" data-index="${i}" data-step="-1" aria-label="Move ${esc(titles.get(slug))} up"${i===0?' disabled':''}>↑</button><button type="button" data-index="${i}" data-step="1" aria-label="Move ${esc(titles.get(slug))} down"${i===order.length-1?' disabled':''}>↓</button></li>`).join('')||'<li>No published articles yet.</li>'};draw();
  list.onclick=event=>{const b=event.target.closest('button');if(!b||!valid(g,e))return;const from=+b.dataset.index,to=from+(+b.dataset.step);[order[from],order[to]]=[order[to],order[from]];draw()};
  form.querySelector('[data-cancel]').onclick=()=>{++editorGeneration;viewer.refresh()};form.onsubmit=async event=>{event.preventDefault();if(!valid(g,e))return;form.querySelectorAll('button').forEach(b=>b.disabled=true);form.querySelector('[role=status]').textContent='Saving…';try{await save('settings',{article_order:order});if(owner&&generation===g)notify()}catch{if(valid(g,e)){form.querySelector('[role=status]').textContent='Could not confirm the save. Reload to check the latest order.';form.querySelector('[data-cancel]').disabled=false}}};viewer.showEditor(form);
 }
 return {card:()=>manifestFailed?writingCard([],state.settings).replace('0 ARTICLES','UNAVAILABLE').replace('No published articles yet.','Writing could not load. Open to retry.'):writingCard(articles,state.settings),mix:products=>mixedCards(products,state.home_order),images:root=>wireImages(root.querySelector('.writing-card')||document.createElement('div')),
  setOwner(value){owner=!!value;++generation;++editorGeneration;saving=false;revision=null;viewer.setActions(null);onAvailability(false);if(owner)void loadOwner()},
  async saveOrder(payload){const next=payload.data.order;await save('home-order',next);return {ok:true,order:next.map((id,sortOrder)=>({id,sortOrder}))}},refresh(){if(owner)void loadOwner()},ready:loaded};
}
