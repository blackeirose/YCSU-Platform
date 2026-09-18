import {createHash} from 'node:crypto';

/** In-memory GitHub Git Database API. Never performs network or filesystem writes. */
export function createWritingGithubFixture({articles={},media={},extraFiles={},onRequest}={}){
 const base='https://api.github.com/repos/blackeirose/YCSU-Platform',blobs=new Map(),trees=new Map(),commits=new Map(),calls=[];
 const sha=value=>createHash('sha1').update(value).digest('hex');
 function blob(content){const bytes=Buffer.isBuffer(content)?content:Buffer.from(content);const id=sha(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes]));blobs.set(id,bytes);return id;}
 function tree(files){
  const nodes=new Map();for(const [filename,blobSHA] of files){const slash=filename.indexOf('/');if(slash<0)nodes.set(filename,{path:filename,mode:'100644',type:'blob',sha:blobSHA,size:blobs.get(blobSHA).length});else{const dir=filename.slice(0,slash);if(!nodes.has(dir))nodes.set(dir,new Map());nodes.get(dir).set(filename.slice(slash+1),blobSHA);}}
  const entries=[...nodes.entries()].map(([name,value])=>value instanceof Map?{path:name,mode:'040000',type:'tree',sha:tree(value)}:value).sort((a,b)=>a.path.localeCompare(b.path));
  const id=sha(JSON.stringify(entries));trees.set(id,entries);return id;
 }
 function flatten(id,prefix=''){const files=new Map();for(const entry of trees.get(id)||[]){if(entry.type==='tree'){for(const [p,s] of flatten(entry.sha,prefix+entry.path+'/'))files.set(p,s);}else files.set(prefix+entry.path,entry.sha);}return files;}
 let sequence=0;
 function commit(treeSHA,parents=[],message='fixture'){const id=sha(JSON.stringify({treeSHA,parents,message,sequence:sequence++}));commits.set(id,{sha:id,tree:{sha:treeSHA},parents:parents.map(sha=>({sha}))});return id;}
 const files=new Map();for(const [slug,source] of Object.entries(articles))files.set(`content/writing/${slug}.md`,blob(source));for(const [filename,content] of Object.entries({...media,...extraFiles}))files.set(filename,blob(content));
 let current=commit(tree(files));
 const fixture={calls,blobs,trees,commits,get head(){return current},get files(){return flatten(commits.get(current).tree.sha)},read(filename){const id=this.files.get(filename);return id?blobs.get(id):undefined},
  commitExternal(changes={}){const next=this.files;for(const [filename,content] of Object.entries(changes))next.set(filename,blob(content));current=commit(tree(next),[current],'External change');return current;},
  async fetch(url,options={}){
   if(!String(url).startsWith(base+'/'))throw new Error('Fixture rejects external URL');
   const endpoint=String(url).slice(base.length),method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;
   const call={endpoint,method,body,options};calls.push(call);if(onRequest){const result=await onRequest(call,fixture);if(result)return result;}
   const json=(value,status=200)=>Response.json(value,{status});
   if(method==='GET'&&endpoint==='/git/ref/heads/main')return json({object:{type:'commit',sha:current}});
   let match;if(method==='GET'&&(match=endpoint.match(/^\/git\/commits\/([a-f0-9]{40})$/)))return commits.has(match[1])?json(commits.get(match[1])):json({},404);
   if(method==='GET'&&(match=endpoint.match(/^\/git\/trees\/([a-f0-9]{40})$/)))return trees.has(match[1])?json({sha:match[1],tree:trees.get(match[1]),truncated:false}):json({},404);
   if(method==='GET'&&(match=endpoint.match(/^\/git\/blobs\/([a-f0-9]{40})$/))){const content=blobs.get(match[1]);return content?json({sha:match[1],size:content.length,encoding:'base64',content:content.toString('base64')}):json({},404);}
   if(method==='POST'&&endpoint==='/git/blobs')return json({sha:blob(Buffer.from(body.content,body.encoding==='base64'?'base64':'utf8'))},201);
   if(method==='POST'&&endpoint==='/git/trees'){const next=flatten(body.base_tree);for(const node of body.tree){if(node.sha===null)next.delete(node.path);else next.set(node.path,node.sha);}return json({sha:tree(next)},201);}
   if(method==='POST'&&endpoint==='/git/commits')return json({sha:commit(body.tree,body.parents,body.message)},201);
   if(method==='PATCH'&&endpoint==='/git/refs/heads/main'){
    if(body.force!==false||!commits.get(body.sha)?.parents.some(p=>p.sha===current))return json({message:'Update is not a fast forward'},422);
    current=body.sha;return json({object:{sha:current}});
   }
   return json({message:'Unsupported fixture endpoint'},404);
  },
 };
 return fixture;
}
