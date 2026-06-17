import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StepCostProps {
  costAmount: number;
  setCostAmount: (amount: number) => void;
  totalInvitedCount: number;
  waitlistEnabled: boolean;
  waitlistCapacity: number;
  quickNote: string;
  setQuickNote: (note: string) => void;
  setCustomizerStep: (step: number) => void;
}

export const StepCost: React.FC<StepCostProps> = ({
  costAmount,
  setCostAmount,
  totalInvitedCount,
  waitlistEnabled,
  waitlistCapacity,
  quickNote,
  setQuickNote,
  setCustomizerStep,
}) => {
  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Cost?</h2>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Split expenses automatically.</p>
        </div>

        <div className="flex flex-col items-center justify-center py-1 relative">
          <span className="text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold block mb-1">Entry Split Amount</span>
          <div className="flex items-center gap-0.5">
            <span className="text-[32px] font-extrabold text-[#FF6B2C]">₹</span>
            <input 
              type="number"
              value={costAmount || ''}
              placeholder="0"
              onChange={(e) => setCostAmount(parseInt(e.target.value, 10) || 0)}
              className="bg-transparent text-white border-none p-1 text-[38px] font-extrabold focus:outline-none focus:ring-0 max-w-[140px] text-center"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {[
            { label: 'Free', value: 0 },
            { label: '₹300', value: 300 },
            { label: '₹500', value: 500 },
            { label: '₹1000', value: 1000 },
            { label: '₹1500', value: 1500 },
            { label: '₹2000', value: 2000 },
          ].map((chip) => {
            const isSelected = costAmount === chip.value;
            return (
              <button 
                key={chip.label}
                type="button"
                onClick={() => setCostAmount(chip.value)}
                className={`py-1.5 px-3.5 rounded-full text-[11px] font-bold select-none transition-all duration-155 border ${
                  isSelected 
                    ? 'bg-[#FF6B2C] border-[#FF6B2C] text-white' 
                    : 'bg-[#111115] border-white/5 hover:border-white/10 text-zinc-450'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Counts Summary */}
        <div className="grid grid-cols-3 gap-1.5 bg-[#111115]/50 border border-white/5 rounded-xl p-3 text-center">
          <div>
            <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">HOST</span>
            <span className="text-xs font-bold text-zinc-350 font-mono">1</span>
          </div>
          <div>
            <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">INVITED</span>
            <span className="text-xs font-bold text-zinc-350 font-mono">{totalInvitedCount || 0}</span>
          </div>
          <div>
            <span className="text-[8px] font-mono text-zinc-550 font-bold block leading-none mb-1">WAITLIST</span>
            <span className="text-xs font-bold text-zinc-350 font-mono">{waitlistEnabled ? waitlistCapacity : '—'}</span>
          </div>
        </div>

        {/* Split Card Calculation */}
        <div className="bg-[#111115] border border-white/5 rounded-xl p-3.5 flex justify-between items-center text-left">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block leading-none mb-1">Estimated Cost Per Person</span>
            <span className="text-[10px] text-zinc-455">Divided by joiners</span>
          </div>
          <h3 className="text-base font-bold text-[#FF6B2C]">
            {costAmount === 0 ? 'Free' : `₹${Math.round(costAmount / (totalInvitedCount || 1))}`}
          </h3>
        </div>

        <div className="space-y-1 pt-1 text-left">
          <span className="text-[8.5px] font-mono uppercase text-zinc-500 font-bold block mb-1">Optional Note</span>
          <input 
            type="text"
            placeholder="e.g. Bring your own racquet, Pay at venue"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-655"
          />
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button 
          type="button"
          onClick={() => setCustomizerStep(4)}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5 cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
