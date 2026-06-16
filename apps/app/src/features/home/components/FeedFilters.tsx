import React, { useState } from "react";

export interface FeedFiltersProps {
  activeFilter?: "spontaneous" | "planned";
  onChangeFilter?: (filter: "spontaneous" | "planned") => void;
}

export const FeedFilters: React.FC<FeedFiltersProps> = ({
  activeFilter: propsActiveFilter,
  onChangeFilter,
}) => {
  const [localFilter, setLocalFilter] = useState<"spontaneous" | "planned">("spontaneous");
  const currentFilter = propsActiveFilter || localFilter;

  const handleToggle = (filter: "spontaneous" | "planned") => {
    setLocalFilter(filter);
    if (onChangeFilter) {
      onChangeFilter(filter);
    }
  };

  return (
    <div className="px-6 py-2 shrink-0 select-none">
      <div className="w-full bg-[#121215] p-1 rounded-xl border border-white/[0.04] flex items-center relative shadow-inner">
        <button
          type="button"
          onClick={() => handleToggle("spontaneous")}
          className={`flex-1 text-center py-2 text-[10.5px] font-sans font-black uppercase tracking-wider rounded-lg transition-all duration-300 relative z-10 ${
            currentFilter === "spontaneous"
              ? "text-[#FF6B2C]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Spontaneous
        </button>
        <button
          type="button"
          onClick={() => handleToggle("planned")}
          className={`flex-1 text-center py-2 text-[10.5px] font-sans font-black uppercase tracking-wider rounded-lg transition-all duration-300 relative z-10 ${
            currentFilter === "planned"
              ? "text-[#FF6B2C]"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Planned
        </button>

        {/* Sliding background capsule */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/[0.035] border border-white/[0.05] rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            currentFilter === "spontaneous"
              ? "left-1 translate-x-0"
              : "left-1 translate-x-[calc(100%+8px)]"
          }`}
        />
      </div>
    </div>
  );
};
