import {presentation,validateSettings,validateHomeOrder} from '../../../assets/js/writing-model.mjs';
const OWNER='38531f7e-e05e-473a-a587-500b1d3aebe5';
export function createWritingHandler({createClient,getEnv}){
 return async (req:Request)=>{
  const headers={'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'https://main.ycsu.cc','access-control-allow-headers':'authorization, apikey, content-type','access-control-allow-methods':'POST, OPTIONS','vary':'Origin'};
  const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply(405,{ok:false,error:'POST required'});
  if(req.headers.get('origin')&&req.headers.get('origin')!=='https://main.ycsu.cc')return reply(403,{ok:false,error:'Origin denied'});
  const raw=await req.text();if(raw.length>30000)return reply(413,{ok:false,error:'Request too large'});
  let body;try{body=JSON.parse(raw)}catch{return reply(400,{ok:false,error:'Invalid JSON'})}
  if(!body||Array.isArray(body)||typeof body!=='object')return reply(400,{ok:false,error:'Invalid request'});
  const op=body.operation;
  if(!['read-public','read-owner','settings','home-order'].includes(op))return reply(400,{ok:false,error:'Invalid operation'});
  const keys=op.startsWith('read-')?['operation']:['operation','revision','data'];
  if(Object.keys(body).some(k=>!keys.includes(k)))return reply(400,{ok:false,error:'Unexpected field'});
  const db=createClient(getEnv('SUPABASE_URL'),getEnv('SUPABASE_SERVICE_ROLE_KEY'),{auth:{persistSession:false,autoRefreshToken:false}});
  const owner=op!=='read-public';
  if(owner){
   const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return reply(401,{ok:false,error:'Owner session required'});
   const {data,error}=await db.auth.getUser(token);const user=data?.user;
   if(error||!user||user.id!==OWNER||!user.email_confirmed_at||user.is_anonymous)return reply(403,{ok:false,error:'Owner access required'});
  }
  let result;
  if(op.startsWith('read-'))result=await db.from('main_presentation').select('settings,home_order,revision').eq('id',1).single();
  else{
   if(!Number.isSafeInteger(body.revision)||body.revision<0)return reply(400,{ok:false,error:'Revision required'});
   let settings=null,home=null;
   try{if(op==='settings')settings=validateSettings(body.data);else home=validateHomeOrder(body.data)}catch{return reply(400,{ok:false,error:'Invalid update'})}
   result=await db.rpc('update_main_presentation',{expected_revision:body.revision,settings_patch:settings,next_home_order:home});
   if(!result.error){if(!result.data?.length)return reply(409,{ok:false,error:'Changed elsewhere. Reload before saving.'});result={data:result.data[0]};}
  }
  if(result.error?.code==='40001')return reply(409,{ok:false,error:'Product set changed. Reload before saving.'});
  if(result.error||!result.data)return reply(503,{ok:false,error:'Writing settings unavailable'});
  const output=presentation(result.data,owner);
  if(!owner&&output.home_order.length){
   const active=await db.from('product_registry').select('id').eq('archived',false);
   if(active.error||!Array.isArray(active.data))return reply(503,{ok:false,error:'Writing settings unavailable'});
   const ids=new Set(['writing',...active.data.map(p=>p.id)]);output.home_order=output.home_order.filter(id=>ids.has(id));
  }
  return reply(200,output);
 };
}
