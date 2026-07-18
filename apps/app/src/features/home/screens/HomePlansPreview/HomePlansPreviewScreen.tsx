import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  MoreVertical,
  Edit,
  Crown,
  Trash,
  Clock,
  Hourglass,
  MapPin,
  IndianRupee,
  ArrowLeft,
  UtensilsCrossed,
  Compass,
  Film,
  CalendarDays
} from "lucide-react";
import { UserProfile, Plan } from "../../../../core/types";
import { usePlansStore } from "../../../plans/state/PlansContext";
import { useLivePlan } from "../../../plans/hooks/useLivePlan";
import { useToast } from "../../../../shared/contexts/ToastContext";
import { normalizeStatus } from "../../../../../lib/participantStatus";
import { getPlanCover } from "../../../plans/config/planCoverImages";
import { formatPlanDate } from "../../../../../lib/mappers";
import { UserAvatar } from "../../../../IMGfromDB/UserAvatar";
import { DiscoveryImages } from "../../../../IMGfromDB/PlanImages";
import TeamOrganizerModal from "../../../../shared/modals/TeamOrganizerModal";
import PlanCompletionModal from "../../../../shared/modals/PlanCompletionModal";
import { ParticipantToggleBar } from "../../components/PlanDetailsCard";
import { useLiveCountdown, formatDeadlineFull, rsvpUrgencyStyles } from "../../components/PlanCard";
import { HeroHeader } from "../../../plans/screens/PlansScreen/Components/HeroHeader";
import { HeroMetadataCard } from "../../../plans/screens/PlansScreen/Components/HeroMetadataCard";
// ==========================================
// UTILITIES & CONSTANTS
// ==========================================
const getPlanDescription = (plan: Plan) => {
  const category = plan.category?.toLowerCase();
  const subcategory = (plan as any).subcategory?.toLowerCase();
  if (category === 'sports') {
    if (subcategory === 'badminton') {
      return 'Spontaneous 2v2 badminton sessions. Intermediate level. Bring your own rackets; shuttlecocks are provided. Play Arena booked for 2 hours.';
    }
    return 'Weekend casual sports match. Friendly rotation, clean play, and high energy. Quick rotation, clean tackles. Water provided.';
  }
  if (category === 'movies') {
    return 'Late-night high-framerate action in IMAX. Pre-booking seat rows F–H. Grab some popcorn, check in 15 mins early.';
  }
  if (category === 'dining') {
    return 'Secret speakeasy crawl or dining hangout with a live modern jazz quartet. Strict classy dress code. Good spirits, great company.';
  }
  return plan.description || 'A spontaneous, tightly coordinated hangout with friends and family. Quick response required for booking slots.';
};
export function hasUserEnteredDescription(plan: any): boolean {
  if (!plan) return false;
  const desc = (plan.description || "").trim();
  if (desc.length === 0) return false;
  if (
    desc.startsWith("Spontaneous coordination thread for") ||
    desc.startsWith("Coordination thread:")
  ) {
    return false;
  }
  const lowerDesc = desc.toLowerCase();
  if (
    lowerDesc.includes("spontaneous 2v2 badminton sessions") ||
    lowerDesc.includes("spontaneous 2v2 badminton session") ||
    lowerDesc.includes("weekly 5v5 turf action") ||
    lowerDesc.includes("watching the sci-fi premier together") ||
    lowerDesc.includes("watching the sci-fi premiere together") ||
    lowerDesc.includes("secret basement speakeasy crawl") ||
    lowerDesc.includes("weekend casual sports match") ||
    lowerDesc.includes("late-night high-framerate action in imax") ||
    lowerDesc.includes("secret speakeasy crawl or dining hangout") ||
    lowerDesc.includes("a spontaneous, tightly coordinated hangout") ||
    lowerDesc.includes("spontaneous squad gathering. casual chit-chat and good food")
  ) {
    return false;
  }
  return true;
}
function PlanCategoryIcon({ plan }: { plan: any }) {
  const category = (plan.category || '').toLowerCase();
  if (category === 'movies' || category === 'cinema') {
    return <Film className="w-3 h-3 text-violet-400" strokeWidth={2} />;
  }
  if (category === 'dining' || category === 'restaurants' || category === 'restaurant' || category === 'cafe') {
    return <UtensilsCrossed className="w-3 h-3 text-rose-400" strokeWidth={2} />;
  }
  if (category === 'sports' || category === 'football' || category === 'badminton') {
    return <Compass className="w-3 h-3 text-emerald-400" strokeWidth={2} />;
  }
  return <CalendarDays className="w-3 h-3 text-zinc-400" strokeWidth={2} />;
}


