import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { orderedProducts, movedOrder, orderPayload } from '../assets/js/registry-order.mjs';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(await readFile(new URL('../supabase/functions/registry-ops/handler.ts',import.meta.url),'utf8'));
const {createRegistryHandler} = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const migration = await readFile(new URL('../supabase/migrations/20260911215355_product_registry_sort_order.sql',import.meta.url),'utf8');
const base = await readFile(new URL('../supabase/migrations/20260829000001_product_registry.sql',import.meta.url),'utf8');
const snapshot = JSON.parse(await readFile(new URL('../data/registry.snapshot.json',import.meta.url),'utf8'));
const ids = snapshot.products.map(p=>p.id);
const ownerId='38531f7e-e05e-473a-a587-500b1d3aebe5';

test('stable ordering: explicit ranks, nulls last, deterministic ties, archived hidden',()=>{
 const input=[{id:'d',name:'Delta',sortOrder:null},{id:'b',name:'Beta',sortOrder:10},{id:'a',name:'Alpha',sortOrder:10},{id:'c',name:'Charlie'},{id:'x',name:'Hidden',sortOrder:0,archived:true}];
 assert.deepEqual(orderedProducts(input).map(p=>p.id),['a','b','c','d']);
 assert.equal(input[0].id,'d');
 assert.deepEqual(movedOrder(['a','b','c'],'c',0),['c','a','b']);
 assert.throws(()=>orderPayload(input,['a']),/Invalid/);
});

test('migration and reorder are atomic, preserve metadata, and reject stale/invalid/direct writes',async()=>{
 const db=new PGlite();
 try {
 await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
 await db.exec(base);
 await db.exec('grant usage on schema public to anon,authenticated,service_role; grant select,insert,update,delete on public.product_registry to anon,authenticated,service_role;');
 for (const p of snapshot.products) {
  await db.query('insert into public.product_registry (id,slug,name,description,maturity,deployment,featured,last_updated) values ($1,$2,$3,$4,$5,$6,$7,$8)',[p.id,p.slug,p.name,p.description,p.maturity,p.deployment,p.featured,p.lastUpdated]);
 }
 const before=(await db.query('select id,slug,name,description,maturity,deployment,last_updated from public.product_registry order by id')).rows;
 await db.exec(migration);
 const ranks=(await db.query('select id,sort_order as "sortOrder" from public.product_registry order by sort_order')).rows;
 assert.deepEqual(ranks.map(p=>p.id),ids); assert.deepEqual(ranks.map(p=>p.sortOrder),[10,20,30,40,50,60,70,80]);
 const after=(await db.query('select id,slug,name,description,maturity,deployment,last_updated from public.product_registry order by id')).rows;
 assert.deepEqual(after,before);
 await db.exec('set role anon');
 await assert.rejects(db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[])',[JSON.stringify(ranks),ids]),/permission denied/);
 const denied=await db.query('update public.product_registry set sort_order=999 returning id'); assert.equal(denied.rows.length,0);
 await db.exec('reset role; set role authenticated');
 await assert.rejects(db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[])',[JSON.stringify(ranks),ids]),/permission denied/);
 await db.exec('reset role; set role service_role');
 const reordered=movedOrder(ids,ids.at(-1),0);
 const result=(await db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[]) as result',[JSON.stringify(ranks),reordered])).rows[0].result;
 assert.equal(result.changed,8); assert.deepEqual(result.order.map(p=>p.id),reordered);
 await assert.rejects(db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[])',[JSON.stringify(ranks),ids]),/Order changed/);
 const persisted=(await db.query('select id from public.product_registry order by sort_order')).rows.map(p=>p.id);
 assert.deepEqual(persisted,reordered);
 await assert.rejects(db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[])',[JSON.stringify(result.order),[...ids.slice(0,-1),ids[0]]]),/Active product set/);
 const noOp=(await db.query('select public.reorder_product_registry($1::jsonb,$2::uuid[]) as result',[JSON.stringify(result.order),reordered])).rows[0].result;
 assert.equal(noOp.changed,0);
 assert.deepEqual((await db.query('select id,slug,name,description,maturity,deployment,last_updated from public.product_registry order by id')).rows,before);
 } finally {await db.close();}
});

test('Edge authorization: only verified owner reorders; manager contract remains; public/other/forged rejected',async()=>{
 let calls=0;
 const client={auth:{getUser:async token=>({data:{user:token==='owner'?{id:ownerId,email_confirmed_at:'2026-01-01'}:token==='other'?{id:'other',email_confirmed_at:'2026-01-01',user_metadata:{owner:true}}:null},error:null})},rpc:async()=>{calls++;return {data:{order:[],changed:0},error:null}}};
 const handler=createRegistryHandler({createClient:()=>client,getEnv:name=>name==='REGISTRY_API_KEY'?'test-manager':undefined});
 const request=(token,body)=>handler(new Request('https://example.test',{method:'POST',headers:{Authorization:token?`Bearer ${token}`:'','Content-Type':'application/json'},body:JSON.stringify(body)}));
 assert.equal((await request('',{operation:'reorder'})).status,401);
 assert.equal((await request('forged',{operation:'authorize'})).status,401);
 assert.equal((await request('other',{operation:'authorize'})).status,403);
 assert.equal((await request('owner',{operation:'authorize'})).status,200);
 assert.equal((await request('owner',{operation:'update',slug:'ycsu-platform',data:{name:'bad'}})).status,403);
 assert.equal((await request('owner',{operation:'delete',data:{confirm:true}})).status,403);
 const data={expected:ids.map((id,i)=>({id,sortOrder:(i+1)*10})),order:ids};
 assert.equal((await request('owner',{operation:'reorder',data})).status,200);assert.equal(calls,1);
 assert.equal((await request('test-manager',{operation:'authorize'})).status,200);
 assert.equal((await request('owner',{operation:'reorder',data:{...data,version:'bad'}})).status,422);
 assert.equal((await request('owner',{operation:'reorder',data:{...data,order:ids.map(()=>ids[0])}})).status,422);
 assert.equal(calls,1);
 const preflight=await handler(new Request('https://example.test',{method:'OPTIONS'}));
 assert.equal(preflight.headers.get('access-control-allow-origin'),'https://main.ycsu.cc');
});
