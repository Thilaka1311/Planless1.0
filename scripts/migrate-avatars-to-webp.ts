/**
 * migrate-avatars-to-webp.ts
 *
 * One-time migration script: converts all existing user profile pictures
 * stored in Supabase Storage to WebP (512×512) and updates the database.
 *
 * Usage:
 *   npx tsx scripts/migrate-avatars-to-webp.ts
 *
 * Requirements:
 *   npm install --save-dev sharp @supabase/supabase-js   (if not already present)
 *
 * Environment variables (from .env or shell):
 *   VITE_SUPABASE_URL          — Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY  — Service-role key (bypasses RLS)
 *
 * Safety guarantees:
 *   - Idempotent: skips users already pointing at avatar.webp
 *   - Never deletes the old file until the new upload AND DB update both succeed
 *   - Logs and skips individual failures; never aborts the whole run
 */

import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. Bootstrap environment
// ---------------------------------------------------------------------------

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
  console.error(
    "❌  Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

// Use service-role client so we can read all rows and bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const BUCKET = "avatars";
const TARGET_FILENAME = "avatar.webp";
const WEBP_QUALITY = 82;
const TARGET_SIZE = 512;

// ---------------------------------------------------------------------------
// 2. Image conversion — same settings as the app upload pipeline
// ---------------------------------------------------------------------------

async function convertToWebP(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: "cover",        // centre-crop, same as the canvas approach in the app
      position: "center",
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// ---------------------------------------------------------------------------
// 3. Per-user migration
// ---------------------------------------------------------------------------

interface MigrationResult {
  userId: string;
  status: "migrated" | "already_webp" | "no_avatar" | "failed";
  error?: string;
}

async function migrateUser(userId: string, profilePhotoPath: string): Promise<MigrationResult> {
  // 3a. Skip if already at canonical path
  if (profilePhotoPath.endsWith(TARGET_FILENAME)) {
    return { userId, status: "already_webp" };
  }

  // 3b. Skip inline data URIs (SVG placeholders, base64 images) — not in Storage
  if (profilePhotoPath.startsWith("data:")) {
    return { userId, status: "no_avatar" };
  }

  // 3c. Skip full public URLs (http:// / https://) — these aren't storage object keys
  if (profilePhotoPath.startsWith("http://") || profilePhotoPath.startsWith("https://")) {
    return { userId, status: "no_avatar" };
  }

  try {
    // profilePhotoPath is stored as  "<bucket>/<object_key>"
    // e.g. "avatars/some-uuid/old-avatar.jpg"
    // Strip the bucket prefix to get the storage object key.
    const objectKey = profilePhotoPath.startsWith(`${BUCKET}/`)
      ? profilePhotoPath.slice(BUCKET.length + 1)
      : profilePhotoPath;

    // 3d. Download the old image
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(BUCKET)
      .download(objectKey);

    if (downloadError || !downloadData) {
      // Object no longer exists in storage — treat as no real avatar
      if (downloadError?.message?.includes("Object not found") ||
          downloadError?.message?.includes("Not Found")) {
        return { userId, status: "no_avatar" };
      }
      return {
        userId,
        status: "failed",
        error: `Download failed: ${downloadError?.message ?? "no data"}`,
      };
    }

    const inputBuffer = Buffer.from(await downloadData.arrayBuffer());

    // 3c. Convert to WebP
    const webpBuffer = await convertToWebP(inputBuffer);

    // 3d. Upload to canonical path
    const newObjectKey = `${userId}/${TARGET_FILENAME}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newObjectKey, webpBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return {
        userId,
        status: "failed",
        error: `Upload failed: ${uploadError.message}`,
      };
    }

    // 3e. Update the database record — ONLY after successful upload
    const newProfilePhotoPath = `${BUCKET}/${newObjectKey}`;
    const { error: dbError } = await supabase
      .from("users")
      .update({ profile_photo_path: newProfilePhotoPath })
      .eq("id", userId);

    if (dbError) {
      return {
        userId,
        status: "failed",
        error: `DB update failed: ${dbError.message}`,
      };
    }

    // 3f. Delete old file ONLY after both upload + DB update succeeded
    //     (skip deletion if the old path == new path, which shouldn't happen here)
    if (objectKey !== newObjectKey) {
      const { error: deleteError } = await supabase.storage
        .from(BUCKET)
        .remove([objectKey]);

      if (deleteError) {
        // Non-fatal: migration succeeded, old file lingers but that's OK
        console.warn(
          `  ⚠️  [${userId}] Old file deletion failed (non-fatal): ${deleteError.message}`
        );
      }
    }

    return { userId, status: "migrated" };
  } catch (err: any) {
    return {
      userId,
      status: "failed",
      error: err?.message ?? String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// 4. Main — fetch all users and process sequentially
// ---------------------------------------------------------------------------

async function main() {
  console.log("🚀  Starting avatar → WebP migration...\n");

  // Fetch all users with their profile photo path
  const { data: users, error: fetchError } = await supabase
    .from("users")
    .select("id, profile_photo_path");

  if (fetchError || !users) {
    console.error("❌  Failed to fetch users:", fetchError?.message);
    process.exit(1);
  }

  console.log(`Found ${users.length} users to inspect.\n`);

  const counters = {
    processed: 0,
    migrated: 0,
    already_webp: 0,
    no_avatar: 0,
    failed: 0,
  };

  for (const user of users) {
    counters.processed++;

    // Skip users with no avatar
    if (!user.profile_photo_path) {
      counters.no_avatar++;
      console.log(`  ⬜ [${user.id}] No avatar — skipping`);
      continue;
    }

    // Data URI placeholder SVG: clear the column so the app renders its
    // generated avatar instead of trying to load a broken path
    if (user.profile_photo_path.startsWith("data:")) {
      counters.no_avatar++;
      const { error: clearErr } = await supabase
        .from("users")
        .update({ profile_photo_path: null })
        .eq("id", user.id);
      if (clearErr) {
        console.warn(`  ⚠️  [${user.id}] SVG placeholder — failed to clear column: ${clearErr.message}`);
      } else {
        console.log(`  🗑️  [${user.id}] SVG placeholder cleared (column set to null)`);
      }
      continue;
    }

    const result = await migrateUser(user.id, user.profile_photo_path);

    switch (result.status) {
      case "migrated":
        counters.migrated++;
        console.log(`  ✅ [${user.id}] Migrated successfully`);
        break;
      case "already_webp":
        counters.already_webp++;
        console.log(`  ✓  [${user.id}] Already WebP — skipping`);
        break;
      case "no_avatar":
        counters.no_avatar++;
        console.log(`  ⬜ [${user.id}] External/placeholder path — skipping`);
        break;
      case "failed":
        counters.failed++;
        console.error(`  ❌ [${user.id}] FAILED: ${result.error}`);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Summary
  // ---------------------------------------------------------------------------
  console.log("\n─────────────────────────────────────");
  console.log("Migration complete");
  console.log("─────────────────────────────────────");
  console.log(`Processed:    ${counters.processed}`);
  console.log(`Migrated:     ${counters.migrated}`);
  console.log(`Already WebP: ${counters.already_webp}`);
  console.log(`No Avatar:    ${counters.no_avatar}`);
  console.log(`Failed:       ${counters.failed}`);
  console.log("─────────────────────────────────────\n");

  if (counters.failed > 0) {
    process.exit(1); // Signal partial failure to CI / callers
  }
}

main().catch((err) => {
  console.error("❌  Unhandled error:", err);
  process.exit(1);
});
