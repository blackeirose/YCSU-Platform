import {readFile,readdir,mkdir,writeFile,cp,lstat} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as esc,safeUrl,validSlug} from '../assets/js/writing-model.mjs';
import {parseArticle,articleHtml} from '../assets/js/writing-content.mjs';
export {parseArticle,articleHtml,markdown} from '../assets/js/writing-content.mjs';
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
