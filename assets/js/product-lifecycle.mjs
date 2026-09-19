import {lifecycleState} from './registry-public.mjs';
import {escapeHtml as esc} from './writing-model.mjs';
export function unavailableCard(p){return `<article class="card product-card unavailable-card" data-product-id="${esc(p.id)}"><div class="preview"><div class="preview-placeholder">UNAVAILABLE</div></div><h2>${esc(p.name)}</h2></article>`;}
export function productActions(p){return `<details class="product-actions"><summary aria-label="Manage ${esc(p.name)}">Manage</summary><div>${(lifecycleState(p)==='hidden'?[['show','Show to guests']]:[['hide','Hide from guests']]).concat([['archive','Archive'],['delete','Delete']]).map(([action,label])=>`<button type="button" data-lifecycle="${action}" data-id="${esc(p.id)}">${label}</button>`).join('')}</div></details>`;}
export function recoverySections(products){return ['archived','deleted'].map(state=>{const items=products.filter(p=>lifecycleState(p)===state);return `<details class="product-recovery"><summary>${state==='archived'?'Archived':'Deleted Items'} (${items.length})</summary><ul>${items.map(p=>`<li><span>${esc(p.name)}${p.deletedAt?`<small>${esc(p.deletedAt.slice(0,10))}</small>`:''}</span><button type="button" data-lifecycle="restore" data-id="${esc(p.id)}">Restore</button>${state==='archived'?`<button type="button" data-lifecycle="delete" data-id="${esc(p.id)}">Delete</button>`:''}</li>`).join('')||'<li>No products.</li>'}</ul></details>`}).join('');}
export function setupProductLifecycle({root,getOwner,getProducts,onSaved,onBusy}){
 let generation=0,busy=false,owner=false;
 const dialog=document.createElement('dialog');dialog.className='product-delete-dialog';dialog.innerHTML='<form method="dialog"><h2>Delete product?</h2><p></p><div><button value="cancel">Cancel</button><button value="delete">Delete</button></div></form>';document.body.append(dialog);
 function confirmDelete(p){return new Promise(resolve=>{dialog.querySelector('p').textContent=`${p.name} will move to Deleted Items. You can restore it later.`;dialog.returnValue='cancel';dialog.addEventListener('close',()=>resolve(dialog.returnValue==='delete'),{once:true});dialog.showModal();dialog.querySelector('[value=cancel]').focus()})}
 const status=document.getElementById('lifecycle-status');
 root.addEventListener('click',async event=>{const button=event.target.closest('button[data-lifecycle]');if(!button||!owner||busy)return;
  const p=getProducts().find(p=>p.id===button.dataset.id);if(!p)return;const g=generation,action=button.dataset.lifecycle;
  if(action==='delete'&&!await confirmDelete(p))return;
  if(!owner||g!==generation||busy)return;
  busy=true;onBusy(true);root.querySelectorAll('[data-lifecycle]').forEach(b=>b.disabled=true);status.textContent='Saving product state…';
  try{const result=await getOwner().save({operation:'lifecycle',data:{id:p.id,revision:p.lifecycleRevision,action,...(action==='delete'?{confirm:true}:{})}});
   if(g!==generation||!owner)return;
   if(!result.ok||result.products?.length!==1)throw new Error('Invalid state response');
   onSaved(result.products[0]);status.textContent='Product state saved.';
  }catch{if(g===generation&&owner)status.textContent='Could not confirm the change. Reload to check the current state before trying again.';}
  finally{if(g===generation){busy=false;onBusy(false);root.querySelectorAll('[data-lifecycle]').forEach(b=>b.disabled=false);}}
 });
 return {setOwner(value){owner=!!value;++generation;busy=false;onBusy(false);status.textContent='';if(dialog.open)dialog.close('cancel');dialog.querySelector('p').textContent='';dialog.returnValue='cancel';}};
}
