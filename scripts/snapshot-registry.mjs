#!/usr/bin/env node
/**
 * Refreshes data/registry.snapshot.json from the live Registry (Supabase).
 * Run by hand: `node scripts/snapshot-registry.mjs`
 *
 * One-way (DB -> file), manual, on-demand. This is a disaster-recovery/audit
 * snapshot, not a sync mechanism — never run the reverse direction. See
 * docs/DATA_LAYER.md "Snapshot Model".
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUPABASE_URL = "https://fzydsnxxcdllkjxwdiwn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wpnShrpWOLV94EEUA86vVg_zRQbbW2W";

const ROW_TO_PRODUCT = {
  id: "id", slug: "slug", name: "name", short_name: "shortName", description: "description",
  category: "category", platform_layer: "platformLayer", maturity: "maturity",
  deployment: "deployment", visibility: "visibility", operational_status: "operationalStatus",
  version: "version", version_source: "versionSource", main_url: "mainUrl",
  planned_url: "plannedUrl", github_url: "githubUrl", tracker_url: "trackerUrl",
  docs_url: "docsUrl", roadmap_url: "roadmapUrl", featured: "featured",
  archived: "archived", certification: "certification", last_updated: "lastUpdated",
  status_note: "statusNote",
};

function rowToProduct(row) {
  const p = {};
  for (const [col, camel] of Object.entries(ROW_TO_PRODUCT)) p[camel] = row[col] ?? null;
  return p;
}

const res = await fetch(
  `${SUPABASE_URL}/rest/v1/product_registry?select=*&order=featured.desc,name.asc`,
  { headers: { apikey: SUPABASE_ANON_KEY } },
);
if (!res.ok) {
  console.error(`Fetch failed: HTTP ${res.status}`);
  process.exit(1);
}
const rows = await res.json();
const products = rows.map(rowToProduct);
const updated = products.reduce((max, p) => (p.lastUpdated > max ? p.lastUpdated : max), "");

const snapshot = { schemaVersion: "1.1", updated, products };

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "data", "registry.snapshot.json");
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + "\n");

console.log(`Wrote ${products.length} product(s) to data/registry.snapshot.json (including archived).`);
