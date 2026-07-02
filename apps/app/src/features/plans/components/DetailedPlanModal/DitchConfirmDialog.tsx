import React from "react";

interface DitchConfirmDialogProps {
  showDitchConfirm: boolean;
  setShowDitchConfirm: (val: boolean) => void;
  handleDitchConfirm: () => void;
  isDitching: boolean;
}

export const DitchConfirmDialog: React.FC<DitchConfirmDialogProps> = ({
  showDitchConfirm,
  setShowDitchConfirm,
  handleDitchConfirm,
  isDitching,
}) => {
  if (!showDitchConfirm) return null;

  return (
    <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-50 animate-fade-in text-center">
      <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
        <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Cancel Plan?</h3>
        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
          This will permanently close the plan for all participants.
        </p>
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
};
