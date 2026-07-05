import React from "react";
import { Clock, Hourglass, MapPin, IndianRupee } from "lucide-react";
import { Plan } from "../../../../core/types";
import { formatPlanDate } from "../../../../lib/mappers";

interface PlanDetailsInfoProps {
  selectedPlan: Plan;
  responseDeadlineText: string;
  costText: string;
  hasCost: boolean;
}

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

  // Check against auto-generated creation flow defaults
  if (
    desc.startsWith("Spontaneous coordination thread for") ||
    desc.startsWith("Coordination thread:")
  ) {
    return false;
  }

  // Check against category default/fallback/placeholder descriptions
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

export const PlanDetailsInfo: React.FC<PlanDetailsInfoProps> = ({
  selectedPlan,
  responseDeadlineText,
  costText,
  hasCost,
}) => {
  return (
    <div id="immersive-plan-scroll-content" className="px-6 pt-2 space-y-5">
      {/* QUICK INFORMATION */}
      <div id="immersive-quick-info" className="space-y-2.5 font-sans text-left">
        {/* Clock details */}
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-semibold leading-tight">
              {formatPlanDate(selectedPlan.datetime || selectedPlan.createdAt)}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">TIMING</span>
          </div>
        </div>

        {/* Cost details */}
        {hasCost && costText && (
          <div className="flex items-center gap-3">
            <IndianRupee className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[13px] text-white font-semibold leading-tight">{costText}</span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">COST</span>
            </div>
          </div>
        )}

        {/* Deadline details */}
        <div className="flex items-center gap-3">
          <Hourglass className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] text-[#EF4444] font-bold leading-tight">{responseDeadlineText}</span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">RSVP DEADLINE</span>
          </div>
        </div>

        {/* Location details */}
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[13px] text-white font-semibold leading-tight">{selectedPlan.location}</span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">LOCATION</span>
          </div>
        </div>
      </div>

      {/* DESCRIPTION */}
      {hasUserEnteredDescription(selectedPlan) && (
        <div id="immersive-description-block" className="space-y-1.5 text-left select-text">
          <span className="text-[11px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase">
            About
          </span>
          <p className="text-[13px] text-zinc-300 font-sans leading-[1.72]">
            {selectedPlan.description || getPlanDescription(selectedPlan)}
          </p>
        </div>
      )}
    </div>
  );
};
