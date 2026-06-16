import React from "react";

export const FeedHeader: React.FC = () => {
  return (
    <div className="px-6 pt-4 pb-2 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C] animate-pulse shadow-[0_0_8px_rgba(255,107,44,0.8)]" />
        <span className="text-[10px] font-sans font-black uppercase tracking-[0.18em] text-zinc-500">
          SPONTANEOUS FEED
        </span>
      </div>
    </div>
  );
};
