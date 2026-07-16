import React from "react";
import { MapPin } from "lucide-react";
import { DiscoveryItem } from "../../../../../core/types/discovery";
import { useLongPress } from "../../../../../shared/hooks/useLongPress";
import { DiscoveryImages } from "../../../../../IMGfromDB/DiscoveryImages";

interface DiscoveryCardProps {
  item: DiscoveryItem;
  colorAccent: string;
  badgeBg: string;
  isAdmin: boolean;
  onTap: () => void;
  onLongPressAdmin: () => void;
}

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  item,
  colorAccent,
  badgeBg,
  isAdmin,
  onTap,
  onLongPressAdmin,
}) => {
  const longPress = useLongPress(() => {
    if (isAdmin) onLongPressAdmin();
  }, { threshold: 500 });

  return (
    <div
      {...(isAdmin ? longPress : {})}
      onClick={onTap}
      className="w-[230px] h-[310px] shrink-0 rounded-3xl relative overflow-hidden bg-zinc-950 border border-white/[0.04] shadow-2xl flex flex-col justify-end p-5 cursor-pointer hover:border-white/10 transition-all duration-300 group select-none"
    >
      <DiscoveryImages
        src={item.cover_image_url}
        category={item.category}
        alt={item.title}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-[1.03] transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/50 to-transparent z-0" />



      {/* Content */}
      <div className="z-10 space-y-1.5 text-left">
        <h4 className="text-sm font-bold text-white leading-tight tracking-wide truncate">
          {item.title}
        </h4>
        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold tracking-wider">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate">{item.location || "TBD Location"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
