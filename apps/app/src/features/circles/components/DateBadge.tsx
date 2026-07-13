import React, { useMemo } from "react";

export const DateBadge: React.FC = () => {
  const formattedSystemDate = useMemo(() => {
    const now = new Date();
    const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
    const month = now.toLocaleDateString("en-US", { month: "long" });
    const year = now.getFullYear();
    return `${weekday} ${month} ${year}`;
  }, []);

  return (
    <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/[0.06] text-[10px] font-mono tracking-wider font-extrabold text-zinc-400 shadow-md">
      {formattedSystemDate.toUpperCase()}
    </div>
  );
};
