import React from "react";
import { DiscoveryItem } from "../../../../core/types/discovery";
import { MoviePosterCard } from "./MoviePosterCard";
import { SportsCard } from "./SportsCard";
import { DiningCard } from "./DiningCard";
import { GenericDiscoveryCard } from "./GenericDiscoveryCard";

interface DiscoveryCarouselProps {
  items: DiscoveryItem[];
  onItemSelect: (item: DiscoveryItem) => void;
}

export const DiscoveryCarousel: React.FC<DiscoveryCarouselProps> = ({ items, onItemSelect }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3">
      {items.map((item) => {
        const key = item.id;
        const select = () => onItemSelect(item);
        // Dispatch to the correct card based on normalized category enum
        switch (item.category?.toUpperCase()) {
          case "MOVIES":
            return <MoviePosterCard key={key} item={item} onClick={select} />;
          case "SPORTS":
            return <SportsCard key={key} item={item} onClick={select} />;
          case "DINING":
            return <DiningCard key={key} item={item} onClick={select} />;
          default:
            return <GenericDiscoveryCard key={key} item={item} onClick={select} />;
        }
      })}
    </div>
  );
};
