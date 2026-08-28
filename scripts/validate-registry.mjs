#!/usr/bin/env node
/**
 * Manual registry validator. Run by hand: `node scripts/validate-registry.mjs`
 *
 * This is a correctness check only — it is NOT a build step, NOT wired into
 * CI, and NOT automatic discovery/sync. It exists so a human or agent can
 * confirm registry.json still matches registry.schema.ts before committing.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = join(__dirname, "..", "registry.json");

const PLATFORM_LAYER = ["Platform", "Management", "Product"];
const MATURITY = ["Idea", "Planning", "Prototype", "Internal Alpha", "Beta", "Production"];
const DEPLOYMENT = ["Not Deployed", "Local", "Internal", "Public", "Archived"];
const VISIBILITY = ["Private", "Internal", "Public"];
const CERTIFICATION = ["Not Certified", "YCSU Certified"];
const VERSION_SOURCE = ["github-release", "git-tag", "package", "manual", "none"];

const REQUIRED_STRING_FIELDS = ["id", "name", "shortName", "description", "category", "lastUpdated"];
const REQUIRED_NULLABLE_FIELDS = [
  "version", "mainUrl", "plannedUrl", "githubUrl", "trackerUrl", "docsUrl", "roadmapUrl", "statusNote",
];

let errors = [];
let warnings = [];

const raw = readFileSync(registryPath, "utf8");
const data = JSON.parse(raw);

if (data.schemaVersion !== "1.0") errors.push(`schemaVersion must be "1.0", got ${JSON.stringify(data.schemaVersion)}`);
if (!Array.isArray(data.products)) errors.push("products must be an array");

const seenIds = new Set();

for (const p of data.products ?? []) {
  const tag = p.id ?? "(missing id)";

  for (const f of REQUIRED_STRING_FIELDS) {
    if (typeof p[f] !== "string" || p[f].trim() === "") errors.push(`[${tag}] missing/empty required field "${f}"`);
  }
  for (const f of REQUIRED_NULLABLE_FIELDS) {
    if (!(f in p)) errors.push(`[${tag}] missing field "${f}" (use null if unknown)`);
  }

  if (seenIds.has(p.id)) errors.push(`[${tag}] duplicate id`);
  seenIds.add(p.id);

  if (!PLATFORM_LAYER.includes(p.platformLayer)) errors.push(`[${tag}] invalid platformLayer "${p.platformLayer}"`);
  if (!MATURITY.includes(p.maturity)) errors.push(`[${tag}] invalid maturity "${p.maturity}"`);
  if (!DEPLOYMENT.includes(p.deployment)) errors.push(`[${tag}] invalid deployment "${p.deployment}"`);
  if (!VISIBILITY.includes(p.visibility)) errors.push(`[${tag}] invalid visibility "${p.visibility}"`);
  if (!CERTIFICATION.includes(p.certification)) errors.push(`[${tag}] invalid certification "${p.certification}"`);
  if (!VERSION_SOURCE.includes(p.versionSource)) errors.push(`[${tag}] invalid versionSource "${p.versionSource}"`);

  if (p.versionSource === "none" && p.version !== null) {
    errors.push(`[${tag}] versionSource is "none" but version is not null`);
  }
  if (p.versionSource !== "none" && !p.version) {
    errors.push(`[${tag}] versionSource is "${p.versionSource}" but version is empty/null`);
  }

  // Core rule: a planned (unverified) URL must never masquerade as a live main URL.
  if (p.mainUrl && p.plannedUrl) {
    errors.push(`[${tag}] has both mainUrl and plannedUrl set — a product is either live (mainUrl) or planned (plannedUrl), not both`);
  }
  if (p.mainUrl && p.deployment === "Not Deployed") {
    errors.push(`[${tag}] has mainUrl set but deployment is "Not Deployed" — contradictory`);
  }
  if (!p.mainUrl && p.deployment === "Public") {
    warnings.push(`[${tag}] deployment is "Public" but mainUrl is null — verify this is intentional`);
  }
  if (p.certification === "YCSU Certified" && (!p.mainUrl || !p.githubUrl || p.versionSource === "none")) {
    errors.push(`[${tag}] marked "YCSU Certified" but fails minimum checklist (needs mainUrl, githubUrl, and a real versionSource) — see docs/PLATFORM_MODEL.md`);
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

console.log(`registry.json valid — ${data.products.length} product(s), 0 errors.`);
