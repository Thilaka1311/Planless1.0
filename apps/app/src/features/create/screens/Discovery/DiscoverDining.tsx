import React from "react";
import { ChevronLeft } from "lucide-react";
import { DiscoverySection as DiscoverySectionType, DiscoveryItem } from "../../../../core/types/discovery";
import { DiscoveryCard } from "./components/DiscoveryCard";

interface DiscoverDiningProps {
  sections: DiscoverySectionType[];
  isAdmin: boolean;
  onBack: () => void;
  onSelectDiscoveryItem: (item: DiscoveryItem) => void;
  onLongPressAdmin: (item: DiscoveryItem, config: any) => void;
}

export const DiscoverDining: React.FC<DiscoverDiningProps> = ({
  sections,
  isAdmin,
  onBack,
  onSelectDiscoveryItem,
  onLongPressAdmin,
}) => {
  // Filter sections that correspond to DINING category
  const diningSections = sections.filter(
    (s) => s.category?.toUpperCase() === "DINING"
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-y-auto no-scrollbar pb-24 text-left select-none" style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Header Bar */}
      <div className="w-full shrink-0 px-5 flex items-center bg-[#000000] border-b border-white/[0.08]" style={{ height: "72px" }}>
        <button
          type="button"
          onClick={onBack}
          className="mr-4 flex items-center justify-center text-white bg-none border-none cursor-pointer p-0"
          style={{ width: "24px", height: "24px" }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-base font-bold text-white tracking-tight">Dining Plan</h2>
      </div>

      {/* Grid Content */}
      <div className="px-6 py-6 flex-1">
        {diningSections.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No dining suggestions available.
          </div>
        ) : (
          <div className="space-y-8">
            {diningSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className="text-xs font-semibold text-white uppercase tracking-widest">
                  {section.title}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {section.items.map((item) => (
                    <DiscoveryCard
                      key={item.id}
                      item={item}
                      colorAccent="text-rose-500"
                      badgeBg="bg-rose-500/10 border-rose-500/20"
                      isAdmin={isAdmin}
                      onTap={() => onSelectDiscoveryItem(item)}
                      onLongPressAdmin={() => onLongPressAdmin(item, section)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
