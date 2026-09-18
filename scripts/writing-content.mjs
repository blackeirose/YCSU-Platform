import {readFile,readdir,mkdir,writeFile,cp,lstat} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as esc,safeUrl,validSlug} from '../assets/js/writing-model.mjs';
const fields=new Set(['title','slug','date','category','cover','excerpt','linkedin_url','facebook_url','video_url','featured','display_order']);
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
 for(const line of match[1].split('\n')){
  if(!line.trim()||line.trim().startsWith('#'))continue;
  const m=line.match(/^([a-z_]+):\s*(.*)$/);if(!m||!fields.has(m[1])||Object.hasOwn(meta,m[1]))throw new Error(`${filename}: invalid or duplicate field`);
  meta[m[1]]=scalar(m[2]);
 }
 if(typeof meta.title!=='string'||!meta.title.trim()||meta.title.length>200||!validSlug(meta.slug)||['index','assets','data'].includes(meta.slug))throw new Error(`${filename}: invalid title/slug`);
 if(typeof meta.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)||new Date(meta.date).toISOString().slice(0,10)!==meta.date)throw new Error(`${filename}: invalid date`);
 for(const key of ['category','excerpt'])if(meta[key]!=null&&(typeof meta[key]!=='string'||meta[key].length>1000))throw new Error(`${filename}: invalid ${key}`);
 for(const key of ['cover','video_url','linkedin_url','facebook_url'])if(meta[key]!=null&&(typeof meta[key]!=='string'||!safeUrl(meta[key],{media:['cover','video_url'].includes(key)})))throw new Error(`${filename}: invalid ${key}`);
 if(meta.featured!=null&&typeof meta.featured!=='boolean')throw new Error(`${filename}: invalid featured`);
 if(meta.display_order!=null&&!Number.isSafeInteger(meta.display_order))throw new Error(`${filename}: invalid display_order`);
 if(!match[2].trim())throw new Error(`${filename}: empty body`);
 return {...meta,featured:meta.featured||false,html:markdown(match[2])};
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
 ${article.cover?`<figure class="article-hero"><img src="${esc(article.cover)}" alt="${esc(article.title)}" width="1440" height="900"><figcaption hidden>Cover</figcaption></figure>`:''}
 <div class="article-body">${article.html}</div>
 ${media?`<p><a href="${esc(media)}" target="_blank" rel="noopener noreferrer">Watch video ↗</a></p>`:''}
 <footer class="article-originals">${[['linkedin_url','Original on LinkedIn'],['facebook_url','Original on Facebook']].filter(([key])=>article[key]).map(([key,label])=>`<a href="${esc(article[key])}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</footer>`;
}
export async function buildWriting({root,out,template,sourceDir=path.join(root,'content/writing')}){
 let names=[];try{names=await readdir(sourceDir)}catch(error){if(error.code!=='ENOENT')throw error;}
 const articles=[];
 for(const name of names.filter(n=>n.endsWith('.md')).sort()){
  if((await lstat(path.join(sourceDir,name))).isSymbolicLink())throw new Error('Symlinks forbidden');
  articles.push(parseArticle(await readFile(path.join(sourceDir,name),'utf8'),name));
 }
 if(new Set(articles.map(a=>a.slug)).size!==articles.length)throw new Error('Duplicate article slug');
 for(const article of articles){
  const mediaDir=path.join(root,'public/writing',article.slug);let media=[];try{media=await readdir(mediaDir)}catch(e){if(e.code!=='ENOENT')throw e;}
  for(const name of media){
   if(!/^[a-zA-Z0-9_-]+\.(webp|png|jpe?g|gif|avif|mp4|webm)$/.test(name))throw new Error('Unsupported media file');
   const stat=await lstat(path.join(mediaDir,name));if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Only media files allowed');
   await mkdir(path.join(out,'writing',article.slug),{recursive:true});await cp(path.join(mediaDir,name),path.join(out,'writing',article.slug,name));
  }
  const locals=[article.cover,article.video_url,...[...article.html.matchAll(/src="([^"]+)"/g)].map(m=>m[1])].filter(v=>v?.startsWith('/writing/'));
  for(const url of locals)if(!url.startsWith(`/writing/${article.slug}/`)||!media.includes(url.split('/').at(-1)))throw new Error(`Missing article media: ${url}`);
 }
 const manifest={schema:1,articles:articles.map(a=>({...a,reader_html:articleHtml(a)}))};
 await mkdir(path.join(out,'data'),{recursive:true});await writeFile(path.join(out,'data/writing.json'),JSON.stringify(manifest));
 for(const article of [null,...articles]){
  const route=article?`/writing/${article.slug}/`:'/writing/';const title=article?`${article.title} — YCSU Writing`:'Writing — YCSU Platform';
  const description=article?.excerpt||'Writing by YuCheng Su.';
  const metadata=`<link rel="canonical" href="https://main.ycsu.cc${route}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://main.ycsu.cc${route}">${article?.cover?`<meta property="og:image" content="${esc(new URL(article.cover,'https://main.ycsu.cc').href)}">`:''}`;
  const content=article?articleHtml(article):`<h1>Writing</h1>${articles.length?`<ul>${articles.map(a=>`<li><a href="/writing/${a.slug}/">${esc(a.title)}</a> · ${a.date}</li>`).join('')}</ul>`:'<p>No published articles yet.</p>'}`;
  const staticReader=`<main id="writing-static" class="writing-static"><a href="/">← Back to MAIN</a>${content}</main>`;
  const html=template.replace(/<title>.*?<\/title>/,`<title>${esc(title)}</title>`).replace(/<meta name="description"[^>]*\/>/,`<meta name="description" content="${esc(description)}">`).replace('</head>',metadata+'</head>').replace('<body>','<body>'+staticReader);
  await mkdir(path.join(out,route),{recursive:true});await writeFile(path.join(out,route,'index.html'),html);
 }
 return articles.length;
}
