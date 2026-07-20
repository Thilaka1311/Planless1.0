import React from "react";
import { supabase } from "../../lib/supabaseClient";

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

  const getPlanImagesUrl = (rawSrc: string): string => {
    if (
      rawSrc.startsWith("http://") ||
      rawSrc.startsWith("https://") ||
      rawSrc.startsWith("data:") ||
      rawSrc.startsWith("/assets/") ||
      rawSrc.startsWith("assets/")
    ) {
      return rawSrc;
    }
    const cleanSrc = rawSrc.startsWith("/") ? rawSrc.substring(1) : rawSrc;
    return supabase.storage.from("plan-images").getPublicUrl(cleanSrc).data.publicUrl;
  };

  const getDiscoveryImagesUrl = (rawSrc: string): string => {
    if (
      rawSrc.startsWith("http://") ||
      rawSrc.startsWith("https://") ||
      rawSrc.startsWith("data:") ||
      rawSrc.startsWith("/assets/") ||
      rawSrc.startsWith("assets/")
    ) {
      return rawSrc;
    }
    const cleanSrc = rawSrc.startsWith("/") ? rawSrc.substring(1) : rawSrc;
    return supabase.storage.from("discovery-images").getPublicUrl(cleanSrc).data.publicUrl;
  };

  const [currentStep, setCurrentStep] = React.useState<"plan-images" | "discovery-images" | "placeholder">(() => {
    return (!src || !src.trim()) ? "placeholder" : "plan-images";
  });
  const [imgSrc, setImgSrc] = React.useState<string>(() => {
    if (!src || !src.trim()) {
      return getFallbackCover(category);
    }
    return getPlanImagesUrl(src);
  });

  React.useEffect(() => {
    if (!src || !src.trim()) {
      setCurrentStep("placeholder");
      setImgSrc(getFallbackCover(category));
    } else {
      setCurrentStep("plan-images");
      setImgSrc(getPlanImagesUrl(src));
    }
  }, [src, category]);

  const handleError = () => {
    if (!src || !src.trim()) {
      return;
    }
    if (currentStep === "plan-images") {
      setCurrentStep("discovery-images");
      setImgSrc(getDiscoveryImagesUrl(src));
    } else if (currentStep === "discovery-images") {
      setCurrentStep("placeholder");
      setImgSrc(getFallbackCover(category));
    }
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
