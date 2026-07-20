/**
 * imagePipeline.ts
 *
 * Planless shared image processing pipeline.
 *
 * Every image upload in the application — avatars, discovery covers, circles,
 * event banners, venues, etc. — should be processed through this module before
 * being sent to Supabase Storage.
 *
 * Usage:
 *   import { processImage, ImagePresets } from "@/shared/imaging/imagePipeline";
 *   const blob = await processImage(file, ImagePresets.DiscoveryCover);
 *
 * To add a new upload context:
 *   1. Add a new entry to ImagePresets with the desired dimensions / quality.
 *   2. Call processImage(file, ImagePresets.YourNew) in the upload hook/service.
 *   No changes to this file's internals are required.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Output image format.
 * Only "webp" is supported today.  Adding "avif" in the future only requires
 * extending this union and updating the canvas.toBlob call below — no caller
 * changes needed.
 */
export type ImageFormat = "webp";

/**
 * How the source image should be mapped onto the target canvas.
 *
 * cover  — center-crop to exactly fill width × height (default)
 * contain — letterbox/pillarbox to fit within width × height
 */
export type ImageFit = "cover" | "contain";

/** Full set of options accepted by processImage(). */
export interface ImageProcessingOptions {
  /** Target width in px */
  width: number;
  /** Target height in px */
  height: number;
  /** Output format (default: "webp") */
  format?: ImageFormat;
  /**
   * Compression quality 0–1.
   * 0.82 is a well-calibrated default that balances visual fidelity and file size.
   */
  quality?: number;
  /** How the source is mapped to the canvas (default: "cover") */
  fit?: ImageFit;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

/**
 * Canonical image presets for every upload context in Planless.
 *
 * Adding a new upload type:
 *   1. Add a new key here with the target dimensions.
 *   2. Reference it in the relevant upload hook / service.
 */
export const ImagePresets = {
  /**
   * User profile avatar.
   * Square crop, optimized for small circular display across the app.
   */
  Avatar: {
    width: 512,
    height: 512,
    format: "webp" as ImageFormat,
    quality: 0.82,
    fit: "cover" as ImageFit,
  },

  /**
   * Discovery card cover image.
   * 16:10 landscape, 2x retina density relative to card render size.
   * Handles both the thumbnail card (230x310 portrait letterbox) and the
   * full-width hero in the EditCard sheet (100vw x 208px).
   */
  DiscoveryCover: {
    width: 800,
    height: 500,
    format: "webp" as ImageFormat,
    quality: 0.82,
    fit: "cover" as ImageFit,
  },
} as const;

// ─── Core processor ───────────────────────────────────────────────────────────

/**
 * Resize and convert any image file to the target format using the Canvas API.
 *
 * @param source  The raw image File or Blob uploaded by the user.
 * @param options Processing options — use an ImagePresets entry for consistency.
 * @returns       A processed Blob ready to upload to Supabase Storage.
 */
export function processImage(
  source: File | Blob,
  options: ImageProcessingOptions
): Promise<Blob> {
  const {
    width,
    height,
    format = "webp",
    quality = 0.82,
    fit = "cover",
  } = options;

  const mimeType = `image/${format}`;

  return new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("FileReader failed to read the image."));

    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("FileReader produced an empty result."));
        return;
      }

      const img = new Image();

      img.onerror = () => reject(new Error("Failed to decode the image."));

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to obtain a Canvas 2D rendering context."));
          return;
        }

        if (fit === "cover") {
          // Center-crop: fill the entire canvas, cropping excess edges
          const srcAspect = img.width / img.height;
          const dstAspect = width / height;

          let srcX = 0;
          let srcY = 0;
          let srcW = img.width;
          let srcH = img.height;

          if (srcAspect > dstAspect) {
            // Source is wider than destination — crop left/right
            srcW = Math.round(img.height * dstAspect);
            srcX = Math.round((img.width - srcW) / 2);
          } else {
            // Source is taller than destination — crop top/bottom
            srcH = Math.round(img.width / dstAspect);
            srcY = Math.round((img.height - srcH) / 2);
          }

          ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);
        } else {
          // Contain: letterbox / pillarbox — fit within canvas without cropping
          const scale = Math.min(width / img.width, height / img.height);
          const dstW = Math.round(img.width * scale);
          const dstH = Math.round(img.height * scale);
          const dstX = Math.round((width - dstW) / 2);
          const dstY = Math.round((height - dstH) / 2);

          ctx.fillStyle = "#000000";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, img.width, img.height, dstX, dstY, dstW, dstH);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error(`canvas.toBlob() returned null for format "${format}".`));
            }
          },
          mimeType,
          quality
        );
      };

      img.src = event.target.result as string;
    };

    reader.readAsDataURL(source);
  });
}

/**
 * Validate that a file is an accepted input image type before processing.
 * Returns null on success, or an error message string on failure.
 */
export function validateImageFile(file: File): string | null {
  const accepted = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/heic"];
  if (!accepted.includes(file.type)) {
    return "Unsupported file type. Please upload a JPG, PNG, WebP, or GIF image.";
  }
  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) {
    return `File too large. Maximum size is ${maxMB} MB.`;
  }
  return null;
}
