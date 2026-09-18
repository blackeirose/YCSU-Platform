// Deterministic static allowlist. No repository/source/docs/full Registry exports.
import {cp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';
import {buildWriting} from './writing-content.mjs';
import {assertPublicRegistry} from '../assets/js/registry-public.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.resolve(root,process.argv.includes('--qa')?'dist-qa':'dist');
if(path.dirname(out)!==path.resolve(root)||!['dist','dist-qa'].includes(path.basename(out)))throw new Error('Unsafe output path');
assertPublicRegistry(JSON.parse(await readFile(path.join(root,'data/registry.public.snapshot.json'),'utf8')));
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const files=['index.html','assets/reorder.css','assets/writing.css','assets/vendor/supabase-2.116.0.js','assets/vendor/SUPABASE-LICENSE','data/registry.public.snapshot.json'];
for(const dir of ['assets/js','assets/previews'])for(const name of await readdir(path.join(root,dir))){
 if((dir==='assets/js'&&name.endsWith('.mjs'))||(dir==='assets/previews'&&name.endsWith('.webp')))files.push(`${dir}/${name}`);
}
for(const f of files){await mkdir(path.dirname(path.join(out,f)),{recursive:true});await cp(path.join(root,f),path.join(out,f));}
const template=(await readFile(path.join(root,'index.html'),'utf8')).replace('const PREVIEW_SLUGS = null;', 'const PREVIEW_SLUGS = '+JSON.stringify(files.filter(f=>f.startsWith('assets/previews/')).map(f=>path.basename(f,'.webp')))+';');
await writeFile(path.join(out,'index.html'),template);
const writingCount=await buildWriting({root:process.argv.includes('--qa')?path.join(root,'tests/fixtures'):root,out,template});
await writeFile(path.join(out,'_headers'),'/*\n  X-Frame-Options: DENY\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: no-store\n');
console.log(`Writing: ${writingCount} published articles. Public-only dist: ${files.length} files plus headers.`);
