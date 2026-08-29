// YCSU Platform v1.1 — Registry Write Interface ("registry-ops")
//
// This is the ONLY write path into public.product_registry. The table has
// no INSERT/UPDATE/DELETE RLS policy for anon or authenticated roles — this
// function authenticates callers via a custom shared secret (REGISTRY_API_KEY,
// a Supabase Function secret, never a Supabase Auth session, never exposed to
// the frontend) and then writes using the service_role key internally.
//
// See docs/REGISTRY_OPERATIONS.md for the full contract.

import { createClient } from "jsr:@supabase/supabase-js@2";

const PLATFORM_LAYER = ["Platform", "Management", "Product"];
const MATURITY = ["Idea", "Planning", "Prototype", "Internal Alpha", "Beta", "Production"];
const DEPLOYMENT = ["Not Deployed", "Local", "Internal", "Public", "Archived"];
const VISIBILITY = ["Private", "Internal", "Public"];
const OPERATIONAL_STATUS = ["Live", "Pending", "Offline", "Unknown"];
const CERTIFICATION = ["Not Certified", "YCSU Certified"];
const VERSION_SOURCE = ["github-release", "git-tag", "package", "manual", "none"];

// camelCase (external contract, matches registry.schema.ts) -> snake_case (DB column)
const FIELD_MAP: Record<string, string> = {
  slug: "slug",
  name: "name",
  shortName: "short_name",
  description: "description",
  category: "category",
  platformLayer: "platform_layer",
  maturity: "maturity",
  deployment: "deployment",
  visibility: "visibility",
  operationalStatus: "operational_status",
  version: "version",
  versionSource: "version_source",
  mainUrl: "main_url",
  plannedUrl: "planned_url",
  githubUrl: "github_url",
  trackerUrl: "tracker_url",
  docsUrl: "docs_url",
  roadmapUrl: "roadmap_url",
  featured: "featured",
  archived: "archived",
  certification: "certification",
  lastUpdated: "last_updated",
  statusNote: "status_note",
};

