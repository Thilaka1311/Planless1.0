import React from "react";

interface RemoveConfirmDialogProps {
  userToRemove: { userId: string; name: string } | null;
  setUserToRemove: (user: { userId: string; name: string } | null) => void;
  handleRemoveParticipant: (userId: string, name: string) => void;
  isRemoving: boolean;
}

export const RemoveConfirmDialog: React.FC<RemoveConfirmDialogProps> = ({
  userToRemove,
  setUserToRemove,
  handleRemoveParticipant,
  isRemoving,
}) => {
  if (!userToRemove) return null;

  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-[120] animate-fade-in text-center">
      <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
        <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">
          Remove participant from this plan?
        </h3>

        <div className="space-y-3.5 text-center font-sans text-[11px] text-zinc-400">
          <p className="font-semibold text-zinc-350">
            They will lose access to this plan.
          </p>
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
};
