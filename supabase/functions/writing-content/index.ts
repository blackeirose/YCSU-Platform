import {createClient} from 'jsr:@supabase/supabase-js@2.116.0';
import {createWritingContentHandler} from './handler.mjs';

Deno.serve(createWritingContentHandler({createClient,getEnv:name=>Deno.env.get(name)}));
