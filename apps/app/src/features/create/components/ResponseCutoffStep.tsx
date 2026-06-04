import React from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { CreatePlanCTAButton } from "./active/CreatePlanCTAButton";

interface ResponseCutoffStepProps {
  responseCutoffHours: number;
  setResponseCutoffHours: (hours: number) => void;
  newPlanIsoDateTime: string;
  setCreateFlowStep: (step: any) => void;
}

export const ResponseCutoffStep = ({
  responseCutoffHours,
  setResponseCutoffHours,
  newPlanIsoDateTime,
  setCreateFlowStep,
}: ResponseCutoffStepProps) => {

  const getDeadlineDisplay = (isoStr: string, cutoffHours: number) => {
    if (!isoStr) return "TBD";
    // Fall back to 1 hour calculation if empty/invalid
    const hoursToSub = (isNaN(cutoffHours) || cutoffHours < 1 || cutoffHours > 24) ? 1 : cutoffHours;
    try {
      const date = new Date(isoStr);
      date.setHours(date.getHours() - hoursToSub);

      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return `${weekday} ${timeStr}`;
    } catch (err) {
      return "TBD";
    }
  };

  const getPlanTimeDisplay = (isoStr: string) => {
    if (!isoStr) return "TBD";
    try {
      const date = new Date(isoStr);
      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      return `${weekday} ${timeStr}`;
    } catch (err) {
      return "TBD";
    }
  };

  const planTimeStr = getPlanTimeDisplay(newPlanIsoDateTime);
  const deadlineStr = getDeadlineDisplay(newPlanIsoDateTime, responseCutoffHours);
  const isValid = responseCutoffHours >= 1 && responseCutoffHours <= 24;

  return (
    <div className="space-y-6 animate-fade-in text-left flex flex-col justify-between min-h-[500px]">
      <div className="space-y-6">
        {/* Back */}
        <button
          type="button"
          onClick={() => setCreateFlowStep("WHO")}
          className="text-xs font-mono font-medium text-zinc-550 hover:text-zinc-200 flex items-center gap-1.5 cursor-pointer py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Circles</span>
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-sans text-white">
            When should responses close?
          </h2>
        </div>

        {/* Plan Reference Time */}
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl px-4 py-3.5 flex justify-between items-center text-xs">
          <span className="text-zinc-500 font-sans">Plan Starts</span>
          <span className="font-mono text-zinc-300 font-semibold">{planTimeStr}</span>
        </div>

        {/* Input Box Section */}
        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-mono uppercase tracking-wider text-brand-peach block font-bold">
            Response Deadline
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="1"
              value={responseCutoffHours || ""}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, ""); // Keep only digits to prevent alphabet input
                if (val === "") {
                  setResponseCutoffHours(0);
                  return;
                }
                const num = parseInt(val, 10);
                setResponseCutoffHours(isNaN(num) ? 0 : num);
              }}
              className="w-full bg-zinc-950 border border-zinc-850 rounded-2xl pl-4 pr-28 py-3.5 text-lg text-zinc-100 font-mono font-bold focus:outline-none focus:border-brand-peach transition-all"
              autoFocus
            />
            <span className="absolute right-4 pointer-events-none text-xs font-mono text-zinc-500">
              Hours Before
            </span>
          </div>
          {!isValid && responseCutoffHours !== 0 && (
            <p className="text-[10px] text-red-400 font-mono">
              Please enter an integer between 1 and 24.
            </p>
          )}
        </div>

        {/* Live Preview Display */}
        <div className="bg-brand-peach/5 border border-brand-peach/10 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-brand-peach font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Responses Close</span>
          </div>
          <div className="text-lg font-black text-zinc-100 tracking-tight font-sans">
            {deadlineStr}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <CreatePlanCTAButton
          text="NEXT — BUDGET & COST →"
          disabled={!isValid}
          onPress={() => setCreateFlowStep("COST")}
        />
      </div>
    </div>
  );
};
