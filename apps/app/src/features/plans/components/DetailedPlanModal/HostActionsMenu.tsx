import React from "react";
import { Edit, Crown, Trash } from "lucide-react";

interface HostActionsMenuProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  onEditPlan?: (planId: string) => void;
  planId: string;
  planStatus: string;
  setShowChangeHostList: (val: boolean) => void;
  setShowDitchConfirm: (val: boolean) => void;
}

export const HostActionsMenu: React.FC<HostActionsMenuProps> = ({
  isMenuOpen,
  setIsMenuOpen,
  onEditPlan,
  planId,
  planStatus,
  setShowChangeHostList,
  setShowDitchConfirm,
}) => {
  if (!isMenuOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
      <div className="absolute right-0 mt-2 w-44 bg-[#0F0F13]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1 z-40 animate-fade-in origin-top-right text-left">
        {planStatus === "active" && (
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onEditPlan?.(planId);
            }}
            className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
          >
            <Edit className="w-4 h-4 text-[#FF6B2C]" />
            <span>Edit Plan</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            setShowChangeHostList(true);
          }}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
        >
          <Crown className="w-4 h-4 text-[#FF6B2C]" />
          <span>Transfer Host</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(false);
            setShowDitchConfirm(true);
          }}
          className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
        >
          <Trash className="w-4 h-4 text-red-500" />
          <span>End Plan</span>
        </button>
      </div>
    </>
  );
};
