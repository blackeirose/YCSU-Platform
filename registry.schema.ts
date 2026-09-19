/** Canonical owner/full Registry schema; public API omits protected links.
 * Runtime reads use registry-ops; data/registry.public.snapshot.json is public-only.
 * See docs/DATA_LAYER.md and docs/REGISTRY_SCHEMA.md for enforced v1.3 access.
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
  archived: boolean; // Constrained compatibility projection: archived or deleted.
  lifecycleState: "visible" | "hidden" | "archived" | "deleted";
  lifecycleRevision: number; // Owner-only compare-and-swap version.
  deletedAt: string | null; // Owner-only; present only in Deleted state.
  certification: Certification;
  /** ISO date (YYYY-MM-DD) of the last meaningful metadata update — not a
   *  render timestamp. See docs/REGISTRY_OPERATIONS.md "lastUpdated rule". */
  lastUpdated: string;
  /** Short human-readable caveat/context, e.g. "Supabase migration in progress". */
  statusNote: string | null;
}

export interface Registry {
  schemaVersion: "1.3";
  ok: true;
  updated: string;
  products: RegistryProduct[];
}

/** Server-projected public metadata. Protected fields are absent, not null. */
export type PublicRegistryProduct = Omit<RegistryProduct,
  "mainUrl" | "plannedUrl" | "githubUrl" | "trackerUrl" | "docsUrl" | "roadmapUrl">;

export interface PublicRegistry extends Omit<Registry, "products"> {
  products: PublicRegistryProduct[];
}
