import React, { useMemo } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlansStore } from '../../plans/state/PlansContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { EmptyState } from '../../home/components/EmptyState';
import { getPlanCover } from '../../plans/config/planCoverImages';
import { normalizeStatus } from '../../../lib/participantStatus';

interface CirclePlansScreenProps {
  circle: any;
  onBack: () => void;
  onNavigateToPlanDetails: (planId: string) => void;
}

export const CirclePlansScreen: React.FC<CirclePlansScreenProps> = ({
  circle,
  onBack,
  onNavigateToPlanDetails,
}) => {
  const { plans, dbPlanParticipants } = usePlansStore();
  const { userProfile } = useProfileStore();
  const circleUuid = circle.dbUuid || circle.id;
  const userUuid = userProfile?.dbUuid || "";

  // Get all plans matching this circle
  const circlePlans = useMemo(() => {
    return plans.filter((p: any) => p.circleId === circleUuid || p.circleId === circle.id);
  }, [plans, circleUuid, circle.id]);

  const getPlanActivityIcon = (plan: any) => {
    const category = (plan.category || 'sports').toLowerCase();
    const subcategory = (plan.sports_type || plan.subcategory || plan.activity_type || plan.activityType || '').toLowerCase();

    if (category === 'sports' || category === 'football' || category === 'badminton') {
      if (subcategory.includes('badminton') || subcategory.includes('shuttle')) return '🏸';
      if (subcategory.includes('football') || subcategory.includes('soccer')) return '⚽';
      if (subcategory.includes('basketball')) return '🏀';
      if (subcategory.includes('tennis')) return '🎾';
      if (subcategory.includes('volleyball')) return '🏐';
      if (subcategory.includes('cricket')) return '🏏';
      if (category === 'badminton') return '🏸';
      if (category === 'football') return '⚽';
      return '⚽';
    }
    if (category === 'movies' || category === 'cinema') return '🎬';
    if (category === 'dining' || category === 'restaurants' || category === 'restaurant' || category === 'cafe') return '🍽️';
    return '⚡';
  };

  const getPlanStatusLabel = (plan: any) => {
    if (plan.status === "CANCELLED") return "Cancelled";
    if (plan.status === "COMPLETED" || plan.isHappened) return "Completed";
    
    // Check if it's ongoing (current time falls within suggested duration)
    const now = new Date();
    if (plan.datetime) {
      const pDate = new Date(plan.datetime);
      const duration = plan.suggestedDurationMinutes || 120;
      const endDate = new Date(pDate.getTime() + duration * 60 * 1000);
      if (now >= pDate && now <= endDate) {
        return "Ongoing";
      }
    }
    return "Upcoming";
  };

  const getPlanStatusCls = (status: string) => {
    switch (status) {
      case "Ongoing":
        return "bg-sky-500/15 border-sky-500/30 text-sky-400";
      case "Completed":
        return "bg-zinc-800/40 border-zinc-700/40 text-zinc-400";
      case "Cancelled":
        return "bg-rose-500/15 border-rose-500/30 text-rose-400";
      default:
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="flex-1 flex flex-col bg-[#070709] relative overflow-hidden font-sans w-full h-full text-left"
    >
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-white/[0.04] bg-[#0E0E12]/95 backdrop-blur-md h-14 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-full text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 leading-tight">
            <h3 className="text-sm font-bold text-white truncate">
              Plans ({circlePlans.length})
            </h3>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5 uppercase tracking-wider font-mono">
              {circle.name}
            </p>
          </div>
        </div>
      </div>

      {/* Plan List Scroll Area */}
      <div className="flex-1 overflow-y-auto scrollbar-none p-5 pb-24">
        {circlePlans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in select-none">
            <div className="w-16 h-16 rounded-full bg-[#121217] flex items-center justify-center text-zinc-400 text-3xl mb-4 border border-white/5 shadow-inner">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-zinc-200">No plans yet</h4>
            <p className="text-[11.5px] text-zinc-500 max-w-[220px] text-center mt-1.5 leading-normal">
              Tap the "+" (Create) tab in the bottom bar to launch the first plan in this Circle!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {circlePlans.map((plan) => {
              const activityIcon = getPlanActivityIcon(plan);
              const statusLabel = getPlanStatusLabel(plan);
              const statusCls = getPlanStatusCls(statusLabel);
              const participantsCount = plan.members ? plan.members.filter((m: any) => m.joinState === "going" || m.joinState === "joined").length : 0;

              return (
                <motion.div
                  key={plan.id}
                  onClick={() => onNavigateToPlanDetails(plan.id)}
                  className="w-full bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] border border-white/5 rounded-2xl p-4 transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-[0.99] select-none text-left"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Thumbnail banner avatar */}
                    <div className="w-[52px] h-[52px] rounded-xl overflow-hidden border border-white/[0.06] shadow-md flex-shrink-0 relative bg-zinc-955">
                      <div className="absolute inset-0 bg-black/30 z-10" />
                      <img
                        src={plan.coverImage || getPlanCover(plan.category, plan.subcategory)}
                        alt={plan.title}
                        className="w-full h-full object-cover relative z-0 scale-100 group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Metadata Content */}
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm shrink-0 leading-none">{activityIcon}</span>
                        <h3 className="font-sans font-bold text-[13.5px] text-white tracking-wide truncate">
                          {plan.title}
                        </h3>
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-zinc-450 font-sans font-medium">
                        <span>📅 {plan.date || "Spontaneous"}</span>
                        <span>•</span>
                        <span>⏰ {plan.time || "Immediate"}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">📍 {plan.location || "Coordinated"}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-black uppercase tracking-wider ${statusCls}`}>
                          {statusLabel}
                        </span>
                        <span className="text-[9.5px] text-zinc-500 font-sans">
                          👥 {participantsCount} {participantsCount === 1 ? "participant" : "participants"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center flex-shrink-0 ml-3">
                    <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
