#!/usr/bin/env node
// Manual, one-way public fallback refresh. Never export owner records into this repo.
import {writeFile} from 'node:fs/promises';
import {assertPublicRegistry,emptyRegistry} from '../assets/js/registry-public.mjs';
const response=await fetch('https://fzydsnxxcdllkjxwdiwn.supabase.co/functions/v1/registry-ops',{
 method:'POST',headers:{apikey:'sb_publishable_wpnShrpWOLV94EEUA86vVg_zRQbbW2W','Content-Type':'application/json'},body:JSON.stringify({operation:'read-public',contract:'lifecycle-v1'}),cache:'no-store'});
if(!response.ok)throw new Error(`Public Registry HTTP ${response.status}`);
const data=assertPublicRegistry(await response.json());
await writeFile(new URL('../data/registry.public.snapshot.json',import.meta.url),JSON.stringify(emptyRegistry(),null,2)+'\n');
console.log(`Verified ${data.products.length} current products. Wrote empty fail-closed fallback; stale records are never published.`);
