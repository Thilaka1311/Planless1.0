/**
 * imageResolver.ts
 *
 * Planless shared image resolution layer.
 *
 * This is the single place in the application that knows:
 *   - which storage bucket holds which type of image
 *   - how to convert a stored path into a renderable public URL
 *   - what placeholder to show when an image is absent or broken
 *   - how to support legacy paths alongside the new canonical format
 *
 * Every component and feature that renders an image should obtain its URL
 * from this module. No feature should ever call supabase.storage.getPublicUrl(),
 * hard-code a bucket name, or construct a Supabase storage URL directly.
 *
 * Future capabilities (signed URLs, CDN domains, image transforms, cache-busting)
 * can be implemented here without changing any caller.
 *
 * Usage:
 *   import { resolveImage, ImageType } from "@/shared/imaging/imageResolver";
 *
 *   // Explicit type — preferred
 *   const url = resolveImage(storagePath, ImageType.DiscoveryCover);
 *
 *   // Auto-detect from path structure — legacy / unknown
 *   const url = resolveImage(storagePath);
 */

import { supabase } from "../../../lib/supabaseClient";

// ─── Image types ──────────────────────────────────────────────────────────────

/**
 * Discriminator passed by callers so the resolver knows which bucket / fallback
 * to use. Extend this enum when adding new image contexts (circles, events, etc.)
 * without changing any existing caller.
 */
export enum ImageType {
  /** User profile avatar — resolves via the `avatars` bucket */
  Avatar = "avatar",
  /** Discovery card cover — resolves via `discovery-images` */
  DiscoveryCover = "discovery",
  /** Plan / event cover — resolves via `plan-images` (legacy) */
  PlanCover = "plan",
  /**
   * Unknown / auto-detect.
   * The resolver will inspect the path prefix to determine the correct bucket.
   * Use when migrating call sites that don't yet know the image type.
   */
  Unknown = "unknown",
}

// ─── Bucket registry ──────────────────────────────────────────────────────────

/**
 * Central registry that maps every ImageType to its Supabase bucket name.
 * Bucket names are defined in exactly one place in the entire codebase.
 */
const BUCKET_REGISTRY: Record<Exclude<ImageType, ImageType.Unknown>, string> = {
  [ImageType.Avatar]: "avatars",
  [ImageType.DiscoveryCover]: "discovery-images",
  [ImageType.PlanCover]: "plan-images",
};

/**
 * Known path prefixes stored in the database that indicate the bucket.
 * Used for auto-detection when ImageType.Unknown is passed.
 */
const PREFIX_TO_BUCKET: Record<string, string> = {
  "avatars/": "avatars",
  "discovery-images/": "discovery-images",
  "plan-images/": "plan-images",
  // common category prefixes written by adminUploadImage (sports/, movies/, dining/)
  "sports/": "discovery-images",
  "movies/": "discovery-images",
  "dining/": "discovery-images",
  "drinks/": "discovery-images",
  "custom/": "discovery-images",
};

// ─── Placeholder registry ─────────────────────────────────────────────────────

/**
 * Import placeholders here. Components receive the resolved URL and never need
 * to import asset files themselves.
 */
import defaultAvatarSrc from "../../assets/default_avatar.png";
import placeholderCoverSrc from "../../assets/placeholder.png";

const PLACEHOLDER_REGISTRY: Record<ImageType, string> = {
  [ImageType.Avatar]: defaultAvatarSrc,
  [ImageType.DiscoveryCover]: placeholderCoverSrc,
  [ImageType.PlanCover]: placeholderCoverSrc,
  [ImageType.Unknown]: placeholderCoverSrc,
};

// ─── URL cache ────────────────────────────────────────────────────────────────

