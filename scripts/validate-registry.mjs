import {assertPublicRegistry} from '../assets/js/registry-public.mjs';
/**
 * Manual registry validator. Run by hand: `node scripts/validate-registry.mjs`
 *
 * This is a correctness check only — it is NOT a build step, NOT wired into
 * CI, and NOT automatic discovery/sync. As of v1.1, the runtime source of
 * truth is the Supabase product_registry table (see docs/DATA_LAYER.md) —
 * this script validates data/registry.public.snapshot.json, the disaster-recovery/
 * audit copy, not the live data. Run `node scripts/snapshot-registry.mjs`
 * first to refresh the snapshot from the live Registry, then validate it.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "..", "data", "registry.public.snapshot.json");

const PLATFORM_LAYER = ["Platform", "Management", "Product"];
const MATURITY = ["Idea", "Planning", "Prototype", "Internal Alpha", "Beta", "Production"];
const DEPLOYMENT = ["Not Deployed", "Local", "Internal", "Public", "Archived"];
const VISIBILITY = ["Private", "Internal", "Public"];
const OPERATIONAL_STATUS = ["Live", "Pending", "Offline", "Unknown"];
const CERTIFICATION = ["Not Certified", "YCSU Certified"];
const VERSION_SOURCE = ["github-release", "git-tag", "package", "manual", "none"];

const REQUIRED_STRING_FIELDS = ["id", "slug", "name", "shortName", "description", "category", "lastUpdated"];
const REQUIRED_BOOLEAN_FIELDS = ["featured", "archived"];
const REQUIRED_NULLABLE_FIELDS = [
  "version", "statusNote",
];

let errors = [];
let warnings = [];

const raw = readFileSync(registryPath, "utf8");
const data = JSON.parse(raw);
assertPublicRegistry(data);

if (data.schemaVersion !== "1.3") errors.push(`schemaVersion must be "1.3", got ${JSON.stringify(data.schemaVersion)}`);
if (!Array.isArray(data.products)) errors.push("products must be an array");

const seenSlugs = new Set();

for (const p of data.products ?? []) {
  const tag = p.slug ?? p.id ?? "(missing slug)";

  for (const f of REQUIRED_STRING_FIELDS) {
    if (typeof p[f] !== "string" || p[f].trim() === "") errors.push(`[${tag}] missing/empty required field "${f}"`);
  }
  for (const f of REQUIRED_BOOLEAN_FIELDS) {
    if (typeof p[f] !== "boolean") errors.push(`[${tag}] "${f}" must be a boolean`);
  }
  for (const f of REQUIRED_NULLABLE_FIELDS) {
    if (!(f in p)) errors.push(`[${tag}] missing field "${f}" (use null if unknown)`);
  }

  if (p.sortOrder != null && (!Number.isInteger(p.sortOrder) || p.sortOrder < -2147483648 || p.sortOrder > 2147483647)) {
    errors.push(`[${tag}] sortOrder must be a PostgreSQL integer or null`);
  }
  if (seenSlugs.has(p.slug)) errors.push(`[${tag}] duplicate slug`);
  seenSlugs.add(p.slug);

  if (!PLATFORM_LAYER.includes(p.platformLayer)) errors.push(`[${tag}] invalid platformLayer "${p.platformLayer}"`);
  if (!MATURITY.includes(p.maturity)) errors.push(`[${tag}] invalid maturity "${p.maturity}"`);
  if (!DEPLOYMENT.includes(p.deployment)) errors.push(`[${tag}] invalid deployment "${p.deployment}"`);
  if (!VISIBILITY.includes(p.visibility)) errors.push(`[${tag}] invalid visibility "${p.visibility}"`);
  if (p.operationalStatus !== undefined && !OPERATIONAL_STATUS.includes(p.operationalStatus)) {
    errors.push(`[${tag}] invalid operationalStatus "${p.operationalStatus}"`);
  }
  if (!CERTIFICATION.includes(p.certification)) errors.push(`[${tag}] invalid certification "${p.certification}"`);
  if (!VERSION_SOURCE.includes(p.versionSource)) errors.push(`[${tag}] invalid versionSource "${p.versionSource}"`);

  if (p.versionSource === "none" && p.version !== null) {
    errors.push(`[${tag}] versionSource is "none" but version is not null`);
  }
  if (p.versionSource !== "none" && !p.version) {
    errors.push(`[${tag}] versionSource is "${p.versionSource}" but version is empty/null`);
  }


}

if (warnings.length) {
  console.warn(`${warnings.length} warning(s):`);
  for (const w of warnings) console.warn("  ⚠", w);
}

if (errors.length) {
  console.error(`${errors.length} error(s):`);
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}

console.log(`data/registry.public.snapshot.json valid — ${data.products.length} product(s), 0 errors.`);