// ==========================================
// SUB-COMPONENTS
// ==========================================
function LeaveConfirmDialog({
  showLeaveConfirm,
  setShowLeaveConfirm,
  handleSkipConfirm,
  isLeaving,
}: {
  showLeaveConfirm: boolean;
  setShowLeaveConfirm: (val: boolean) => void;
  handleSkipConfirm: () => void;
  isLeaving: boolean;
}) {
  if (!showLeaveConfirm) return null;
  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-50 animate-fade-in text-center">
      <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
        <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Ditch this plan?</h3>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">You will lose your confirmed spot.</p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(false)}
            className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSkipConfirm}
            disabled={isLeaving}
            className="flex-1 py-2.5 rounded-xl bg-[#ff5e3a] hover:bg-[#ff4e2a] text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(255,94,58,0.2)] disabled:opacity-40"
          >
            {isLeaving ? "Ditching…" : "Ditch Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
function DitchConfirmDialog({
  showDitchConfirm,
  setShowDitchConfirm,
  handleDitchConfirm,
  isDitching,
}: {
  showDitchConfirm: boolean;
  setShowDitchConfirm: (val: boolean) => void;
  handleDitchConfirm: () => void;
  isDitching: boolean;
}) {
  if (!showDitchConfirm) return null;
  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-50 animate-fade-in text-center">
      <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
        <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Cancel Plan?</h3>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">This will permanently close the plan for all participants.</p>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowDitchConfirm(false)}
            className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDitchConfirm}
            disabled={isDitching}
            className="flex-1 py-2.5 rounded-xl bg-rose-655 hover:bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(239,68,68,0.2)] disabled:opacity-40"
          >
            {isDitching ? "Cancelling…" : "Cancel Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
function RemoveConfirmDialog({
  userToRemove,
  setUserToRemove,
  handleRemoveParticipant,
  isRemoving,
}: {
  userToRemove: { userId: string; name: string } | null;
  setUserToRemove: (user: { userId: string; name: string } | null) => void;
  handleRemoveParticipant: (userId: string, name: string) => void;
  isRemoving: boolean;
}) {
  if (!userToRemove) return null;
  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-[120] animate-fade-in text-center">
      <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
        <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Remove participant from this plan?</h3>
        <div className="space-y-3.5 text-center font-sans text-[11px] text-zinc-400">
          <p className="font-semibold text-zinc-350">They will lose access to this plan.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setUserToRemove(null)}
            className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleRemoveParticipant(userToRemove.userId, userToRemove.name)}
            disabled={isRemoving}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}
