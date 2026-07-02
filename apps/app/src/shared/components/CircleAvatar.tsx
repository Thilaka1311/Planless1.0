import React from "react";
import defaultGroup from "../../assets/default_group.png";

interface CircleAvatarProps {
  /** The circle's group photo or cover image. Empty string or null -> default group icon. */
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

/**
 * CircleAvatar
 *
 * Single source of truth for all circle avatar/group photo rendering in Planless.
 * Falls back to the Planless default group icon when:
 *  - src is empty / null / undefined
 *  - the image fails to load (broken URL, 404, etc.)
 */
export const CircleAvatar: React.FC<CircleAvatarProps> = ({
  src,
  alt = "Circle",
  size = "w-8 h-8",
  className = "",
  onClick,
  style,
}) => {
  const [imgSrc, setImgSrc] = React.useState<string>(
    src && src.trim() ? src : defaultGroup
  );

  // Sync when src prop changes (e.g. after upload or edit)
  React.useEffect(() => {
    setImgSrc(src && src.trim() ? src : defaultGroup);
  }, [src]);

  const handleError = () => {
    setImgSrc(defaultGroup);
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

export default CircleAvatar;
