import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';import {stripTypeScriptTypes} from 'node:module';import {PGlite} from '@electric-sql/pglite';
import {registryResponse,assertPublicRegistry,LINK_FIELDS,publicText} from '../assets/js/registry-public.mjs';
const source=stripTypeScriptTypes(await readFile(new URL('../supabase/functions/registry-ops/handler.ts',import.meta.url),'utf8')).replace('../../../assets/js/registry-public.mjs',new URL('../assets/js/registry-public.mjs',import.meta.url).href);
const {createRegistryHandler}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const owner='38531f7e-e05e-473a-a587-500b1d3aebe5';
const row={id:'00000000-0000-0000-0000-000000000001',slug:'example',name:'Example',description:'Visit https://tool.example.invalid/run or tool.example.invalid/run',status_note:'Docs at docs.example.invalid/guide and /run',main_url:'https://tool.example.invalid/run',github_url:'https://github.com/example/private',archived:false,featured:false,sort_order:10,last_updated:'2026-09-11',unexpected_secret:'https://hidden.example.invalid'};
test('server public projection omits links/unknown fields and removes URLs from every text field',()=>{
 const data=assertPublicRegistry(registryResponse([row]));
 for(const key of Object.values(LINK_FIELDS))assert.equal(key in data.products[0],false);
 assert.equal('unexpected_secret' in data.products[0],false);
 const json=JSON.stringify(data);assert.doesNotMatch(json,/example\.invalid|github\.com|\/run/);
 assert.equal(registryResponse([row],true).products[0].mainUrl,row.main_url);
 assert.equal(row.main_url,'https://tool.example.invalid/run');
 assert.throws(()=>assertPublicRegistry({ok:true,schemaVersion:'1.3',updated:'',products:[{mainUrl:null}]}),/Non-public/);
 assert.equal(publicText('Version v1.3.0'),'Version v1.3.0');
 assert.equal(publicText('Ordinary text',['mailto:owner@example.invalid']),'Ordinary text');
 for(const address of ['192.168.1.10:8080/run','localhost:3000/run','[::1]:8080/run'])assert.doesNotMatch(publicText('Open '+address,['http://'+address]),/192\.168|localhost|::1/);
 assert.throws(()=>assertPublicRegistry({...data,ownerLinks:{mainUrl:'https://protected.example.invalid'}}),/envelope/);
 assert.throws(()=>assertPublicRegistry({...data,products:[{description:{mainUrl:'https://protected.example.invalid'}}]}),/scalar/);
});
test('read-public is safe without credentials; owner full reads require exact validated UUID; writes stay restricted',async()=>{
 let calls=0;const chain={select(){return this},eq(){return this},order(){return this},then(resolve){calls++;return Promise.resolve({data:[row],error:null}).then(resolve)}};
 const handler=createRegistryHandler({createClient:()=>({from:()=>chain,auth:{getUser:async token=>({data:{user:token==='owner'?{id:owner,email_confirmed_at:'yes'}:token==='other'?{id:'another-user',email_confirmed_at:'yes',user_metadata:{owner:true}}:null},error:null})}}),getEnv:k=>k==='REGISTRY_API_KEY'?'manager':undefined});
 const req=(operation,token='',extra={})=>handler(new Request('https://example.invalid',{method:'POST',headers:{Authorization:token?'Bearer '+token:'','Content-Type':'application/json'},body:JSON.stringify({operation,...extra})}));
 const guest=await req('read-public');assert.equal(guest.status,200);assertPublicRegistry(await guest.json());assert.equal(guest.headers.get('cache-control'),'no-store');
 assert.equal((await req('read-public','',{select:'main_url'})).status,400);
 for(const token of ['', 'forged','other']){assert.notEqual((await req('read-owner',token)).status,200);assert.notEqual((await req('reorder',token)).status,200);}
 const full=await req('read-owner','owner');assert.equal(full.status,200);assert.equal((await full.json()).products[0].mainUrl,row.main_url);
 for(const op of ['create','update','delete','archive','unarchive'])assert.equal((await req(op,'owner')).status,403);
 assert.equal(calls,2);
});
test('database denies raw reads and writes to anon and every authenticated user including column grants',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;');
 await db.exec(await readFile(new URL('../supabase/migrations/20260829000001_product_registry.sql',import.meta.url),'utf8'));
 await db.exec('grant all on public.product_registry to anon,authenticated,service_role;grant select(main_url) on public.product_registry to public,anon,authenticated;');
 await db.exec(await readFile(new URL('../supabase/migrations/20260911223740_owner_only_registry_links.sql',import.meta.url),'utf8'));
 for(const role of ['anon','authenticated']){
 await db.exec('set role '+role);
 for(const sql of ['select name,main_url from public.product_registry','select main_url from public.product_registry','select * from public.product_registry','update public.product_registry set name=\'bad\'','truncate public.product_registry'])await assert.rejects(db.exec(sql),/permission denied/);
 await db.exec('reset role');}
 await db.exec('set role service_role');await db.exec('select * from public.product_registry');
 }finally{await db.close();}
});
test('published allowlist has only public runtime artifacts and no old export/manifest/source',async()=>{
 const root=new URL('../dist/',import.meta.url);const top=await readdir(root);
 assert.deepEqual(top.sort(),['_headers','assets','data','index.html']);
 assert.deepEqual(await readdir(new URL('data/',root)),['registry.public.snapshot.json']);
 assertPublicRegistry(JSON.parse(await readFile(new URL('data/registry.public.snapshot.json',root),'utf8')));
 const html=await readFile(new URL('index.html',root),'utf8');assert.doesNotMatch(html,/github\.com\/blackeirose|registry\.snapshot\.json|rest\/v1\/product_registry/);
});
