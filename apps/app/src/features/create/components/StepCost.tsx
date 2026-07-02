import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

interface StepCostProps {
  costAmount: number;
  setCostAmount: (amount: number) => void;
  totalInvitedCount: number;
  waitlistEnabled: boolean;
  waitlistCapacity: number;
  totalCapacity: number;
  setCustomizerStep: (step: number) => void;
  cameFromReview?: boolean;
}

export const StepCost: React.FC<StepCostProps> = ({
  costAmount,
  setCostAmount,
  totalInvitedCount,
  waitlistEnabled,
  waitlistCapacity,
  totalCapacity,
  setCustomizerStep,
  cameFromReview = false,
}) => {
  // Derive initial mode from costAmount
  const [isPaid, setIsPaid] = useState(costAmount > 0);
  const [rawInput, setRawInput] = useState(costAmount > 0 ? String(costAmount) : '0');
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
      setRawInput('0');
      setCostAmount(0);
    } else {
      setRawInput('0');
      setCostAmount(0);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 1 && val.startsWith('0')) {
      val = val.replace(/^0+/, '');
    }
    if (!val) val = '0';
    setRawInput(val);
    setCostAmount(parseInt(val, 10));
  };

  const divisor = totalCapacity;
  const perPerson = costAmount > 0 && divisor > 0
    ? (costAmount / divisor)
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

        {/* Large Direct Number Entry — only when Paid */}
        {isPaid && (
          <div className="flex flex-col items-center justify-center pt-8 pb-4 relative w-full select-none">
            <div 
              onClick={() => inputRef.current?.focus()}
              className="flex items-center justify-center gap-1.5 cursor-pointer max-w-full"
            >
              <span className="text-[40px] font-extrabold text-[#FF6B2C] leading-none select-none">₹</span>
              <input
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rawInput}
                onChange={handleAmountChange}
                placeholder="0"
                className="bg-transparent text-white border-none p-0 text-[52px] font-black focus:outline-none focus:ring-0 placeholder-zinc-850 text-left min-w-[50px] font-sans"
                style={{ width: `${Math.max(1, rawInput.length) * 32 + 20}px` }}
              />
            </div>

            {costAmount > 0 && divisor > 0 && (
              <div className="text-center mt-3.5 animate-fade-in space-y-1">
                <p className="text-base font-black text-[#FF6B2C] leading-none">
                  ₹{perPerson.toFixed(2)} <span className="text-xs text-zinc-400 font-semibold font-sans">per person</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue CTA */}
      {!cameFromReview && (
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
      )}
    </div>
  );
};
