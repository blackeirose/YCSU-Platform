/**
 * YCSU Platform — Product Registry Schema (v1.1)
 *
 * This is the canonical, typed definition of a Registry entry. As of v1.1
 * the runtime source of truth is the Supabase `product_registry` table (see
 * docs/DATA_LAYER.md); this file — plus data/registry.snapshot.json and
 * scripts/validate-registry.mjs — remains the type contract and offline
 * correctness check. `index.html` fetches the live table directly and maps
 * each row onto this shape client-side (no build step).
 *
 * See docs/REGISTRY_SCHEMA.md for field-by-field explanation and
 * docs/REGISTRY_OPERATIONS.md for how authorized clients (e.g. ChatGPT)
 * create/update/archive records against this schema.
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

/** Optional, purely operational health indicator. Independent of maturity/
 *  deployment/visibility — never a stand-in for any of them. Not automated
 *  in v1.1 (no live polling); set manually by whoever performs the update. */
export type OperationalStatus = "Live" | "Pending" | "Offline" | "Unknown";

/** Whether the entry has passed the YCSU Certified checklist (docs/PLATFORM_MODEL.md §Certification). */
export type Certification = "Not Certified" | "YCSU Certified";

/** Where `version` comes from. "none" means version is genuinely unknown —
 *  never fabricate a version to fill this field. */
export type VersionSource = "github-release" | "git-tag" | "package" | "manual" | "none";

export interface RegistryProduct {
  /** DB-assigned UUID. Stable once created; not human-meaningful. */
  id: string;
  /** Stable, human-meaningful, kebab-case identifier. This is the business
   *  key used by registry-ops operations (create/update/archive all take a
   *  slug) and in URLs. Never reused for a different product. */
  slug: string;
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
  /** Optional operational indicator; defaults to "Unknown". See OperationalStatus. */
  operationalStatus: OperationalStatus;
  /** Semantic version string, e.g. "v1.0.0". Null when versionSource is "none". */
  version: string | null;
  versionSource: VersionSource;
  /** Verified, currently-live primary URL. Null unless actually confirmed reachable.
   *  NEVER set this to a domain that has not been verified live — use plannedUrl instead. */
  mainUrl: string | null;
  /** The intended future URL for a product that isn't live yet. Purely informational —
   *  UI must never render this as an active Launch link. Mutually exclusive with mainUrl. */
  plannedUrl: string | null;
  githubUrl: string | null;
  trackerUrl: string | null;
  docsUrl: string | null;
  roadmapUrl: string | null;
  /** Featured presentation metadata; sortOrder controls manual ordering. */
  featured: boolean;
  /** Manual display rank. Null/missing legacy ranks sort last, then name/slug. */
  sortOrder: number | null;
  /** True if this entry should not appear in the default active view. Prefer
   *  archiving over deleting — see docs/PLATFORM_MODEL.md §2/§7. */
  archived: boolean;
  certification: Certification;
  /** ISO date (YYYY-MM-DD) of the last meaningful metadata update — not a
   *  render timestamp. See docs/REGISTRY_OPERATIONS.md "lastUpdated rule". */
  lastUpdated: string;
  /** Short human-readable caveat/context, e.g. "Supabase migration in progress". */
  statusNote: string | null;
}

export interface Registry {
  schemaVersion: "1.1";
  updated: string;
  products: RegistryProduct[];
}
