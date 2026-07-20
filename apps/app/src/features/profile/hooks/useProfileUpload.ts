import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";

export interface UseProfileUploadResult {
  uploading: boolean;
  uploadError: string | null;
  uploadImage: (file: File, userId: string) => Promise<string | null>;
}

export function useProfileUpload(): UseProfileUploadResult {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = async (file: File, userId: string): Promise<string | null> => {
    // 1. Validate File Types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported file type. Please upload a JPG, JPEG, PNG, or WEBP image.");
      return null;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 2. Compress and resize image to 512x512 using canvas & export as image/webp
      const blob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Failed to get canvas 2D context"));
              return;
            }

            // Crop to center square
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;

            ctx.drawImage(img, x, y, size, size, 0, 0, 512, 512);

            canvas.toBlob(
              (b) => {
                if (b) {
                  resolve(b);
                } else {
                  reject(new Error("Canvas toBlob failed"));
                }
              },
              "image/webp",
              0.82
            );
          };
          img.onerror = () => reject(new Error("Failed to load image for resizing"));
          if (event.target?.result) {
            img.src = event.target.result as string;
          } else {
            reject(new Error("File read result empty"));
          }
        };
        reader.onerror = () => reject(new Error("File reader error"));
        reader.readAsDataURL(file);
      });

      // 3. Upload to Supabase Storage as <user_uuid>/avatar.webp
      const bucketName = "avatars";
      const objectKey = `${userId}/avatar.webp`;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("[Avatar Upload Debug]", {
        authUserId: user?.id,
        uploadUserId: userId,
        bucket: bucketName,
        objectKey,
        fullStoragePath: `${bucketName}/${objectKey}`,
      });

      const { data, error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(objectKey, blob, {
          contentType: "image/webp",
          upsert: true,
        });

      console.log("[Avatar Upload Response]", {
        data,
        error: uploadErr,
      });

      if (uploadErr) {
        console.error("[Avatar Upload Error]", uploadErr);
        console.error(
          "[Avatar Upload Error JSON]",
          JSON.stringify(uploadErr, null, 2)
        );
      }

      if (uploadErr || !data) {
        throw new Error(uploadErr?.message || "Upload failed");
      }

      console.log("[Avatar Upload] Returning storage path:", `${bucketName}/${objectKey}`);
      // Return the full storage path format: <bucket>/<object_key>
      return `${bucketName}/${objectKey}`;
    } catch (err: any) {
      console.error("[useProfileUpload] Error uploading avatar:", err);
      setUploadError(err.message || "Failed to upload image. Please try again.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    uploadError,
    uploadImage,
  };
}
