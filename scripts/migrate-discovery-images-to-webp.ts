/**
 * migrate-discovery-images-to-webp.ts
 *
 * Standalone one-time migration script that:
 * 1. Fetches all discovery items from the database.
 * 2. Checks each item's `cover_image_url`.
 * 3. Skips items that are NULL, data URIs, full external URLs, or already `.webp`.
 * 4. Downloads JPG/PNG/AVIF cover images from `discovery-images` bucket.
 * 5. Processes the image using the SAME dimensions/format/quality/crop as
 *    newly uploaded images (using `sharp` matching the preset config of
 *    `ImagePresets.DiscoveryCover`: 800x500 WebP).
 * 6. Uploads the processed WebP back to the same relative path structure but with .webp extension.
 * 7. Updates the `discovery_items` record.
 * 8. Deletes the old file only after successful upload & database update.
 *
 * Require explicit environment variable `RUN_DISCOVERY_IMAGE_MIGRATION=true` to execute.
 */

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. Env check & Bootstrap
// ---------------------------------------------------------------------------
if (process.env.RUN_DISCOVERY_IMAGE_MIGRATION !== "true") {
  console.log("❌ Migration aborted.");
  console.log("To run this migration, you must explicitly set the RUN_DISCOVERY_IMAGE_MIGRATION environment variable to 'true'.");
  console.log("Example:");
  console.log("  RUN_DISCOVERY_IMAGE_MIGRATION=true npx tsx scripts/migrate-discovery-images-to-webp.ts");
  process.exit(0);
}

// Load .env from repo root if running locally
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUCKET = "discovery-images";

// ---------------------------------------------------------------------------
// 2. Image Processing Logic (Mirrors ImagePresets.DiscoveryCover: 800x500 WebP)
// ---------------------------------------------------------------------------
const TARGET_WIDTH = 800;
const TARGET_HEIGHT = 500;
const WEBP_QUALITY = 82;

