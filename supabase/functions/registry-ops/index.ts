import { createClient } from "jsr:@supabase/supabase-js@2.116.0";
import { createRegistryHandler } from "./handler.ts";

const handler = createRegistryHandler({ createClient, getEnv: name => Deno.env.get(name) });
Deno.serve(async req => {
  try { return await handler(req); }
  catch { return new Response(JSON.stringify({ ok: false, error: "Registry request failed." }), {
    status: 500, headers: { "content-type": "application/json", "access-control-allow-origin": "https://main.ycsu.cc", "cache-control": "no-store" },
  }); }
});
