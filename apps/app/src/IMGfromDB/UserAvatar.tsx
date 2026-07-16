import React from "react";
import defaultAvatar from "../assets/default_avatar.png";
import { supabase } from "../lib/supabaseClient";

interface UserAvatarProps {
  /** The user's uploaded profile image URL. Empty string or null → default avatar. */
  src?: string | null;
  /** Alt text for accessibility */
  alt?: string;
  /** Tailwind size class, e.g. "w-8 h-8". Applied to the wrapping element. */
  size?: string;
  /** Additional classes to merge onto the <img> element */
  className?: string;
  /** onClick handler */
  onClick?: () => void;
  /** Custom style rules */
  style?: React.CSSProperties;
}

const urlCache = new Map<string, string>();

/**
 * UserAvatar
 *
 * Single source of truth for all user profile image rendering in Planless.
 * Falls back to the Planless default avatar when:
 *  - src is empty / null / undefined
 *  - the image fails to load (broken URL, 404, etc.)
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt = "User",
  size = "w-8 h-8",
  className = "",
  onClick,
  style,
 }) => {
  const resolveAvatarUrl = (rawSrc: string | null | undefined): string => {
    if (!rawSrc || !rawSrc.trim()) return defaultAvatar;
    if (urlCache.has(rawSrc)) return urlCache.get(rawSrc)!;

    // Check if it's already a full URL, data URI, or local asset path
    if (
      rawSrc.startsWith("http://") ||
      rawSrc.startsWith("https://") ||
      rawSrc.startsWith("data:") ||
      rawSrc.startsWith("/assets/") ||
      rawSrc.startsWith("/")
    ) {
      urlCache.set(rawSrc, rawSrc);
      return rawSrc;
    }

    // Resolve relative storage path from the avatars bucket using getPublicUrl
    const { data } = supabase.storage.from("avatars").getPublicUrl(rawSrc);
    const resolved = data.publicUrl || defaultAvatar;
    urlCache.set(rawSrc, resolved);
    return resolved;
  };

  const [imgSrc, setImgSrc] = React.useState<string>(() => resolveAvatarUrl(src));

  // Sync when src prop changes (e.g. after upload)
  React.useEffect(() => {
    setImgSrc(resolveAvatarUrl(src));
  }, [src]);

  const handleError = () => {
    if (src) {
      urlCache.set(src, defaultAvatar);
    }
    setImgSrc(defaultAvatar);
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      onClick={onClick}
      style={style}
      className={`${size} rounded-full object-cover flex-shrink-0 ${className}`}
      referrerPolicy="no-referrer"
      draggable={false}
    />
  );
};

export default UserAvatar;
