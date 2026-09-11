/** Server-side public contract. Protected fields are absent, never null placeholders. */
export const PUBLIC_FIELDS={id:'id',slug:'slug',name:'name',short_name:'shortName',description:'description',category:'category',platform_layer:'platformLayer',maturity:'maturity',deployment:'deployment',visibility:'visibility',operational_status:'operationalStatus',version:'version',version_source:'versionSource',featured:'featured',archived:'archived',certification:'certification',last_updated:'lastUpdated',status_note:'statusNote',sort_order:'sortOrder'};
export const LINK_FIELDS={main_url:'mainUrl',planned_url:'plannedUrl',github_url:'githubUrl',tracker_url:'trackerUrl',docs_url:'docsUrl',roadmap_url:'roadmapUrl'};
const domain=/\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}(?::\d+)?(?:\/[^\s<>"')\]]*)?/gi;
const scheme=/\b[a-z][a-z0-9+.-]*:\/\/[^\s<>"')\]]+/gi;
export function publicText(value,protectedValues=[]) {
 if(typeof value!=='string')return value;
 let safe=value;
 for(const v of protectedValues){
  if(typeof v!=='string'||!v)continue;
  const variants=[v];try{const u=new URL(v);variants.push(u.host,u.hostname);if(u.pathname.length>1)variants.push(u.pathname);}catch{}
  for(const part of variants.filter(Boolean))safe=safe.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),'[owner link]');
 }
 return safe.replace(scheme,'[owner link]').replace(domain,'[owner link]').replace(/(?:\b(?:\d{1,3}\.){3}\d{1,3}|\blocalhost\b|\[[0-9a-f:]+\])(?::\d+)?(?:\/[^\s<>\"')\]]*)?/gi,'[owner link]');
}
export function registryResponse(rows,owner=false){
 const protectedValues=rows.flatMap(r=>Object.keys(LINK_FIELDS).map(k=>r[k]));
 const map=owner?{...PUBLIC_FIELDS,...LINK_FIELDS}:PUBLIC_FIELDS;
 const products=rows.map(row=>Object.fromEntries(Object.entries(map).map(([col,key])=>[key,owner?(row[col]??null):publicText(row[col]??null,protectedValues)])));
 return {ok:true,schemaVersion:'1.3',products,updated:products.reduce((latest,p)=>p.lastUpdated>latest?p.lastUpdated:latest,'')};
}
export function assertPublicRegistry(data){
 const envelope=['ok','schemaVersion','products','updated'];
 if(!data||Object.keys(data).some(k=>!envelope.includes(k))||data.ok!==true||data.schemaVersion!=='1.3'||typeof data.updated!=='string'||publicText(data.updated)!==data.updated||!Array.isArray(data.products))throw new Error('Invalid public Registry envelope');
 const allowed=new Set(Object.values(PUBLIC_FIELDS));
 for(const p of data.products){
  if(!p||typeof p!=='object'||Array.isArray(p))throw new Error('Invalid public product');
  for(const [key,value] of Object.entries(p)){
   if(!allowed.has(key))throw new Error(`Non-public field: ${key}`);
   if(key==='featured'||key==='archived'){if(typeof value!=='boolean')throw new Error('Invalid public boolean');}
   else if(key==='sortOrder'){if(value!==null&&!Number.isInteger(value))throw new Error('Invalid public rank');}
   else if(value!==null&&typeof value!=='string')throw new Error('Invalid public scalar');
   if(typeof value==='string'&&publicText(value)!==value)throw new Error(`URL in public field: ${key}`);
  }
 }
 return data;
}