const REQUIRED_ON_CREATE = ["slug", "name", "description", "maturity", "deployment"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function isUrl(v: unknown) {
  if (typeof v !== "string") return false;
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function toDbRow(input: Record<string, unknown>): { row: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const row: Record<string, unknown> = {};

  for (const [camel, val] of Object.entries(input)) {
    const col = FIELD_MAP[camel];
    if (!col) {
      errors.push(`unknown field "${camel}"`);
      continue;
    }
    row[col] = val;
  }

  if ("platform_layer" in row && !PLATFORM_LAYER.includes(row.platform_layer as string)) {
    errors.push(`invalid platformLayer "${row.platform_layer}"`);
  }
  if ("maturity" in row && !MATURITY.includes(row.maturity as string)) {
    errors.push(`invalid maturity "${row.maturity}"`);
  }
  if ("deployment" in row && !DEPLOYMENT.includes(row.deployment as string)) {
    errors.push(`invalid deployment "${row.deployment}"`);
  }
  if ("visibility" in row && !VISIBILITY.includes(row.visibility as string)) {
    errors.push(`invalid visibility "${row.visibility}"`);
  }
  if ("operational_status" in row && !OPERATIONAL_STATUS.includes(row.operational_status as string)) {
    errors.push(`invalid operationalStatus "${row.operational_status}"`);
  }
  if ("certification" in row && !CERTIFICATION.includes(row.certification as string)) {
    errors.push(`invalid certification "${row.certification}"`);
  }
  if ("version_source" in row && !VERSION_SOURCE.includes(row.version_source as string)) {
    errors.push(`invalid versionSource "${row.version_source}"`);
  }
  for (const urlField of ["main_url", "planned_url", "github_url", "tracker_url", "docs_url", "roadmap_url"]) {
    if (row[urlField] != null && !isUrl(row[urlField])) {
      errors.push(`"${urlField}" must be a valid URL or null`);
    }
  }
  if (row.main_url && row.planned_url) {
    errors.push("mainUrl and plannedUrl cannot both be set — a product is either live or planned, not both");
  }
  if ("version_source" in row) {
    const hasVersion = row.version != null && row.version !== "";
    if (row.version_source === "none" && hasVersion) {
      errors.push('versionSource is "none" but version is set');
    }
    if (row.version_source !== "none" && !hasVersion) {
      errors.push(`versionSource is "${row.version_source}" but version is empty`);
    }
  }

  return { row, errors };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ ok: false, error: "only POST is supported" }, 405);
  }

  const expectedKey = Deno.env.get("REGISTRY_API_KEY");
  const authHeader = req.headers.get("authorization") ?? "";
  const providedKey = authHeader.replace(/^Bearer\s+/i, "");
  if (!expectedKey || providedKey !== expectedKey) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "request body must be JSON" }, 400);
  }

  const operation = body.operation as string;
  const slug = body.slug as string | undefined;
  const data = (body.data as Record<string, unknown>) ?? {};

  if (!operation) {
    return json({ ok: false, error: "missing \"operation\"" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  if (operation === "create") {
    const { row, errors } = toDbRow({ ...data, slug: data.slug ?? slug });
    for (const f of REQUIRED_ON_CREATE) {
      const col = FIELD_MAP[f];
      if (row[col] == null || row[col] === "") errors.push(`"${f}" is required to create a product`);
    }
    if (errors.length) return json({ ok: false, error: "validation failed", details: errors }, 422);

    const { data: existing } = await supabase
      .from("product_registry")
      .select("slug")
      .eq("slug", row.slug as string)
      .maybeSingle();
    if (existing) return json({ ok: false, error: `slug "${row.slug}" already exists` }, 409);

    if (!("last_updated" in row)) row.last_updated = new Date().toISOString().slice(0, 10);

    const { data: inserted, error } = await supabase
      .from("product_registry")
      .insert(row)
      .select()
      .single();
    if (error) return json({ ok: false, error: error.message }, 400);
    return json({ ok: true, product: inserted }, 201);
  }

  if (operation === "update") {
    if (!slug) return json({ ok: false, error: "\"slug\" is required for update" }, 400);
    const { row, errors } = toDbRow(data);
    if (errors.length) return json({ ok: false, error: "validation failed", details: errors }, 422);
    if (!("last_updated" in row)) row.last_updated = new Date().toISOString().slice(0, 10);

    const { data: updated, error } = await supabase
      .from("product_registry")
      .update(row)
      .eq("slug", slug)
      .select()
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, 400);
    if (!updated) return json({ ok: false, error: `no product with slug "${slug}"` }, 404);
    return json({ ok: true, product: updated });
  }

  if (operation === "archive" || operation === "unarchive") {
    if (!slug) return json({ ok: false, error: `"slug" is required for ${operation}` }, 400);
    const { data: updated, error } = await supabase
      .from("product_registry")
      .update({ archived: operation === "archive", last_updated: new Date().toISOString().slice(0, 10) })
      .eq("slug", slug)
      .select()
      .maybeSingle();
    if (error) return json({ ok: false, error: error.message }, 400);
    if (!updated) return json({ ok: false, error: `no product with slug "${slug}"` }, 404);
    return json({ ok: true, product: updated });
  }

  if (operation === "delete") {
    if (!slug) return json({ ok: false, error: "\"slug\" is required for delete" }, 400);
    if (data.confirm !== true) {
      return json({ ok: false, error: "delete requires data.confirm === true — prefer \"archive\" instead" }, 400);
    }
    const { error } = await supabase.from("product_registry").delete().eq("slug", slug);
    if (error) return json({ ok: false, error: error.message }, 400);
    return json({ ok: true, deleted: slug });
  }

  return json({ ok: false, error: `unknown operation "${operation}"` }, 400);
});