/** Memoises resolved public URLs so repeated calls are synchronous after first resolution. */
const urlCache = new Map<string, string>();

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Resolve a stored image path into a renderable public URL.
 *
 * @param storagePath  The raw value stored in the database column.
 *                     Accepted formats:
 *                       - null / undefined / ""    → returns placeholder
 *                       - "https://..."            → returned as-is
 *                       - "data:..."               → returned as-is
 *                       - "/assets/..."            → returned as-is
 *                       - "avatars/<key>"          → resolved via avatars bucket
 *                       - "sports/<key>"           → resolved via discovery-images
 *                       - "<key>"                  → resolved via imageType bucket
 * @param imageType    Tells the resolver which bucket to use. Defaults to Unknown
 *                     (auto-detect). Pass an explicit ImageType for best performance.
 * @returns            A URL string safe to pass directly to an <img src=>.
 */
export function resolveImage(
  storagePath: string | null | undefined,
  imageType: ImageType = ImageType.Unknown
): string {
  const placeholder = PLACEHOLDER_REGISTRY[imageType];

  // ── 1. Empty / missing path → placeholder ─────────────────────────────────
  if (!storagePath || !storagePath.trim()) {
    return placeholder;
  }

  const raw = storagePath.trim();

  // ── 2. Already a full URL, data URI, or local asset → passthrough ─────────
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("/assets/") ||
    raw.startsWith("/")
  ) {
    return raw;
  }

  // ── 3. Cache hit ──────────────────────────────────────────────────────────
  const cacheKey = `${imageType}:${raw}`;
  if (urlCache.has(cacheKey)) {
    return urlCache.get(cacheKey)!;
  }

  // ── 4. Determine bucket ───────────────────────────────────────────────────
  let bucket: string;
  let objectKey: string;

  if (imageType !== ImageType.Unknown) {
    // Caller knows the type — use the registry directly.
    bucket = BUCKET_REGISTRY[imageType];

    // If the stored path includes the bucket prefix, strip it.
    const bucketPrefix = bucket + "/";
    objectKey = raw.startsWith(bucketPrefix) ? raw.slice(bucketPrefix.length) : raw;
  } else {
    // Auto-detect: walk PREFIX_TO_BUCKET entries
    const matched = Object.entries(PREFIX_TO_BUCKET).find(([prefix]) =>
      raw.startsWith(prefix)
    );

    if (matched) {
      bucket = matched[1];
      objectKey = raw.slice(matched[0].length);
    } else {
      // Last resort: treat as a bare key in the first slash-delimited bucket
      const slashIdx = raw.indexOf("/");
      if (slashIdx !== -1) {
        bucket = raw.slice(0, slashIdx);
        objectKey = raw.slice(slashIdx + 1);
      } else {
        // Single segment with no slash — cannot determine bucket; return placeholder
        return placeholder;
      }
    }
  }

  // ── 4.5 Rewrite extensions for discovery images to .webp ──────────────────
  if (bucket === "discovery-images" && !objectKey.toLowerCase().endsWith(".webp")) {
    const extIdx = objectKey.lastIndexOf(".");
    if (extIdx !== -1) {
      objectKey = objectKey.slice(0, extIdx) + ".webp";
    } else {
      objectKey = objectKey + ".webp";
    }
  }

  // ── 5. Generate public URL ─────────────────────────────────────────────────
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectKey);
  const resolved = data.publicUrl || placeholder;

  urlCache.set(cacheKey, resolved);
  return resolved;
}

/**
 * Clear the internal URL cache.
 * Call after an image is replaced so the new version is picked up immediately.
 *
 * @param storagePath  Specific path to evict, or omit to clear everything.
 * @param imageType    Must match the type used when the entry was cached.
 */
export function evictImageCache(
  storagePath?: string,
  imageType: ImageType = ImageType.Unknown
): void {
  if (!storagePath) {
    urlCache.clear();
    return;
  }
  urlCache.delete(`${imageType}:${storagePath.trim()}`);
}

/**
 * Return the placeholder URL for a given image type.
 * Useful when a component needs the placeholder before it knows whether
 * a real image exists.
 */
export function getPlaceholder(imageType: ImageType = ImageType.Unknown): string {
  return PLACEHOLDER_REGISTRY[imageType];
}
