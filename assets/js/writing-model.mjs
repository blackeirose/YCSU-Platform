export const WRITING_ID = 'writing';
export const defaults = Object.freeze({title:'YSU Journal',description:'Notes on architecture, technology, and making things.',excerpt:'',cover:'',video_url:'',featured_slug:'',article_order:[]});
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const validSlug = value => typeof value==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length<=100;
export function safeUrl(value,{media=false}={}) {
 if(typeof value!=='string'||!value||value.length>2048)return '';
 if(media && /^\/writing\/[a-z0-9-]+\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g|gif|avif|mp4|webm)$/.test(value))return value;
 try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}
}
export function validateSettings(patch) {
 if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new Error('Invalid settings');
 const result={};
 for(const [key,value] of Object.entries(patch)){
  if(!Object.hasOwn(defaults,key))throw new Error('Unknown setting');
  if(key==='article_order'){
   if(!Array.isArray(value)||value.length>500||value.some(v=>!validSlug(v))||new Set(value).size!==value.length)throw new Error('Invalid article order');
  }else{
   if(typeof value!=='string'||value.length>({title:120,description:400,excerpt:400,featured_slug:100}[key]||2048))throw new Error('Invalid setting value');
   if(key==='title'&&!value.trim())throw new Error('Title required');
   if(key==='featured_slug'&&value&&!validSlug(value))throw new Error('Invalid featured article');
   if(['cover','video_url'].includes(key)&&value&&!safeUrl(value,{media:true}))throw new Error('Invalid media URL');
  }
  result[key]=value;
 }
 return result;
}
export function validateHomeOrder(value){
 if(!Array.isArray(value)||value.length>500||new Set(value).size!==value.length||value.some(v=>typeof v!=='string'||!(/^[a-zA-Z0-9-]{1,100}$/).test(v)))throw new Error('Invalid home order');
 if(value.length&&!value.includes(WRITING_ID))throw new Error('Writing card required');return value;
}
export function presentation(row,owner=false){
 const result={ok:true,settings:{...defaults,...validateSettings(row.settings||{})},home_order:validateHomeOrder(row.home_order||[])};
 if(owner)result.revision=row.revision;return result;
}
export function readPresentation(data,owner=false){
 const keys=['ok','settings','home_order',...(owner?['revision']:[])];
 if(!data||data.ok!==true||Object.keys(data).some(k=>!keys.includes(k))||(owner&&!Number.isSafeInteger(data.revision)))throw new Error('Invalid presentation response');
 return presentation(data,owner);
}
export function articleOrder(articles,settings=defaults){
 const ranks=new Map((settings.article_order||[]).map((slug,i)=>[slug,i]));
 return [...articles].sort((a,b)=>(ranks.get(a.slug)??Infinity)-(ranks.get(b.slug)??Infinity)||(a.display_order??Infinity)-(b.display_order??Infinity)||b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
}
export function featuredArticle(articles,settings=defaults){
 return articles.find(a=>a.slug===settings.featured_slug)||[...articles].sort((a,b)=>Number(!!b.featured)-Number(!!a.featured)||b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug))[0]||null;
}
export function mixedCards(products,home=[]){
 const items=[...products,{id:WRITING_ID,name:defaults.title}],byId=new Map(items.map(p=>[p.id,p]));
 return [...new Set([...home,...items.map(p=>p.id)])].filter(id=>byId.has(id)).map((id,i)=>({...byId.get(id),sortOrder:i}));
}
export function writingCard(articles,settings=defaults){
 const article=featuredArticle(articles,settings),cover=safeUrl(settings.cover||article?.cover,{media:true});
 const title=article?.title||settings.title;
 const openLink=`<a class="writing-open" href="/writing/${article?escapeHtml(article.slug)+'/':''}" data-writing-link>${escapeHtml(title)}</a>`;
 return `<article class="card writing-card" data-product-id="writing"><div class="writing-card-content"><div class="card-tags"><span class="writing-label">WRITING</span><span class="writing-count">${articles.length} ${articles.length===1?'ARTICLE':'ARTICLES'}</span></div>
 <h2>${article?escapeHtml(settings.title):openLink}</h2>
 <div class="preview writing-cover">${cover?`<img data-writing-image="${escapeHtml(cover)}" alt="${escapeHtml((!settings.cover||settings.cover===article?.cover)?(article?.cover_alt?.trim()||title):title)}" width="1440" height="900" loading="lazy">`:''}<span class="writing-placeholder">${article?'YCSU · WRITING':'A space for ideas.'}</span></div>
 ${article?`<h3 class="writing-article-title">${openLink}</h3>`:''}
 <p class="writing-date">${article?escapeHtml([article.date,article.category].filter(Boolean).join(' · ')):'No published articles yet.'}</p>
 <p class="tagline writing-excerpt">${escapeHtml(article?(settings.excerpt||article.excerpt||settings.description):settings.description)}</p>
 <div class="writing-footer">${escapeHtml(settings.title)} <span aria-hidden="true">↗</span></div></div></article>`;
}
