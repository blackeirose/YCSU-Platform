/**
 * YCSU Platform — Product Registry Schema (v1)
 *
 * This is the canonical, typed definition of a Registry entry. `registry.json`
 * must conform to this shape. `index.html` is plain JS and does not import
 * this file directly (no build step in v1) — this file is the type contract
 * a future build step, validator, or AI CORE integration should target.
 *
 * See docs/REGISTRY_SCHEMA.md for field-by-field explanation and
 * docs/PRODUCT_MANIFEST_SPEC.md for the related per-product manifest format.
 */

/** Which conceptual layer of the YCSU Platform architecture this entry belongs to.
 *  See docs/PLATFORM_MODEL.md. Almost everything is "Product" — do not assign
 *  "Management" speculatively; it is reserved for a layer that has not been
 *  architecturally defined yet. */
export type PlatformLayer = "Platform" | "Management" | "Product";

/** Product maturity — where it sits on the Idea → Production lifecycle.
 *  Independent of deployment and visibility; do not conflate. */
export type Maturity =
  | "Idea"
  | "Planning"
  | "Prototype"
  | "Internal Alpha"
  | "Beta"
  | "Production";

/** Where/how the product is actually running. Independent of maturity. */
export type Deployment =
  | "Not Deployed"
  | "Local"
  | "Internal"
  | "Public"
  | "Archived";

/** Who can access it. Independent of maturity and deployment. */
export type Visibility = "Private" | "Internal" | "Public";

/** Whether the entry has passed the YCSU Certified checklist (docs/PLATFORM_MODEL.md §Certification). */
export type Certification = "Not Certified" | "YCSU Certified";

/** Where `version` comes from. "none" means version is genuinely unknown —
 *  never fabricate a version to fill this field. */
export type VersionSource = "github-release" | "git-tag" | "package" | "manual" | "none";

export interface RegistryProduct {
  /** Stable machine identifier, kebab-case. Never reused for a different product. */
  id: string;
  name: string;
  /** Short form for tight UI contexts. */
  shortName: string;
  description: string;
  /** Free-text grouping label, e.g. "Platform Infrastructure", "Development Tracking". */
  category: string;
  platformLayer: PlatformLayer;
  maturity: Maturity;
  deployment: Deployment;
  visibility: Visibility;
  /** Semantic version string, e.g. "v1.0.0". Null when versionSource is "none". */
  version: string | null;
  versionSource: VersionSource;
  /** Verified, currently-live primary URL. Null unless actually confirmed reachable.
   *  NEVER set this to a domain that has not been verified live — use plannedUrl instead. */
  mainUrl: string | null;
  /** The intended future URL for a product that isn't live yet. Purely informational —
   *  UI must never render this as an active Launch link. */
  plannedUrl: string | null;
  githubUrl: string | null;
  trackerUrl: string | null;
  docsUrl: string | null;
  roadmapUrl: string | null;
  certification: Certification;
  /** ISO date (YYYY-MM-DD) this entry's facts were last verified against real state. */
  lastUpdated: string;
  /** Short human-readable caveat/context, e.g. "Supabase migration in progress". */
  statusNote: string | null;
}

export interface Registry {
  schemaVersion: "1.0";
  updated: string;
  products: RegistryProduct[];
}
