import React from "react";
import { ArrowLeft, MapPin, Clock, ChevronRight } from "lucide-react";

interface PlanDetailsStepProps {
  newPlanTitle: string;
  setNewPlanTitle: (val: string) => void;
  newPlanLocation: string;
  setNewPlanLocation: (val: string) => void;
  newPlanTime: string;
  setNewPlanTime: (val: string) => void;
  setCreateFlowStep: (step: "BROWSE" | "DETAILS" | "RECIPIENTS" | "EXTRA" | "PREVIEW") => void;
  triggerToast: (msg: string) => void;
}

export const PlanDetailsStep = ({
  newPlanTitle,
  setNewPlanTitle,
  newPlanLocation,
  setNewPlanLocation,
  newPlanTime,
  setNewPlanTime,
  setCreateFlowStep,
  triggerToast
}: PlanDetailsStepProps) => {
  return (
    <div className="space-y-5 animate-fade-in text-left">
      <button
        type="button"
        onClick={() => setCreateFlowStep("BROWSE")}
        className="text-xs font-mono font-medium text-zinc-500 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to suggestions</span>
      </button>

      <div className="space-y-1">
        <h3 className="text-sm font-display font-semibold text-zinc-200">Set Core Coordinates</h3>
        <p className="text-[11px] text-zinc-500 font-sans">Enter name, spot & timing. Select suggestions to bypass typing.</p>
      </div>

      <div className="bg-zinc-905 border border-zinc-900 rounded-2xl p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">1. Activity Name</label>
          <input
            type="text"
            placeholder="e.g., Turf Football Session, Rooftop Sundowner"
            value={newPlanTitle}
            onChange={(e) => setNewPlanTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
            required
          />

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {[
              "⚽ Turf Football",
              "🍿 Cinema Crew",
              "☕ Late Brew Coffee",
              "🍜 Ramen Dinner",
              "🍹 Drinks Lounge",
              "🎮 FIFA League"
            ].map((pillText) => (
              <button
                key={pillText}
                type="button"
                onClick={() => setNewPlanTitle(pillText)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanTitle === pillText
                  ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                  : "bg-zinc-950/50 text-zinc-500 border-zinc-900 hover:text-zinc-300"
                  }`}
              >
                {pillText}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">2. Target Venue / Spot</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <MapPin className="w-3.5 h-3.5 text-[#ff8b66]" />
            </span>
            <input
              type="text"
              placeholder="e.g., Starbucks Corner, City Football Turf"
              value={newPlanLocation}
              onChange={(e) => setNewPlanLocation(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
              required
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {[
              "📍 Starbucks HQ",
              "📍 Elite Turf Area",
              "📍 Phoenix Sky Deck",
              "📍 Downtown Pizzeria",
              "📍 Brew House Cafe",
              "📍 Local Park Loft"
            ].map((loc) => {
              const cleanVal = loc.replace("📍 ", "");
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setNewPlanLocation(cleanVal)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanLocation === cleanVal
                    ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                    : "bg-zinc-950/50 text-zinc-500 border-zinc-900 hover:text-zinc-300"
                    }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] text-zinc-400 font-mono uppercase tracking-widest block font-extrabold text-brand-peach">3. Spontaneous Timing</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Clock className="w-3.5 h-3.5 text-[#ff8b66]" />
            </span>
            <input
              type="text"
              placeholder="e.g., TODAY • 8:30 PM, TOMORROW • 6:00 PM"
              value={newPlanTime}
              onChange={(e) => setNewPlanTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-brand-peach transition-all"
              required
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {[
              "⚡ Right Now!",
              "⏰ TODAY • 8:30 PM",
              "⏰ TODAY • 10:00 PM",
              "⏰ TOMORROW • 6:00 PM",
              "⏰ TOMORROW • 8:00 PM"
            ].map((tme) => {
              const cleanVal = tme.replace("⚡ ", "").replace("⏰ ", "");
              return (
                <button
                  key={tme}
                  type="button"
                  onClick={() => setNewPlanTime(cleanVal)}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold font-mono border transition-all ${newPlanTime === cleanVal
                    ? "bg-brand-peach/15 text-brand-peach border-brand-peach/40"
                    : "bg-zinc-950/50 text-zinc-500 border-zinc-900 hover:text-zinc-300"
                    }`}
                >
                  {tme}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!newPlanTitle.trim()) {
            triggerToast("Please enter or pick an Activity Name first.");
            return;
          }
          if (!newPlanLocation.trim()) {
            triggerToast("Please specify a target venue/spot first.");
            return;
          }
          if (!newPlanTime.trim()) {
            triggerToast("Please select spontaneous timings.");
            return;
          }
          setCreateFlowStep("RECIPIENTS");
        }}
        className="w-full py-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-955 font-display font-semibold text-xs uppercase tracking-wider transition-colors text-center cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-bold"
      >
        <span>Continue</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
