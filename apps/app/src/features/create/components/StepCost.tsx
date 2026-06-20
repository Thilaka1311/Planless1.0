import React, { useState, useEffect, useRef } from 'react';
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
  quickNote,
  setQuickNote,
  setCustomizerStep,
}) => {
  // Derive initial mode from costAmount
  const [isPaid, setIsPaid] = useState(costAmount > 0);
  const [rawInput, setRawInput] = useState(costAmount > 0 ? String(costAmount) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  // When switching to Paid, focus the amount input
  useEffect(() => {
    if (isPaid) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isPaid]);

  const handleModeChange = (paid: boolean) => {
    setIsPaid(paid);
    if (!paid) {
      setRawInput('');
      setCostAmount(0);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setRawInput(val);
    setCostAmount(val ? parseInt(val, 10) : 0);
  };

  const totalAttendees = totalInvitedCount + 1; // +1 for host
  const perPerson = costAmount > 0 && totalAttendees > 0
    ? Math.ceil(costAmount / totalAttendees)
    : 0;

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between overflow-y-auto scrollbar-none">
      <div className="space-y-5">

        {/* Heading */}
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Cost?</h2>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Set a split fee for attendees.</p>
        </div>

        {/* Free / Paid Toggle */}
        <div className="flex gap-2">
          {/* Free option */}
          <button
            type="button"
            onClick={() => handleModeChange(false)}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all cursor-pointer ${
              !isPaid
                ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/40 text-white'
                : 'bg-[#111115] border-white/5 text-zinc-400 hover:border-white/10'
            }`}
          >
            {/* Radio dot */}
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              !isPaid ? 'border-[#FF6B2C]' : 'border-zinc-600'
            }`}>
              {!isPaid && <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />}
            </span>
            <div className="text-left">
              <span className="text-sm font-bold block leading-tight">Free</span>
              <span className="text-[10px] text-zinc-500 font-medium">No payment required</span>
            </div>
          </button>

          {/* Paid option */}
          <button
            type="button"
            onClick={() => handleModeChange(true)}
            className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all cursor-pointer ${
              isPaid
                ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/40 text-white'
                : 'bg-[#111115] border-white/5 text-zinc-400 hover:border-white/10'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              isPaid ? 'border-[#FF6B2C]' : 'border-zinc-600'
            }`}>
              {isPaid && <span className="w-2 h-2 rounded-full bg-[#FF6B2C]" />}
            </span>
            <div className="text-left">
              <span className="text-sm font-bold block leading-tight">Paid</span>
              <span className="text-[10px] text-zinc-500 font-medium">Collect a split fee</span>
            </div>
          </button>
        </div>

        {/* Amount Input — only when Paid */}
        {isPaid && (
          <div className="space-y-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">Amount</span>
            <div className="flex items-center gap-2 bg-[#111115] border border-white/8 rounded-2xl px-4 py-3.5 focus-within:border-[#FF6B2C]/40 transition-all">
              <span className="text-2xl font-extrabold text-[#FF6B2C] leading-none">₹</span>
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rawInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="flex-1 bg-transparent text-white border-none p-0 text-2xl font-extrabold focus:outline-none focus:ring-0 placeholder-zinc-700"
              />
            </div>
          </div>
        )}

        {/* Cost Summary Card — when paid and amount entered */}
        {isPaid && costAmount > 0 && (
          <div className="bg-[#111115] border border-white/5 rounded-2xl p-5 text-center space-y-1">
            <p className="text-[42px] font-black text-white leading-none tracking-tight">
              ₹{costAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest">
              Per Event
            </p>
          </div>
        )}

        {/* Estimated Split — when paid, amount > 0, and people invited */}
        {isPaid && costAmount > 0 && totalInvitedCount > 0 && (
          <div className="bg-[#111115] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400 font-medium">
              {totalAttendees} {totalAttendees === 1 ? 'attendee' : 'attendees'} invited
            </span>
            <span className="text-sm font-black text-[#FF6B2C]">
              ≈ ₹{perPerson} per person
            </span>
          </div>
        )}

        {/* Optional Note */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
            Optional Note
          </span>
          <input
            type="text"
            placeholder="e.g. Bring cash, Pay at venue, Court fee included"
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            className="w-full bg-[#111115] border border-white/5 rounded-xl py-3 px-3.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-600"
          />
        </div>
      </div>

      {/* Continue CTA */}
      <div className="pt-5 mt-auto">
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
