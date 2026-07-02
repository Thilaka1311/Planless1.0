import React from "react";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Plan } from "../../../../core/types";
import { getPlanCover } from "../../config/planCoverImages";
import { UserAvatar } from "../../../../shared/components/UserAvatar";
import { HostActionsMenu } from "./HostActionsMenu";

interface HeaderProps {
  selectedPlan: Plan;
  onClose: () => void;
  isHost: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  onEditPlan?: (planId: string) => void;
  setShowChangeHostList: (val: boolean) => void;
  setShowDitchConfirm: (val: boolean) => void;
  isParticipant: boolean;
}

const getPlanActivityIcon = (plan: any) => {
  const category = (plan.category || 'sports').toLowerCase();
  const subcategory = (plan.subcategory || '').toLowerCase();

  if (category === 'sports' || category === 'football' || category === 'badminton') {
    if (subcategory.includes('badminton') || subcategory.includes('shuttle')) return '🏸';
    if (subcategory.includes('football') || subcategory.includes('soccer')) return '⚽';
    if (subcategory.includes('basketball')) return '🏀';
    if (subcategory.includes('tennis')) return '🎾';
    if (subcategory.includes('volleyball')) return '🏐';
    if (subcategory.includes('cricket')) return '🏏';
    if (category === 'badminton') return '🏸';
    if (category === 'football') return '⚽';
    return '⚽';
  }
  if (category === 'movies' || category === 'cinema') return '🎬';
  if (category === 'dining' || category === 'restaurants' || category === 'restaurant' || category === 'cafe') return '🍽️';
  return '⚡';
};

export const Header: React.FC<HeaderProps> = ({
  selectedPlan,
  onClose,
  isHost,
  isMenuOpen,
  setIsMenuOpen,
  onEditPlan,
  setShowChangeHostList,
  setShowDitchConfirm,
  isParticipant,
}) => {
  return (
    <div
      id="immersive-plan-hero-container"
      className={`relative w-full flex flex-col justify-end overflow-hidden flex-shrink-0 transition-all duration-300 ${isParticipant ? 'h-[190px]' : 'h-[250px]'}`}
    >
      {/* Full-bleed high contrast cover page image */}
      <img
        id="immersive-plan-hero-image"
        src={selectedPlan.coverImage || getPlanCover(selectedPlan.category, (selectedPlan as any).subcategory || (selectedPlan as any).sports_type)}
        alt={selectedPlan.title}
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
        referrerPolicy="no-referrer"
      />

      {/* Soft edge darkening filter gradations */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/45 to-transparent pointer-events-none z-0" />

      {/* Floating back button */}
      <button
        id="immersive-plan-back-btn"
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Host Actions Trigger Button */}
      {isHost && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/65 active:scale-95 transition duration-200 cursor-pointer"
            title="Host Actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <HostActionsMenu
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
            onEditPlan={onEditPlan}
            planId={selectedPlan.id}
            planStatus={selectedPlan.status}
            setShowChangeHostList={setShowChangeHostList}
            setShowDitchConfirm={setShowDitchConfirm}
          />
        </div>
      )}

      {/* Hero Meta Info */}
      <div className="px-6 pb-4 z-10 w-full relative">
        <div className="flex items-center gap-2 mb-2">
          <span id="immersive-group-badge" className="bg-black/55 backdrop-blur-md px-4.5 py-1.5 rounded-full text-[11px] font-sans font-black text-white tracking-[0.16em] inline-flex items-center justify-center uppercase border border-white/[0.08] shadow-2xl select-none">
            {selectedPlan.circleName?.toUpperCase() || "PLANLESS CIRCLE"}
          </span>
          <div className="w-5 h-5 rounded-full bg-black/45 border border-white/10 flex items-center justify-center">
            <span className="text-[11px] leading-none select-none">{getPlanActivityIcon(selectedPlan)}</span>
          </div>
        </div>

        <h1 id="immersive-plan-title" className="font-sans font-black text-[26px] text-white tracking-tight leading-none mb-2 select-text">
          {selectedPlan.title}
        </h1>

        {/* Hosted By Mini Badge */}
        <div className="flex items-center gap-2 mt-1">
          <UserAvatar
            src={selectedPlan.creatorAvatar}
            alt={selectedPlan.creatorName || "Host"}
            size="w-5 h-5"
            className="border border-white/10"
          />
          <span id="immersive-host-attribution" className="text-[11.5px] text-zinc-300 font-medium">
            Hosted by <strong className="text-white font-semibold">{selectedPlan.creatorName || "Host"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
