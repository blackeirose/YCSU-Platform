import {articleOrder,featuredArticle,escapeHtml as esc} from './writing-model.mjs';
export function createWritingViewer({onNavigate=()=>{}}={}){
 let ready=false,articles=[],settings={},opener=null,oldOverflow='',lastRoute='',actions=null,observedRoute=location.pathname;
 const dialog=document.createElement('dialog');dialog.className='writing-viewer';dialog.id='writing-viewer';dialog.setAttribute('aria-label','Writing reader');
 dialog.innerHTML='<div class="writing-topbar"><a href="/writing/" data-writing-link class="writing-back">← Back to Articles</a><span>YCSU · WRITING</span><button type="button" class="writing-close" aria-label="Close Writing">Close <span aria-hidden="true">×</span></button></div><div class="writing-layout"><nav class="writing-index" aria-label="Articles"></nav><section class="writing-reader" tabindex="-1" aria-label="Article"></section></div>';
 document.body.append(dialog);
 const reader=dialog.querySelector('.writing-reader'),index=dialog.querySelector('.writing-index');
 function render(){
  if(!ready)return;
  if(observedRoute!==location.pathname){observedRoute=location.pathname;onNavigate();}
  const match=location.pathname.match(/^\/writing(?:\/([^/]+))?\/?$/);if(!match){close();return;}
  const article=articles.find(a=>a.slug===match[1]),coverSlug=featuredArticle(articles,settings)?.slug;
  index.innerHTML='<h2>Articles <span>'+articles.length+'</span></h2>'+(articles.length?articleOrder(articles,settings).map(a=>`<a href="/writing/${a.slug}/" data-writing-link${article?.slug===a.slug?' aria-current="page"':''}><strong>${esc(a.title)}</strong>${actions&&a.slug===coverSlug?'<span class="writing-main-cover">MAIN COVER</span>':''}<time datetime="${a.date}">${a.date}</time></a>`).join(''):'<p>No published articles yet.</p>');
  reader.innerHTML=article?article.reader_html:'<div class="writing-empty"><p class="writing-label">WRITING</p><h1>'+esc(settings.title||'Writing')+'</h1><p>'+(articles.length?'Select an article to start reading.':'No published articles yet.')+'</p></div>';
  dialog.classList.toggle('is-list',!article);dialog.querySelector('.writing-back').hidden=!article;
  document.title=article?`${article.title} — YCSU Writing`:'Writing — YCSU Platform';
  document.getElementById('writing-static')?.remove();
  if(!dialog.open){opener=document.activeElement;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}
  if(lastRoute!==location.pathname){reader.scrollTop=0;index.querySelector('[aria-current]')?.scrollIntoView({block:'nearest'});(article?reader:index.querySelector('a')||dialog.querySelector('.writing-close')).focus({preventScroll:true});lastRoute=location.pathname;}
  if(article&&settings.video_url&&featuredArticle(articles,settings)?.slug===article.slug){const p=document.createElement('p'),a=document.createElement('a');a.href=settings.video_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Watch featured video ↗';p.append(a);reader.append(p)}
  if(actions){const bar=document.createElement('div');bar.className='writing-article-actions';
   const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);bar.append(b);return b};
   if(article){add('Edit Article',()=>actions.edit(article.slug));const selected=article.slug===coverSlug;add(selected?'MAIN cover selected':'Set as MAIN cover',()=>actions.feature(article.slug)).disabled=selected;}
   add('Reorder articles',()=>actions.reorder());reader.prepend(bar);
   if(!article){index.append(bar);}
  }
  wireImages(reader);
 }
 function close(){
  if(!dialog.open)return;onNavigate();dialog.close();document.body.style.overflow=oldOverflow;lastRoute='';document.title='YCSU Platform — Product Registry';
  if(opener?.isConnected)opener.focus({preventScroll:true});else document.querySelector('[data-writing-link]')?.focus({preventScroll:true});
 }
 function navigate(url){
  const route=new URL(url,location.href);if(route.origin!==location.origin)return;
  if(route.pathname===location.pathname)return;
  const depth=location.pathname.startsWith('/writing')?(history.state?.writingDepth||0):0;
  history.pushState({writingDepth:depth+1,writingFromMain:!location.pathname.startsWith('/writing')||history.state?.writingFromMain===true},'',route.pathname);render();
 }
 function dismiss(){const depth=history.state?.writingDepth||0;if(depth>0&&history.state?.writingFromMain===true)history.go(-depth);else{history.replaceState(null,'','/');close();}}
 document.addEventListener('click',event=>{
  const a=event.target.closest?.('a[data-writing-link]');if(!ready||!a||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();navigate(a.href);
 });
 dialog.querySelector('.writing-close').addEventListener('click',dismiss);
 dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss()});
 dialog.addEventListener('click',event=>{if(event.target===dialog)dismiss()});
 window.addEventListener('popstate',render);
 return {setActions(next){actions=next;render()},showEditor(node){reader.replaceChildren(node);dialog.classList.remove("is-list");reader.scrollTop=0;node.querySelector("input,button,textarea")?.focus()},refresh:render,setData(next,nextSettings){ready=true;articles=next;settings=nextSettings;render()},open(){const a=featuredArticle(articles,settings);navigate('/writing/'+(a?a.slug+'/':''))}};
}
export function wireImages(root){
 root.querySelectorAll('img').forEach(img=>{
  const fail=()=>{const caption=document.createElement('span');caption.className='media-unavailable';caption.textContent='Image unavailable · '+img.alt;img.replaceWith(caption)};
  img.addEventListener('error',fail,{once:true});
  if(img.dataset.writingImage){img.addEventListener('load',()=>{img.parentElement.querySelector('.writing-placeholder')?.remove()},{once:true});img.src=img.dataset.writingImage;delete img.dataset.writingImage;}
  else if(img.complete&&img.naturalWidth===0)fail();
 });
}
