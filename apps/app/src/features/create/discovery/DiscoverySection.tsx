import React from "react";
import { DiscoverySection as DiscoverySectionType } from "../../../core/types/discovery";
import { DiscoveryCarousel } from "./DiscoveryCarousel";

interface DiscoverySectionProps {
  section: DiscoverySectionType;
  onItemSelect: (item: any) => void;
}

export const DiscoverySection: React.FC<DiscoverySectionProps> = ({ section, onItemSelect }) => {
  if (!section.items || section.items.length === 0) return null;

  // Derive title color from the section's category (new normalized schema)
  const category = section.category?.toUpperCase();
  let titleColor = "text-[#ff8b66]";
  if (category === "MOVIES") {
    titleColor = "text-blue-400";
  } else if (category === "SPORTS") {
    titleColor = "text-emerald-400";
  } else if (category === "DINING") {
    titleColor = "text-orange-400";
  }

  return (
    <div className="space-y-3 pt-1">
      <h3 className={`text-[11.5px] font-mono uppercase tracking-widest ${titleColor} font-bold`}>
        {section.title}
      </h3>
      <DiscoveryCarousel items={section.items} onItemSelect={onItemSelect} />
    </div>
  );
};
