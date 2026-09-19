import {escapeHtml as esc,safeUrl} from './writing-model.mjs';
import {markdown,bodySize,BODY_SIZES} from './writing-content.mjs';
import {formatSelection} from './writing-format.mjs';
export const editableFields=['title','date','category','excerpt','body','cover','cover_alt','video_url','linkedin_url','facebook_url','body_font_size'];
export function imageReferences(body){return [...body.matchAll(/!\[([^\]]*)\]\(([^\s)]+)\)/g)].map(m=>({alt:m[1],url:m[2],literal:m[0]}));}
export function replaceInline(body,oldUrl,newUrl){if(!safeUrl(newUrl,{media:true}))throw new Error('Use HTTPS or an article image');return body.replace(/(!\[[^\]]*\]\()([^\s)]+)(\))/g,(all,a,url,b)=>url===oldUrl?a+newUrl+b:all);}
export function articleEditor({article,assets=[],save,cancel,isCurrent}){
 const root=document.createElement('form');root.className='article-edit-form';root.setAttribute('aria-label','Edit Article');
 const input=(key,label,type='text')=>`<label>${label}<input name="${key}" type="${type}" value="${esc(article[key]||'')}"${key==='title'||key==='date'?' required':''}></label>`;
 root.innerHTML=`<h2>Edit Article</h2><p>Changes are saved to the published article. Review the preview before saving.</p>${input('title','Title')}${input('date','Date','date')}${input('category','Category')}<label>Excerpt<textarea name="excerpt" rows="3">${esc(article.excerpt||'')}</textarea></label><div class="format-toolbar" role="group" aria-label="Body formatting">${[['bold','B','Bold'],['italic','I','Italic'],['h2','H2','Heading'],['h3','H3','Subheading'],['quote','Quote','Quote'],['link','Link','Link']].map(([action,label,title])=>`<button type="button" data-format="${action}" aria-label="${title}" title="${title}">${label}</button>`).join('')}<label class="body-size-control">Text size<select name="body_font_size" aria-label="Article body text size">${BODY_SIZES.map(size=>`<option value="${size}"${size===bodySize(article.body_font_size)?' selected':''}>${size}px</option>`).join('')}</select></label></div><div data-link-panel hidden><label>Link URL<input type="url" data-link-url placeholder="https://..."></label><button type="button" data-link-apply>Apply link</button><button type="button" data-link-cancel>Cancel link</button></div><label>Body · Markdown<textarea name="body" rows="16" required>${esc(article.body)}</textarea></label><details open><summary>Preview article body</summary><div class="article-body edit-preview"></div></details><fieldset><legend>Cover image</legend>${input('cover','Cover image URL')}${input('cover_alt','Cover description')}<label>Choose an existing image<select data-cover-asset><option value="">Choose image…</option>${assets.filter(x=>/\.(webp|png|jpe?g|gif|avif)$/i.test(x)).map(x=>`<option value="${esc(x)}">${esc(x.split('/').at(-1))}</option>`).join('')}</select></label><label>Replace cover image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-cover-upload></label></fieldset><fieldset><legend>Inline images</legend><div data-inline></div></fieldset>${input('video_url','Video URL')}${input('linkedin_url','Original LinkedIn URL')}${input('facebook_url','Facebook URL')}<p role="status"></p><div class="editor-actions"><button type="submit">Save article</button><button type="button" data-cancel>Cancel</button></div>`;
 const status=root.querySelector('[role=status]'),body=root.elements.namedItem('body'),uploads=new Map();let busy=false;
 const size=root.elements.namedItem('body_font_size');
 const preview=()=>{root.querySelector('.edit-preview').dataset.bodySize=String(bodySize(Number(size.value)));try{root.querySelector('.edit-preview').innerHTML=markdown(body.value)}catch{root.querySelector('.edit-preview').textContent='Check Markdown image/link URLs and code fences.'}};
 preview();body.addEventListener('input',preview);size.addEventListener('change',preview);
 let selection={start:0,end:0};
 const remember=()=>{selection={start:body.selectionStart,end:body.selectionEnd}};
 for(const event of ['select','keyup','pointerup','blur'])body.addEventListener(event,remember);
 const apply=(action,url='')=>{if(busy||!isCurrent())return;try{const next=formatSelection(body.value,selection.start,selection.end,action,url);body.value=next.text;body.focus();body.setSelectionRange(next.start,next.end);remember();preview();drawInline();status.textContent='';return true}catch(error){status.textContent=error.message;return false}};
 for(const button of root.querySelectorAll('[data-format]')){button.addEventListener('pointerdown',()=>{if(document.activeElement===body)remember()});button.addEventListener('click',()=>{if(busy||!isCurrent())return;if(button.dataset.format==='link'){root.querySelector('[data-link-panel]').hidden=false;root.querySelector('[data-link-url]').focus()}else apply(button.dataset.format)})}
 root.querySelector('[data-link-apply]').addEventListener('click',()=>{if(apply('link',root.querySelector('[data-link-url]').value.trim()))root.querySelector('[data-link-panel]').hidden=true});
 root.querySelector('[data-link-cancel]').addEventListener('click',()=>{root.querySelector('[data-link-panel]').hidden=true;body.focus();body.setSelectionRange(selection.start,selection.end)});
 body.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&['b','i'].includes(event.key.toLowerCase())){event.preventDefault();remember();apply(event.key.toLowerCase()==='b'?'bold':'italic')}});
 const assetSelect=root.querySelector('[data-cover-asset]');assetSelect.addEventListener('change',()=>{if(assetSelect.value)root.elements.namedItem('cover').value=assetSelect.value});
 async function upload(file){
  if(!file||file.size>4*1024*1024)throw new Error('Choose an image up to 4 MB.');
  const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[file.type];if(!ext)throw new Error('Use PNG, JPEG, WebP or GIF.');
  const bytes=new Uint8Array(await file.arrayBuffer());if(!isCurrent())throw new Error('Session changed');
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  const name='replacement-'+crypto.randomUUID().replaceAll('-','')+'.'+ext;
  uploads.set(name,{name,base64:btoa(binary)});return `/writing/${article.slug}/${name}`;
 }
 function fileControl(el,apply){el.addEventListener('change',async()=>{if(busy||!isCurrent())return;busy=true;root.querySelector('[type=submit]').disabled=true;try{const url=await upload(el.files?.[0]);if(isCurrent()){apply(url);status.textContent='Image ready. Save article to apply.'}}catch(e){if(isCurrent())status.textContent=e.message}finally{busy=false;if(isCurrent())root.querySelector('[type=submit]').disabled=false}})}
 fileControl(root.querySelector('[data-cover-upload]'),url=>root.elements.namedItem('cover').value=url);
 const inlineRoot=root.querySelector('[data-inline]');
 function drawInline(){inlineRoot.replaceChildren();const refs=imageReferences(body.value);if(!refs.length){inlineRoot.textContent='No inline images in this article.';return}
  for(const ref of refs){const row=document.createElement('div');row.innerHTML=`<label>${esc(ref.alt||'Inline image')} URL<input type="text" value="${esc(ref.url)}"></label><label>Replace ${esc(ref.alt||'inline image')}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>`;
   const change=url=>{body.value=replaceInline(body.value,ref.url,url);ref.url=url;row.querySelector('[type=text]').value=url;preview()};
   row.querySelector('[type=text]').addEventListener('change',e=>{try{change(e.target.value);status.textContent=''}catch(err){status.textContent=err.message}});fileControl(row.querySelector('[type=file]'),change);inlineRoot.append(row);
  }
 }
 drawInline();body.addEventListener('change',drawInline);root.querySelector('[data-cancel]').addEventListener('click',cancel);
 root.addEventListener('submit',async e=>{e.preventDefault();if(busy||!isCurrent())return;const data={};for(const key of editableFields)data[key]=key==='body_font_size'?Number(root.elements.namedItem(key).value):root.elements.namedItem(key).value;
  for(const key of ['cover','video_url','linkedin_url','facebook_url'])if(data[key]&&!safeUrl(data[key],{media:['cover','video_url'].includes(key)})){status.textContent='Check the image and link URLs.';return}
  try{markdown(data.body)}catch{status.textContent='Check Markdown image/link URLs and code fences.';return}
  const activeUploads=[...uploads.values()].filter(u=>data.cover===`/writing/${article.slug}/${u.name}`||data.body.includes(`/writing/${article.slug}/${u.name}`));
  if(activeUploads.length>4){status.textContent='Replace up to four images in one save.';return}
  if(activeUploads.reduce((n,u)=>n+u.base64.length,0)>8000000){status.textContent='Images are too large for one save. Use smaller files.';return}
  busy=true;root.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=true);status.textContent='Saving…';
  try{await save(data,activeUploads)}catch(err){if(!isCurrent())return;status.textContent=err.status===409?'Changed elsewhere. Cancel and reopen the article before saving.':'Could not confirm the save. Cancel and reopen to check the latest article before trying again.';root.querySelector('[data-cancel]').disabled=false}
 });return root;
}
