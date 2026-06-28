import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserAvatar } from "../../../../shared/components/UserAvatar";

interface ParticipantActionSheetProps {
  selectedParticipantForActions: any | null;
  setSelectedParticipantForActions: (person: any | null) => void;
  isHost: boolean;
  resolvedUserUuid: string;
  hostId: string;
  setUserToRemove: (user: any) => void;
  showToast: (msg: string) => void;
}

export const ParticipantActionSheet: React.FC<ParticipantActionSheetProps> = ({
  selectedParticipantForActions,
  setSelectedParticipantForActions,
  isHost,
  resolvedUserUuid,
  hostId,
  setUserToRemove,
  showToast,
}) => {
  return (
    <AnimatePresence>
      {selectedParticipantForActions && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedParticipantForActions(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="w-full max-w-md bg-[#0D0D10] border-t border-white/10 rounded-t-[28px] p-6 space-y-4 z-[110] relative pb-10 shadow-2xl text-left"
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto -mt-2 mb-4" />
            
            {/* Participant details */}
            <div className="flex items-center gap-3.5 pb-2 border-b border-white/[0.04]">
              <UserAvatar src={selectedParticipantForActions.avatar} alt={selectedParticipantForActions.name || ""} size="w-10 h-10" className="border border-white/10" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide leading-tight">
                  {selectedParticipantForActions.name}
                </h4>
                <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mt-1 block">
                  Role: {selectedParticipantForActions.userId === hostId ? 'Host' : 'Member'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
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

              {/* Remove from Plan (Host only, and cannot remove self/host) */}
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
                    className="w-full py-3 px-4 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/20 text-rose-450 rounded-xl text-xs font-bold transition text-center cursor-pointer"
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
};