function ChangeHostDialog({
  showChangeHostList,
  setShowChangeHostList,
  eligibleParticipants,
  selectedNewHost,
  setSelectedNewHost,
  handleChangeHostConfirm,
  isChangingHost,
}: {
  showChangeHostList: boolean;
  setShowChangeHostList: (val: boolean) => void;
  eligibleParticipants: any[];
  selectedNewHost: { userId: string; name: string } | null;
  setSelectedNewHost: (host: { userId: string; name: string } | null) => void;
  handleChangeHostConfirm: () => void;
  isChangingHost: boolean;
}) {
  if (!showChangeHostList) return null;
  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col z-50 animate-fade-in text-left">
      <div className="p-4 flex items-center justify-between border-b border-zinc-900">
        <button
          onClick={() => setShowChangeHostList(false)}
          className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-xs focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#ff8b66] font-bold">Select New Host</span>
        <div className="w-10" />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          Transfer ownership of this plan. You will no longer be the host and will become a normal participant.
        </p>
        {eligibleParticipants.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">No eligible participants available to transfer ownership.</div>
        ) : (
          <div className="space-y-2">
            {eligibleParticipants.map(member => (
              <button
                key={member.userId}
                onClick={() => setSelectedNewHost({ userId: member.userId, name: member.name })}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar src={member.avatar} alt={member.name} size="w-8 h-8" className="border border-zinc-800" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">{member.name}</div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Status: {member.joinState}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#ff8b66] uppercase tracking-wider font-bold">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedNewHost && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-55 animate-fade-in text-center">
          <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Transfer Host?</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Are you sure you want to transfer ownership of this plan to <span className="text-zinc-200 font-semibold">{selectedNewHost.name}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNewHost(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangeHostConfirm}
                disabled={isChangingHost}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.2)] disabled:opacity-40"
              >
                {isChangingHost ? "Transferring…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function ParticipantActionSheet({
  selectedParticipantForActions,
  setSelectedParticipantForActions,
  isHost,
  resolvedUserUuid,
  hostId,
  setUserToRemove,
  showToast,
}: {
  selectedParticipantForActions: any | null;
  setSelectedParticipantForActions: (person: any | null) => void;
  isHost: boolean;
  resolvedUserUuid: string;
  hostId: string;
  setUserToRemove: (user: any) => void;
  showToast: (msg: string) => void;
}) {
  return (
    <AnimatePresence>
      {selectedParticipantForActions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedParticipantForActions(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="w-full max-w-md bg-[#0D0D10] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 z-[110] relative pb-10 shadow-2xl text-left"
          >
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-4" />
            <div className="flex items-center gap-3.5 pb-2 border-b border-white/[0.04]">
              <UserAvatar src={selectedParticipantForActions.avatar} alt={selectedParticipantForActions.name || ""} size="w-10 h-10" className="border border-white/10" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide leading-tight">{selectedParticipantForActions.name}</h4>
                <span className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest mt-1 block">
                  Role: {selectedParticipantForActions.userId === hostId ? 'Host' : 'Member'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedParticipantForActions(null);
                  showToast(`Viewing profile of ${selectedParticipantForActions.name}`);
                }}
                className="w-full py-3 px-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-zinc-200 hover:text-white rounded-xl text-xs font-bold transition text-center cursor-pointer"
              >
                View Profile
              </button>
              {isHost &&
                selectedParticipantForActions.userId !== resolvedUserUuid &&
                selectedParticipantForActions.userId !== hostId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParticipantForActions(null);
                      setUserToRemove({
                        userId: selectedParticipantForActions.userId,
                        name: selectedParticipantForActions.name
                      });
                    }}
                    className="w-full py-3 px-4 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/20 text-rose-455 rounded-xl text-xs font-bold transition text-center cursor-pointer"
                  >
                    Remove From Plan
                  </button>
                )}
              <button
                type="button"
                onClick={() => setSelectedParticipantForActions(null)}
                className="w-full py-3 px-4 bg-white/[0.02] hover:bg-white/[0.04] border border-transparent text-zinc-455 hover:text-zinc-300 rounded-xl text-xs font-bold transition text-center cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
function HostActionsMenu({
  isMenuOpen,
  setIsMenuOpen,
  onEditPlan,
  planId,
  planStatus,
  setShowChangeHostList,
  setShowDitchConfirm,
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: (val: boolean) => void;
  onEditPlan?: (planId: string) => void;
  planId: string;
  planStatus: string;
  setShowChangeHostList: (val: boolean) => void;
  setShowDitchConfirm: (val: boolean) => void;
}) {
  if (!isMenuOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
      <div className="absolute right-0 mt-2 w-44 bg-[#0F0F13]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1 z-40 animate-fade-in origin-top-right text-left">
        {planStatus === "LIVE" && (
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
          <span>Cancel Plan</span>
        </button>
      </div>
    </>
  );
}
function TeamsSection({
  showTeams,
  isModerator,
  setShowManageTeams,
  teamAMembers,
  teamBMembers,
  unassignedMembers,
  isOverlay = false,
}: {
  showTeams: boolean;
  isModerator: boolean;
  setShowManageTeams: (val: boolean) => void;
  teamAMembers: any[];
  teamBMembers: any[];
  unassignedMembers: any[];
  isOverlay?: boolean;
}) {
  if (!showTeams) return null;
  return (
    <div className={`px-6 space-y-3.5 text-left select-none ${isOverlay ? "" : "bg-zinc-905 border border-zinc-900 rounded-3xl p-5"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">⚽ Teams</span>
        {isModerator && (
          <button
            type="button"
            onClick={() => setShowManageTeams(true)}
            className="text-[9px] font-mono font-bold text-[#ff8b66] hover:text-[#ff9a7c] uppercase tracking-wider cursor-pointer focus:outline-none"
          >
            Manage
          </button>
        )}
      </div>
      <div className="space-y-3.5">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-emerald-450 font-bold px-1">
            <span>Team A</span>
            <span>({teamAMembers.length})</span>
          </div>
          {teamAMembers.length === 0 ? (
            <div className="text-[10px] font-mono text-zinc-655 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">No players assigned</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamAMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-emerald-500/30" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-sky-400 font-bold px-1">
            <span>Team B</span>
            <span>({teamBMembers.length})</span>
          </div>
          {teamBMembers.length === 0 ? (
            <div className="text-[10px] font-mono text-zinc-655 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">No players assigned</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {teamBMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-sky-950/20 border border-sky-500/20">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-sky-500/30" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {unassignedMembers.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold px-1">
              <span>Unassigned</span>
              <span>({unassignedMembers.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unassignedMembers.map(m => (
                <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                  <UserAvatar src={m.avatar} alt={m.name || ""} size="w-6 h-6" className="border border-zinc-800" />
                  <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ActionButtons({
  selectedPlan,
  isParticipant,
  showJoinDirect,
  alreadySkipped,
  isFull,
  isWaitlist,
  isHost,
  isJoiningDirect,
  isRejoining,
  isSkipping,
  showTeams,
  handleJoinDirect,
  handleRejoin,
  handleSkip,
  setShowLeaveConfirm,
  setShowDitchConfirm,
  setShowCompletionFlow,
  setShowManageTeams,
  onClose,
}: {
  selectedPlan: Plan;
  isParticipant: boolean;
  showJoinDirect: boolean;
  alreadySkipped: boolean;
  isFull: boolean;
  isWaitlist: boolean;
  isHost: boolean;
  isJoiningDirect: boolean;
  isRejoining: boolean;
  isSkipping: boolean;
  showTeams: boolean;
  handleJoinDirect: () => void;
  handleRejoin: () => void;
  handleSkip: () => void;
  setShowLeaveConfirm: (val: boolean) => void;
  setShowDitchConfirm: (val: boolean) => void;
  setShowCompletionFlow: (val: boolean) => void;
  setShowManageTeams: (val: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div>
      {selectedPlan.status === "COMPLETED" ? (
        null
      ) : !isParticipant ? (
        <div id="immersive-actions-dock" className="px-6 pt-3 pb-6 border-t border-white/[0.05] flex flex-col gap-3 z-10 relative mt-4 text-center bg-[#050505]">
          {showJoinDirect && (
            <button
              id="immersive-join-btn"
              type="button"
              onClick={handleJoinDirect}
              disabled={isJoiningDirect || isWaitlist}
              className={`w-full py-4 px-6 rounded-[20px] text-[13px] font-sans font-black tracking-[0.14em] uppercase transition-all duration-200 text-center cursor-pointer border shadow-lg active:scale-[0.98] ${isWaitlist
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25 shadow-amber-500/5 cursor-default'
                : 'bg-[#FF6B2C] text-white hover:bg-[#FF854C] border-[#FF6B2C]/20 shadow-[#FF6B2C]/15 disabled:opacity-40'
                }`}
            >
              {isJoiningDirect ? "Joining…" : (isWaitlist ? "Waitlisted" : (isFull ? "Join Waitlist" : "Join Plan"))}
            </button>
          )}
          {alreadySkipped && (
            <button
              id="immersive-join-btn"
              type="button"
              onClick={handleRejoin}
              disabled={isRejoining}
              className="w-full py-4 px-6 rounded-[20px] text-[13px] font-sans font-black tracking-[0.14em] uppercase transition-all duration-200 text-center cursor-pointer bg-[#FF6B2C] text-white hover:bg-[#FF854C] border border-[#FF6B2C]/20 shadow-lg shadow-[#FF6B2C]/15 active:scale-[0.98] disabled:opacity-40"
            >
              {isRejoining ? "Rejoining…" : (isFull ? "Rejoin Waitlist" : "Rejoin Plan")}
            </button>
          )}
          <button
            id="immersive-skip-btn"
            type="button"
            onClick={handleSkip}
            disabled={isSkipping}
            className="w-full py-1 text-[11px] font-sans font-black tracking-[0.15em] text-[#94A3B8]/60 hover:text-white transition-colors uppercase text-center cursor-pointer active:opacity-70 disabled:opacity-30"
          >
            {isSkipping ? "Skipping…" : "Skip"}
          </button>
        </div>
      ) : (
        <div id="immersive-actions-dock-joined" className="px-6 pt-3 pb-6 border-t border-white/[0.05] flex flex-col gap-3 z-10 relative mt-4 bg-[#050505]">
          {isHost ? (
            <button
              type="button"
              onClick={() => setShowDitchConfirm(true)}
              className="w-full py-3.5 px-6 rounded-[20px] text-[11px] font-sans font-black tracking-[0.12em] text-rose-500/80 hover:text-rose-455 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all uppercase text-center cursor-pointer"
            >
              Cancel Plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="w-full py-3.5 px-6 rounded-[20px] text-[11px] font-sans font-black tracking-[0.12em] text-rose-500/80 hover:text-rose-455 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all uppercase text-center cursor-pointer"
            >
              Leave Plan
            </button>
          )}
          {isHost && selectedPlan.status === "LIVE" && (
            <button
              id="immersive-complete-plan-btn"
              type="button"
              onClick={() => setShowCompletionFlow(true)}
              className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-[11px] font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer text-center shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              Complete Plan
            </button>
          )}
          {showTeams && (
            <button
              type="button"
              onClick={() => setShowManageTeams(true)}
              className="w-full py-3.5 rounded-[20px] border border-[#ff8b66]/25 bg-[#ff8b66]/5 text-[#ff8b66] hover:bg-[#ff8b66]/10 text-xs font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer text-center"
            >
              ⚽ Team Organizer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
// ==========================================
// MAIN DETAILED PLAN SCREEN COMPONENT
// ==========================================
export interface PlansPreviewScreenProps {
  planId: string;
  onClose: () => void;
  userProfile: UserProfile;
  activeUserId?: string;
  onNavigateToCircle?: (circleId: string) => void;
  onEditPlan?: (planId: string) => void;
  setShowPaymentSuccess?: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  onLeavePlan?: () => void;
  onPlanCancelled?: (planId: string) => void;
}
export const PlansPreviewScreen: React.FC<PlansPreviewScreenProps> = ({
  planId,
  onClose,
  userProfile,
  activeUserId,
  onNavigateToCircle,
  onEditPlan,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  onLeavePlan,
  onPlanCancelled,
}) => {
  const { showToast } = useToast();
  const {
    dbPlans,
    dbPlanTeamAssignments,
    getTeamAssignments,
    dbPlanParticipants,
    skipPlan,
    rejoinPlan,
    joinPlan,
    changePlanHost,
    cancelPlan,
    removeParticipant,
  } = usePlansStore();
  const selectedPlan = useLivePlan(planId);
  // States
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const [isJoiningDirect, setIsJoiningDirect] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showChangeHostList, setShowChangeHostList] = useState(false);
  const [isChangingHost, setIsChangingHost] = useState(false);
  const [showDitchConfirm, setShowDitchConfirm] = useState(false);
  const [isDitching, setIsDitching] = useState(false);
  const [selectedNewHost, setSelectedNewHost] = useState<{ userId: string; name: string } | null>(null);
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [selectedParticipantForActions, setSelectedParticipantForActions] = useState<any | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  useEffect(() => {
    if (planId && sessionStorage.getItem('expand_participants_once') === planId) {
      setIsExpanded(true);
      sessionStorage.removeItem('expand_participants_once');
      setTimeout(() => {
        const toggleBar = document.getElementById("immersive-description-block")?.nextElementSibling;
        if (toggleBar) {
          toggleBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
    }
  }, [planId]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const countdown = useLiveCountdown(selectedPlan?.response_deadline_at);
  const urgencyColor = useMemo(() => {
    if (!selectedPlan?.response_deadline_at) return '#71717a';
    if (!countdown) return '#ef4444';
    return rsvpUrgencyStyles[countdown.urgency].icon;
  }, [selectedPlan?.response_deadline_at, countdown]);
  const planUuid = selectedPlan ? ((selectedPlan as any).dbUuid || selectedPlan.id) : "";
  const resolvedUserUuid = userProfile.dbUuid || activeUserId || "";
  const isHost = selectedPlan ? selectedPlan.hostId === resolvedUserUuid : false;
  const myParticipantRecord = useMemo(() => {
    if (!selectedPlan) return undefined;
    return dbPlanParticipants.find(
      pp => pp.plan_id === planUuid && (pp.user_id === resolvedUserUuid || pp.user_id === activeUserId)
    );
  }, [dbPlanParticipants, selectedPlan, planUuid, activeUserId, resolvedUserUuid]);
  const isParticipant = useMemo(() => {
    return isHost || normalizeStatus(myParticipantRecord?.rsvp_status) === "JOINED";
  }, [isHost, myParticipantRecord?.rsvp_status]);
  const allGoingMembers = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(m => m.joinState === "JOINED");
  }, [selectedPlan]);
  const planAssignments = useMemo(() => {
    return dbPlanTeamAssignments.filter(a => a.plan_id === planUuid);
  }, [dbPlanTeamAssignments, planUuid]);
  const teamAMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "A";
    });
  }, [allGoingMembers, planAssignments]);
  const teamBMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "B";
    });
  }, [allGoingMembers, planAssignments]);
  const unassignedMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return !a;
    });
  }, [allGoingMembers, planAssignments]);
  const isFull = useMemo(() => {
    if (!selectedPlan) return false;
    const limit = selectedPlan.joinLimit || selectedPlan.capacity || 0;
    const acceptedCount = selectedPlan.members.filter(m => m.joinState === "JOINED").length;
    return limit > 0 && acceptedCount >= limit && selectedPlan.waitlistEnabled;
  }, [selectedPlan]);
  const alreadySkipped = normalizeStatus(myParticipantRecord?.rsvp_status) === "SKIPPED";
  const eligibleParticipants = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(
      m =>
        m.userId !== activeUserId &&
        m.userId !== userProfile.dbUuid &&
        (m.joinState === "JOINED" || m.joinState === "WAITLISTED")
    );
  }, [selectedPlan, activeUserId, userProfile.dbUuid]);
  const responseDeadlineText = useMemo(() => {
    if (!selectedPlan) return "No deadline";
    return selectedPlan.response_deadline_at
      ? new Date(selectedPlan.response_deadline_at).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      : "No deadline";
  }, [selectedPlan]);
  const rawDbPlan = useMemo(() => {
    return dbPlans.find(p => p.id === planUuid);
  }, [dbPlans, planUuid]);
  const hasCost = rawDbPlan ? (rawDbPlan.total_cost !== undefined && rawDbPlan.total_cost !== null) : false;
  const costText = useMemo(() => {
    if (!rawDbPlan || !hasCost) return "";
    const totalCostVal = Number(rawDbPlan.total_cost || 0);
    if (totalCostVal === 0) return "Free";
    if (myParticipantRecord && myParticipantRecord.cost_per_participant !== undefined && myParticipantRecord.cost_per_participant !== null) {
      const shareVal = Number(myParticipantRecord.cost_per_participant);
      return `₹${shareVal.toFixed(2)} per person`;
    }
    return "";
  }, [rawDbPlan, hasCost, myParticipantRecord]);
  const currentStatus = normalizeStatus(myParticipantRecord?.rsvp_status);
  const showJoinDirect = ["INVITED", "WAITLISTED", "new"].includes(currentStatus);
  const isWaitlist = currentStatus === "WAITLISTED";
  const showTeams = useMemo(() => {
    if (!selectedPlan) return false;
    const isFootball = (selectedPlan as any).subcategory === "football";
    return isFootball && isParticipant;
  }, [selectedPlan, isParticipant]);
  useEffect(() => {
    if (selectedPlan && (selectedPlan as any).subcategory === "football") {
      getTeamAssignments(planUuid);
    }
  }, [planUuid, selectedPlan, getTeamAssignments]);
  const handleSkip = useCallback(async () => {
    if (!selectedPlan || !activeUserId || isSkipping) return;
    setIsSkipping(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      showToast("You left the plan.");
      if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to skip plan");
    } finally {
      setIsSkipping(false);
    }
  }, [selectedPlan, activeUserId, isSkipping, onLeavePlan, onClose, skipPlan, showToast]);
  const handleRejoin = useCallback(async () => {
    if (!selectedPlan || !activeUserId || isRejoining) return;
    setIsRejoining(true);
    try {
      await rejoinPlan(selectedPlan.id, userProfile);
      if (isFull) {
        showToast("Added to Waitlist");
        if (setShowWaitlistSuccess) {
          setShowWaitlistSuccess(selectedPlan.id);
        }
      } else {
        showToast((selectedPlan as any).payment_required ? "Plan joined (mock checkout)" : "Plan joined");
        if (setShowPaymentSuccess) {
          setShowPaymentSuccess(selectedPlan.id);
        }
      }
      onClose();
    } catch (err) {
      showToast("Failed to join plan");
    } finally {
      setIsRejoining(false);
    }
  }, [selectedPlan, activeUserId, isRejoining, userProfile, isFull, rejoinPlan, setShowWaitlistSuccess, setShowPaymentSuccess, onClose, showToast]);
  const handleJoinDirect = useCallback(async () => {
    if (!selectedPlan || isJoiningDirect) return;
    setIsJoiningDirect(true);
    try {
      await joinPlan(selectedPlan.id, userProfile);
      if (isFull) {
        showToast("Added to Waitlist");
        if (setShowWaitlistSuccess) {
          setShowWaitlistSuccess(selectedPlan.id);
        }
      } else {
        showToast((selectedPlan as any).payment_required ? "Joined plan successfully! (mock checkout)" : "Joined plan successfully!");
        if (setShowPaymentSuccess) {
          setShowPaymentSuccess(selectedPlan.id);
        }
      }
      onClose();
    } catch (err) {
      showToast("Failed to join plan");
    } finally {
      setIsJoiningDirect(false);
    }
  }, [selectedPlan, isJoiningDirect, userProfile, isFull, joinPlan, setShowWaitlistSuccess, setShowPaymentSuccess, onClose, showToast]);
  const handleSkipConfirm = useCallback(async () => {
    if (!selectedPlan || !activeUserId || isLeaving) return;
    setIsLeaving(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      showToast("You left the plan.");
      setShowLeaveConfirm(false);
      if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to skip plan");
    } finally {
      setIsLeaving(false);
    }
  }, [selectedPlan, activeUserId, isLeaving, skipPlan, onLeavePlan, onClose, showToast]);
  const handleDitchConfirm = useCallback(async () => {
    if (!selectedPlan || isDitching) return;
    setIsDitching(true);
    try {
      await cancelPlan(selectedPlan.id);
      showToast("Plan cancelled.");
      setShowDitchConfirm(false);
      if (onPlanCancelled) {
        onPlanCancelled(selectedPlan.id);
      } else if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to ditch plan");
    } finally {
      setIsDitching(false);
    }
  }, [selectedPlan, isDitching, cancelPlan, onPlanCancelled, onLeavePlan, onClose, showToast]);
  const handleChangeHostConfirm = useCallback(async () => {
    if (!selectedPlan || !selectedNewHost || isChangingHost || !activeUserId) return;
    setIsChangingHost(true);
    try {
      await changePlanHost(selectedPlan.id, selectedNewHost.userId, activeUserId);
      showToast(`Ownership transferred to ${selectedNewHost.name}`);
      setSelectedNewHost(null);
      setShowChangeHostList(false);
      onClose();
    } catch (err) {
      showToast("Failed to transfer ownership");
    } finally {
      setIsChangingHost(false);
    }
  }, [selectedPlan, selectedNewHost, isChangingHost, activeUserId, changePlanHost, onClose, showToast]);
  const handleRemoveParticipant = useCallback(async (userId: string, name: string) => {
    if (!selectedPlan) return;
    try {
      setIsRemoving(true);
      await removeParticipant(selectedPlan.id, userId);
      showToast(`✓ Removed ${name} from plan`);
      setUserToRemove(null);
    } catch (err: any) {
      showToast(`Error removing: ${err.message || err}`);
    } finally {
      setIsRemoving(false);
    }
  }, [selectedPlan, removeParticipant, showToast]);
  if (!selectedPlan) return null;
  return (
    <motion.div
      id="home_plan_details"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 bg-[#050505] z-50 flex flex-col h-full overflow-hidden text-left"
    >
      <LeaveConfirmDialog
        showLeaveConfirm={showLeaveConfirm}
        setShowLeaveConfirm={setShowLeaveConfirm}
        handleSkipConfirm={handleSkipConfirm}
        isLeaving={isLeaving}
      />
      <DitchConfirmDialog
        showDitchConfirm={showDitchConfirm}
        setShowDitchConfirm={setShowDitchConfirm}
        handleDitchConfirm={handleDitchConfirm}
        isDitching={isDitching}
      />
      <ChangeHostDialog
        showChangeHostList={showChangeHostList}
        setShowChangeHostList={setShowChangeHostList}
        eligibleParticipants={eligibleParticipants}
        selectedNewHost={selectedNewHost}
        setSelectedNewHost={setSelectedNewHost}
        handleChangeHostConfirm={handleChangeHostConfirm}
        isChangingHost={isChangingHost}
      />
      <ParticipantActionSheet
        selectedParticipantForActions={selectedParticipantForActions}
        setSelectedParticipantForActions={setSelectedParticipantForActions}
        isHost={isHost}
        resolvedUserUuid={resolvedUserUuid}
        hostId={selectedPlan.hostId}
        setUserToRemove={setUserToRemove}
        showToast={showToast}
      />
      <RemoveConfirmDialog
        userToRemove={userToRemove}
        setUserToRemove={setUserToRemove}
        handleRemoveParticipant={handleRemoveParticipant}
        isRemoving={isRemoving}
      />
      <div id="immersive-plan-scroll-container" className="flex-1 overflow-y-auto scrollbar-none pb-48">
        <div id="immersive-plan-hero-wrapper" className="w-full">
          <div
            id="immersive-plan-hero-container"
            className="relative w-full h-[320px] flex flex-col justify-end overflow-hidden flex-shrink-0 rounded-b-[2.5rem]"
          >
            {/* Cover Image */}
            <DiscoveryImages
              id="immersive-plan-hero-image"
              src={selectedPlan.coverImage || getPlanCover(selectedPlan.category, (selectedPlan as any).subcategory || (selectedPlan as any).sports_type)}
              category={selectedPlan.category}
              alt={selectedPlan.title}
              className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
            />
            {/* Immersive gradient overlay for bottom readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none z-10" />

            {/* Hero Header component */}
            <HeroHeader
              title={selectedPlan.title}
              creatorName={selectedPlan.creatorName}
              creatorAvatar={selectedPlan.creatorAvatar}
              onClose={onClose}
              isHost={isHost}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
              isInfoOpen={showInfoPopup}
              onToggleInfo={() => setShowInfoPopup(!showInfoPopup)}
              hostMenu={
                <HostActionsMenu
                  isMenuOpen={isMenuOpen}
                  setIsMenuOpen={setIsMenuOpen}
                  onEditPlan={onEditPlan}
                  planId={selectedPlan.id}
                  planStatus={selectedPlan.status}
                  setShowChangeHostList={setShowChangeHostList}
                  setShowDitchConfirm={setShowDitchConfirm}
                />
              }
            />

            {/* Contextual Info Popup Overlay */}
            <AnimatePresence>
              {showInfoPopup && (
                <>
                  {/* Backdrop overlay to catch outside clicks with slight dimming and subtle blur */}
                  <div
                    className="absolute inset-0 z-40 bg-black/15 backdrop-blur-[2px]"
                    onClick={() => setShowInfoPopup(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-[calc(78px+env(safe-area-inset-top,0px))] right-4 z-55 pointer-events-auto"
                  >
                    <HeroMetadataCard
                      datetime={selectedPlan.datetime}
                      createdAt={selectedPlan.createdAt}
                      hasCost={hasCost}
                      costText={costText}
                      urgencyColor={urgencyColor}
                      responseDeadlineAt={selectedPlan.response_deadline_at}
                      location={selectedPlan.location}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>


        <div id="immersive-plan-scroll-content" className="px-6 pt-3.5 space-y-7">
          <ParticipantToggleBar
            plan={selectedPlan}
            userProfile={userProfile}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setSelectedParticipantForActions={setSelectedParticipantForActions}
            hideHost={true}
          />
          {hasUserEnteredDescription(selectedPlan) && (
            <div id="immersive-description-block" className="space-y-2 text-left bg-zinc-900/20 p-5 rounded-3xl border border-white/[0.02] select-text">
              <span className="text-[10px] font-sans font-bold tracking-[0.14em] text-zinc-500 uppercase">About</span>
              <p className="text-[13.5px] text-zinc-300 font-sans leading-[1.72]">{selectedPlan.description || getPlanDescription(selectedPlan)}</p>
            </div>
          )}
        </div>

        <TeamsSection
          showTeams={showTeams}
          isModerator={isHost}
          setShowManageTeams={setShowManageTeams}
          teamAMembers={teamAMembers}
          teamBMembers={teamBMembers}
          unassignedMembers={unassignedMembers}
        />
      </div>

      <ActionButtons
        selectedPlan={selectedPlan}
        isParticipant={isParticipant}
        showJoinDirect={showJoinDirect}
        alreadySkipped={alreadySkipped}
        isFull={isFull}
        isWaitlist={isWaitlist}
        isHost={isHost}
        isJoiningDirect={isJoiningDirect}
        isRejoining={isRejoining}
        isSkipping={isSkipping}
        showTeams={showTeams}
        handleJoinDirect={handleJoinDirect}
        handleRejoin={handleRejoin}
        handleSkip={handleSkip}
        setShowLeaveConfirm={setShowLeaveConfirm}
        setShowDitchConfirm={setShowDitchConfirm}
        setShowCompletionFlow={setShowCompletionFlow}
        setShowManageTeams={setShowManageTeams}
        onClose={onClose}
      />

      {showManageTeams && (
        <TeamOrganizerModal
          planId={selectedPlan.id}
          userProfile={userProfile}
          activeUserId={activeUserId}
          onClose={() => setShowManageTeams(false)}
        />
      )}

      <AnimatePresence>
        {showCompletionFlow && (
          <PlanCompletionModal
            plan={selectedPlan}
            onClose={() => setShowCompletionFlow(false)}
            activeUserId={activeUserId || ""}
            onPublish={() => {
              setShowCompletionFlow(false);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default React.memo(PlansPreviewScreen);
