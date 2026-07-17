import React from "react";
import { ChevronLeft, MoreVertical, Info } from "lucide-react";
import { UserAvatar } from "../../../../../IMGfromDB/UserAvatar";

interface HeroHeaderProps {
  title: string;
  creatorName?: string;
  creatorAvatar?: string;
  onClose: () => void;
  isHost: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  hostMenu: React.ReactNode;
  isInfoOpen: boolean;
  onToggleInfo: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  title,
  creatorName,
  creatorAvatar,
  onClose,
  isHost,
  isMenuOpen,
  setIsMenuOpen,
  hostMenu,
  isInfoOpen,
  onToggleInfo,
}) => {
  return (
    <div
      id="immersive-plan-glass-header"
      className="absolute top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-lg pb-3 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] rounded-b-2xl"
    >
      <div className="w-full flex flex-col items-center relative px-4">
        {/* Back button — top-left inside the header */}
        <button
          id="immersive-plan-back-btn"
          type="button"
          onClick={onClose}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer pointer-events-auto"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right action button(s) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto">
          {isHost && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition duration-200 cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {hostMenu}
            </div>
          )}
          <button
            id="immersive-plan-info-btn"
            type="button"
            onClick={onToggleInfo}
            className={`w-9 h-9 rounded-full backdrop-blur-sm border flex items-center justify-center active:scale-95 transition duration-200 cursor-pointer ${
              isInfoOpen
                ? "bg-white/20 border-white/20 text-white"
                : "bg-white/10 border-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>

        {/* Centered Title */}
        <h1 className="text-[17px] font-bold text-white tracking-[0.08em] uppercase leading-tight select-text text-center px-10">
          {title}
        </h1>

        {/* Centered Hosted By */}
        <div className="flex items-center gap-1.5 mt-1">
          <UserAvatar src={creatorAvatar} alt={creatorName || "Host"} size="w-4 h-4" className="border border-white/10" />
          <span id="immersive-host-attribution" className="text-[12px] text-white/60 font-medium select-none">
            Hosted by <span className="text-white/90 font-semibold">{creatorName || "Host"}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
