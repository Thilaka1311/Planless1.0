import React from "react";
import { supabase } from "../lib/supabaseClient";

import placeholderCover from "../assets/placeholder.png";

interface DiscoveryImagesProps {
  /** The storage path or full URL of the cover image. */
  src?: string | null;
  /** Category to determine fallback covers */
  category?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Extra CSS styles */
  className?: string;
  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  style?: React.CSSProperties;
}

/**
 * DiscoveryImages
 *
 * Reusable component to render discovery cover images.
 * Resolves paths dynamically from the 'discovery-images' storage bucket.
 */
export const DiscoveryImages: React.FC<DiscoveryImagesProps> = ({
  src,
  category = "CUSTOM",
  alt = "Discovery Preview",
  className = "",
  onClick,
  style,
}) => {
  const getFallbackCover = (cat: string): string => {
    return placeholderCover;
  };

  const resolveImageUrl = (rawSrc: string | null | undefined): string => {
    if (!rawSrc || !rawSrc.trim()) {
      return getFallbackCover(category);
    }

    if (
      rawSrc.startsWith("http://") ||
      rawSrc.startsWith("https://") ||
      rawSrc.startsWith("data:") ||
      rawSrc.startsWith("/")
    ) {
      return rawSrc;
    }

    // Resolve relative path dynamically from the discovery-images bucket using getPublicUrl
    const { data } = supabase.storage.from("discovery-images").getPublicUrl(rawSrc);
    return data.publicUrl || getFallbackCover(category);
  };

  const [imgSrc, setImgSrc] = React.useState<string>(() => resolveImageUrl(src));

  React.useEffect(() => {
    setImgSrc(resolveImageUrl(src));
  }, [src, category]);

  const handleError = () => {
    setImgSrc(getFallbackCover(category));
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onClick={onClick}
      style={style}
      referrerPolicy="no-referrer"
    />
  );
};
