import {createClient} from 'jsr:@supabase/supabase-js@2.116.0';
import {createWritingHandler} from './handler.ts';
const handler=createWritingHandler({createClient,getEnv:name=>Deno.env.get(name)});
Deno.serve(async req=>{try{return await handler(req)}catch{return new Response(JSON.stringify({ok:false,error:'Writing request failed'}),{status:500,headers:{'content-type':'application/json','cache-control':'no-store','access-control-allow-origin':'https://main.ycsu.cc'}})}});
