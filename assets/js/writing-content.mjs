import {escapeHtml as esc,safeUrl,validSlug} from './writing-model.mjs';
const fields=new Set(['title','slug','date','category','cover','cover_alt','excerpt','linkedin_url','facebook_url','video_url','featured','display_order','tags']);
function scalar(raw){
 const v=raw.trim();if(v==='null'||v==='')return null;if(v==='true')return true;if(v==='false')return false;
 if(/^-?\d+$/.test(v))return Number(v);
 if(v.startsWith('"')){try{return JSON.parse(v)}catch{throw new Error('Malformed quoted field')}}
 if(v.startsWith("'")){if(!v.endsWith("'"))throw new Error('Malformed quoted field');return v.slice(1,-1).replace(/''/g,"'");}
 if(/^[\[\]{&*!>|]/.test(v))throw new Error('Only flat scalar frontmatter is supported');return v;
}
export function parseArticle(source,filename='article.md'){
 const match=source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
 if(!match)throw new Error(`${filename}: frontmatter required`);const meta={};
 let listKey=null;
 for(const line of match[1].split('\n')){
  if(/^  - /.test(line)){if(listKey!=='tags')throw new Error('Unexpected list');meta.tags.push(scalar(line.slice(4)));continue;}
  listKey=null;
  if(!line.trim()||line.trim().startsWith('#'))continue;
  const m=line.match(/^([a-z_]+):\s*(.*)$/);if(!m||!fields.has(m[1])||Object.hasOwn(meta,m[1]))throw new Error(`${filename}: invalid or duplicate field`);
  if(m[1]==='tags'&&!m[2].trim()){meta.tags=[];listKey='tags';}else meta[m[1]]=scalar(m[2]);
 }
 if(typeof meta.title!=='string'||!meta.title.trim()||meta.title.length>200||!validSlug(meta.slug)||['index','assets','data'].includes(meta.slug))throw new Error(`${filename}: invalid title/slug`);
 if(typeof meta.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)||new Date(meta.date).toISOString().slice(0,10)!==meta.date)throw new Error(`${filename}: invalid date`);
 for(const key of ['category','excerpt','cover_alt'])if(meta[key]!=null&&(typeof meta[key]!=='string'||meta[key].length>1000))throw new Error(`${filename}: invalid ${key}`);
 for(const key of ['cover','video_url','linkedin_url','facebook_url'])if(meta[key]!=null&&(typeof meta[key]!=='string'||!safeUrl(meta[key],{media:['cover','video_url'].includes(key)})))throw new Error(`${filename}: invalid ${key}`);
 if(meta.featured!=null&&typeof meta.featured!=='boolean')throw new Error(`${filename}: invalid featured`);
 if(meta.display_order!=null&&!Number.isSafeInteger(meta.display_order))throw new Error(`${filename}: invalid display_order`);
 if(meta.tags!=null&&(!Array.isArray(meta.tags)||meta.tags.length>30||meta.tags.some(t=>typeof t!=='string'||!t.trim()||t.length>80)||new Set(meta.tags).size!==meta.tags.length))throw new Error('Invalid tags');
 if(!match[2].trim())throw new Error(`${filename}: empty body`);
 return {...meta,featured:meta.featured||false,body:match[2],html:markdown(match[2])};
}
function inline(text){
 const tokens=[];const token=html=>`\u0000${tokens.push(html)-1}\u0000`;
 // Raw HTML is always text. Only these explicit forms can create elements.
 let s=text.replace(/`([^`]+)`/g,(_,v)=>token(`<code>${esc(v)}</code>`));
 s=s.replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g,(_,alt,url)=>{const href=safeUrl(url,{media:true});if(!alt.trim()||!href)throw new Error('Image requires alt text and a safe URL');return token(`<figure><img src="${esc(href)}" alt="${esc(alt)}" loading="lazy" decoding="async"><figcaption>${esc(alt)}</figcaption></figure>`)});
 s=s.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(_,label,url)=>{const href=safeUrl(url);if(!href)throw new Error('Link requires HTTPS');return token(`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`)});
 s=esc(s).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
 return s.replace(/\u0000(\d+)\u0000/g,(_,i)=>tokens[Number(i)]);
}
export function markdown(body){
 const lines=body.replace(/\r\n/g,'\n').split('\n');let output=[],paragraph=[],list=[],listType='',code=null;
 const flush=()=>{if(paragraph.length){output.push(`<p>${inline(paragraph.join(' '))}</p>`);paragraph=[];}if(list.length){output.push(`<${listType}>${list.map(v=>`<li>${inline(v)}</li>`).join('')}</${listType}>`);list=[];}};
 for(const line of lines){
  if(line.startsWith('```')){flush();if(code!==null){output.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);code=null;}else code=[];continue;}
  if(code!==null){code.push(line);continue;}
  if(!line.trim()){flush();continue;}
  const heading=line.match(/^(#{1,6})\s+(.+)$/),item=line.match(/^([-*]|\d+\.)\s+(.+)$/);
  if(heading){flush();const level=Math.max(2,Math.min(6,heading[1].length));output.push(`<h${level}>${inline(heading[2])}</h${level}>`);}
  else if(/^>\s?/.test(line)){flush();output.push(`<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`);}
  else if(item){const type=/\d/.test(item[1])?'ol':'ul';if(paragraph.length||listType!==type)flush();listType=type;list.push(item[2]);}
  else if(/^!\[/.test(line)){flush();output.push(inline(line));}
  else{if(list.length)flush();paragraph.push(line);}
 }
 if(code!==null)throw new Error('Unclosed code fence');flush();return output.join('\n');
}
export function articleHtml(article){
 const media=safeUrl(article.video_url,{media:true});
 return `<header class="article-header"><p class="writing-label">WRITING</p><h1>${esc(article.title)}</h1><p class="writing-date">${esc([article.date,article.category].filter(Boolean).join(' · '))}</p></header>
 ${article.cover?`<figure class="article-hero"><img src="${esc(article.cover)}" alt="${esc(article.cover_alt?.trim()||article.title)}" width="1440" height="900"><figcaption hidden>Cover</figcaption></figure>`:''}
 <div class="article-body">${article.html}</div>
 ${media?`<p><a href="${esc(media)}" target="_blank" rel="noopener noreferrer">Watch video ↗</a></p>`:''}
 <footer class="article-originals">${[['linkedin_url','Original on LinkedIn'],['facebook_url','Original on Facebook']].filter(([key])=>article[key]).map(([key,label])=>`<a href="${esc(article[key])}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</footer>`;
}

export function serializeArticle(article){
 const lines=[];for(const key of fields){if(article[key]===undefined)continue;if(key==='tags'&&Array.isArray(article.tags)){if(article.tags.length)lines.push('tags:',...article.tags.map(t=>'  - '+JSON.stringify(t)));continue;}lines.push(key+': '+JSON.stringify(article[key]));}
 const source='---\n'+lines.join('\n')+'\n---\n'+article.body;parseArticle(source);return source;
}