async function processImageToWebP(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(TARGET_WIDTH, TARGET_HEIGHT, {
      fit: "cover",
      position: "center"
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// 3. Migration Action
// ---------------------------------------------------------------------------
interface MigrationResult {
  itemId: string;
  status: "migrated" | "already_webp" | "no_avatar" | "failed" | "skipped_external";
  error?: string;
}

async function migrateItem(itemId: string, coverImageUrl: string, category: string, title: string): Promise<MigrationResult> {
  // Safe normalization of prefix (if the path starts with bucket name, e.g. "discovery-images/...")
  const prefix = `${BUCKET}/`;
  let objectKey = coverImageUrl.startsWith(prefix) 
    ? coverImageUrl.slice(prefix.length) 
    : coverImageUrl;

  // Cleanup starting slash if any
  if (objectKey.startsWith("/")) {
    objectKey = objectKey.slice(1);
  }

  // Idempotency: Skip if already WebP
  if (objectKey.toLowerCase().endsWith(".webp")) {
    return { itemId, status: "already_webp" };
  }

  // Skip external URLs, data URIs, or local assets
  if (
    coverImageUrl.startsWith("http://") ||
    coverImageUrl.startsWith("https://") ||
    coverImageUrl.startsWith("data:") ||
    coverImageUrl.startsWith("/assets/") ||
    coverImageUrl.startsWith("assets/")
  ) {
    return { itemId, status: "skipped_external" };
  }

  console.log(`Processing: ${category} / ${title}`);
  console.log(`  Old path: ${objectKey}`);

  try {
    // 1. Download original
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(objectKey);

    if (downloadError || !downloadData) {
      if (downloadError?.message?.includes("Object not found") || downloadError?.message?.includes("Not Found")) {
        // Clear database reference since storage object is missing
        console.warn(`  ⚠️ [${itemId}] Original image missing from storage. Clearing db column.`);
        const { error: clearErr } = await supabase
          .from("discovery_items")
          .update({ cover_image_url: null })
          .eq("id", itemId);

        if (clearErr) {
          console.error(`  ❌ [${itemId}] Failed to clear db reference: ${clearErr.message}`);
        }
        return { itemId, status: "no_avatar", error: "Original file missing" };
      }
      return {
        itemId,
        status: "failed",
        error: `Download failed: ${downloadError?.message ?? "no data"}`
      };
    }

    const inputBuffer = Buffer.from(await downloadData.arrayBuffer());

    // 2. Process / Resize / Convert to WebP
    const webpBuffer = await processImageToWebP(inputBuffer);

    // 3. Upload new WebP
    // Replace extension of old object path with .webp
    const extIdx = objectKey.lastIndexOf(".");
    const newObjectKey = extIdx !== -1 
      ? objectKey.slice(0, extIdx) + ".webp" 
      : objectKey + ".webp";

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newObjectKey, webpBuffer, {
        contentType: "image/webp",
        upsert: true
      });

    if (uploadError) {
      return { itemId, status: "failed", error: `Upload failed: ${uploadError.message}` };
    }

    // 4. Update Database
    // Storing relative path matching retrieval requirements
    const newDbPath = newObjectKey; 
    const { error: dbError } = await supabase
      .from("discovery_items")
      .update({ cover_image_url: newDbPath })
      .eq("id", itemId);

    if (dbError) {
      return { itemId, status: "failed", error: `DB Update failed: ${dbError.message}` };
    }

    console.log(`  Migrated: ${objectKey} -> ${newObjectKey}`);

    // 5. Delete old file only after successful upload & database update
    if (objectKey !== newObjectKey) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([objectKey]);

      if (deleteError) {
        console.warn(`  ⚠️ [${itemId}] Old file deletion failed (non-fatal): ${deleteError.message}`);
      } else {
        console.log(`  🗑️ Deleted old file: ${objectKey}`);
      }
    }

    return { itemId, status: "migrated" };
  } catch (err: any) {
    return {
      itemId,
      status: "failed",
      error: err?.message ?? String(err)
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Main script loop
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀 Starting Discovery images to WebP migration...\n");

  const { data: items, error: fetchError } = await supabase
    .from("discovery_items")
    .select("id, cover_image_url, category, title");

  if (fetchError || !items) {
    console.error("❌ Failed to fetch items from database:", fetchError?.message);
    process.exit(1);
  }

  console.log(`Found ${items.length} Discovery items to inspect.\n`);

  const counters = {
    processed: 0,
    migrated: 0,
    already_webp: 0,
    missing: 0,
    failed: 0,
    skipped_external: 0
  };

  for (const item of items) {
    counters.processed++;

    if (!item.cover_image_url) {
      counters.missing++;
      console.log(`  ⬜ [${item.id}] No image URL - skipping`);
      continue;
    }

    const result = await migrateItem(item.id, item.cover_image_url, item.category, item.title);

    switch (result.status) {
      case "migrated":
        counters.migrated++;
        break;
      case "already_webp":
        counters.already_webp++;
        break;
      case "no_avatar":
        counters.missing++;
        break;
      case "skipped_external":
        counters.skipped_external++;
        break;
      case "failed":
        counters.failed++;
        console.error(`  ❌ [${item.id}] FAILED: ${result.error}`);
        break;
    }
  }

  console.log("\n─────────────────────────────────────");
  console.log("Migration complete");
  console.log("─────────────────────────────────────");
  console.log(`Processed:        ${counters.processed}`);
  console.log(`Migrated:         ${counters.migrated}`);
  console.log(`Already WebP:     ${counters.already_webp}`);
  console.log(`External Skips:   ${counters.skipped_external}`);
  console.log(`Missing/Cleared:  ${counters.missing}`);
  console.log(`Failed:           ${counters.failed}`);
  console.log("─────────────────────────────────────\n");

  if (counters.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Unhandled migration error:", err);
  process.exit(1);
});
