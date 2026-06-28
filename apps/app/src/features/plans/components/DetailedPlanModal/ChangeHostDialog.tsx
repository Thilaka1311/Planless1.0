import React from "react";
import { ArrowLeft } from "lucide-react";
import { UserAvatar } from "../../../../shared/components/UserAvatar";

interface ChangeHostDialogProps {
  showChangeHostList: boolean;
  setShowChangeHostList: (val: boolean) => void;
  eligibleParticipants: any[];
  selectedNewHost: { userId: string; name: string } | null;
  setSelectedNewHost: (host: { userId: string; name: string } | null) => void;
  handleChangeHostConfirm: () => void;
  isChangingHost: boolean;
}

export const ChangeHostDialog: React.FC<ChangeHostDialogProps> = ({
  showChangeHostList,
  setShowChangeHostList,
  eligibleParticipants,
  selectedNewHost,
  setSelectedNewHost,
  handleChangeHostConfirm,
  isChangingHost,
}) => {
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
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#ff8b66] font-bold">
          Select New Host
        </span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
        <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
          Transfer ownership of this plan. You will no longer be the host and will become a normal participant.
        </p>
        {eligibleParticipants.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">
            No eligible participants available to transfer ownership.
          </div>
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
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      Status: {member.joinState}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#ff8b66] uppercase tracking-wider font-bold">
                  Select
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Host Change Pop-up */}
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
};
