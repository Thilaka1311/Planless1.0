import React from 'react';
import { ArrowLeft, ChevronRight, Plus, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface CircleMember {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface Circle {
  id: string;
  name: string;
  tagline?: string;
  groupPhoto?: string;
  groupImage?: string;
  lastPlan?: string;
  lastPlanTime?: string;
  members?: CircleMember[];
  avatars?: string[];
}

interface CircleHubScreenProps {
  circle: Circle;
  userPlans: any[];
  onBack: () => void;
  onSelectGeneralChat: () => void;
  onSelectPlanThread: (planId: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToSettings: () => void;
  feedPlans?: any[];
}

export const CircleHubScreen: React.FC<CircleHubScreenProps> = ({
  circle,
  userPlans,
  onBack,
  onSelectGeneralChat,
  onSelectPlanThread,
  onNavigateToCreate,
  onNavigateToSettings,
  feedPlans,
}) => {

  const getCirclePlans = (isActive: boolean): any[] => {
    const plansSource = feedPlans || userPlans || [];
    return plansSource.filter((p: any) => {
      const isCircleMatch = p.circleId === circle.id || p.circleId === circle.dbUuid;
      if (!isCircleMatch) return false;
      if (p.status === "cancelled") return false;

      const planTime = p.datetime ? new Date(p.datetime).getTime() : 0;
      const isTimePassed = !isNaN(planTime) && planTime > 0 && Date.now() >= planTime;
      const isCompleted = p.status === "completed" || p.isHappened || isTimePassed;

      return isActive ? !isCompleted : isCompleted;
    });
  };

  const activePlans = getCirclePlans(true);
  const completedPlans = getCirclePlans(false);

  // Helper to get compact matching emoji or icon representing each activity type
  const getPlanEmoji = (type: string | undefined, title: string): string => {
    const lowerType = (type || '').toLowerCase();
    if (lowerType.includes('badminton') || lowerType.includes('shuttle')) return '🏸';
    if (lowerType.includes('football') || lowerType.includes('soccer')) return '⚽';
    if (lowerType.includes('movie')) return '🎬';
    if (lowerType.includes('dining') || lowerType.includes('restaurant') || lowerType.includes('cafe')) return '🍽️';

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('badminton') || lowerTitle.includes('shuttle')) return '🏸';
    if (lowerTitle.includes('football') || lowerTitle.includes('soccer') || lowerTitle.includes('turf')) return '⚽';
    if (lowerTitle.includes('movie') || lowerTitle.includes('dune') || lowerTitle.includes('imax')) return '🎬';
    if (lowerTitle.includes('jazz') || lowerTitle.includes('speakeasy') || lowerTitle.includes('cocktail')) return '🎷';
    if (lowerTitle.includes('waffle') || lowerTitle.includes('burger') || lowerTitle.includes('dining')) return '🍽️';
    if (lowerTitle.includes('drinks') || lowerTitle.includes('beer') || lowerTitle.includes('bar')) return '🍻';
    
    if (lowerType === 'sports') return '⚽';
    if (lowerType === 'movies') return '🎬';
    if (lowerType === 'dining') return '🍽️';

    return '⚡';
  };

  const memberCount = circle.members ? circle.members.length : (circle.avatars ? circle.avatars.length : 12);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden select-none"
    >
      {/* HEADER SECTION */}
      <div 
        id="circle-hub-header" 
        className="px-6 pt-6 pb-4 flex items-center justify-between bg-[#050505] z-20"
      >
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-left min-w-0">
            <h2 className="font-sans font-black text-[22px] uppercase tracking-wide text-white truncate leading-tight">
              {circle.name}
            </h2>
            <p className="text-[12px] font-sans font-bold text-zinc-555 lowercase tracking-wide mt-0.5">
              {memberCount} members
            </p>
          </div>
        </div>

        {/* Circle Settings Cog Icon */}
        <button
          type="button"
          onClick={onNavigateToSettings}
          className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white hover:border-white/12 transition duration-200 active:scale-95 cursor-pointer flex-shrink-0"
          title="Circle Settings"
        >
          <Settings className="w-[18px] h-[18px] text-[#FF6B2C]" />
        </button>
      </div>

      {/* COMPACT STYLING SEPARATOR */}
      <div className="mx-6 border-b border-white/[0.06]" />

      {/* GENERAL CHAT NAVIGATION COMPACT ROW */}
      <div className="px-6 py-4">
        <button
          type="button"
          onClick={onSelectGeneralChat}
          className="w-full h-[58px] bg-[#0A0A0C] hover:bg-[#121215] border border-white/[0.04] px-4 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-[0.99] group text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <span className="text-[15px] font-sans font-bold text-[#FF6B2C] group-hover:text-white transition-colors tracking-wide">
              General Chat
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Soft unread notification dot */}
            <div className="w-2 h-2 rounded-full bg-[#FF6B2C]" />
            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-450 transition-colors" />
          </div>
        </button>
      </div>

      {/* COMPACT STYLING SEPARATOR */}
      <div className="mx-6 border-b border-white/[0.06]" />

      {/* ACTIVE PLANS BODY */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-5 pb-8 flex flex-col justify-between">
        
        <div>
          {/* Section title */}
          <div id="circle-hub-active-plans-label" className="text-[10px] font-sans font-black tracking-[0.16em] text-zinc-550 uppercase mb-3.5 text-left">
            Active Plans
          </div>

          {activePlans.length === 0 ? (
            /* EMPTY STATE */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="space-y-1">
                <h4 className="text-[14px] font-sans font-bold text-zinc-400 tracking-wide">
                  No active plans
                </h4>
                <p className="text-[12px] text-zinc-600 max-w-[220px] mx-auto leading-relaxed">
                  Create the first plan for this circle.
                </p>
              </div>
              <button
                type="button"
                onClick={onNavigateToCreate}
                className="py-3 px-6 rounded-xl bg-transparent hover:bg-white/[0.03] border border-[#FF6B2C]/40 text-[#FF6B2C] text-[11px] font-sans font-black tracking-widest uppercase transition-all duration-150 cursor-pointer"
              >
                + Create Plan
              </button>
            </div>
          ) : (
            /* ACTIVE PLANS STREAMLINED LIST */
            <div className="space-y-2 animate-fade-in">
              {activePlans.map((plan, index) => {
                const emoji = getPlanEmoji(plan.activity_type || plan.activityType, plan.title);

                return (
                  <button
                    key={plan.id || plan.plan_id}
                    type="button"
                    onClick={() => onSelectPlanThread(plan.id || plan.plan_id)}
                    className="w-full h-[62px] bg-transparent hover:bg-white/[0.02] border border-white/[0.03] hover:border-white/[0.08] px-4 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer group active:scale-[0.99] select-none text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-[20px] leading-none select-none flex-shrink-0">
                        {emoji}
                      </span>
                      <span className="text-[14.5px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate tracking-wide font-sans">
                        {plan.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Optional soft unread indicator dot for visual charm on first item */}
                      {index === 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MEMORIES / COMPLETED PLANS SECTION */}
          {completedPlans.length > 0 && (
            <div className="mt-8">
              <div className="text-[10px] font-sans font-black tracking-[0.16em] text-zinc-550 uppercase mb-3.5 text-left flex items-center gap-2 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                <span>Memories</span>
              </div>
              
              <div className="space-y-2 animate-fade-in">
                {completedPlans.map((plan) => {
                  const emoji = getPlanEmoji(plan.activity_type || plan.activityType, plan.title);

                  return (
                    <button
                      key={plan.id || plan.plan_id}
                      type="button"
                      onClick={() => onSelectPlanThread(plan.id || plan.plan_id)}
                      className="w-full h-[62px] bg-[#0A0A0C]/40 hover:bg-white/[0.02] border border-white/[0.02] hover:border-white/[0.06] px-4 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer group active:scale-[0.99] select-none text-left opacity-75 hover:opacity-100"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-[20px] leading-none select-none flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                          {emoji}
                        </span>
                        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                          <span className="text-[14px] font-bold text-zinc-400 group-hover:text-white transition-colors truncate tracking-wide font-sans">
                            {plan.title}
                          </span>
                          <span className="text-[10px] text-zinc-600 font-sans tracking-wide">
                            Completed Memory
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SEPARATOR & IN-FLOW + CREATE PLAN BUTTON */}
        <div className="mt-8 space-y-4">
          <div className="border-b border-white/[0.06]" />
          
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="w-full py-4 px-6 rounded-xl bg-transparent hover:bg-white/[0.02] border border-dashed border-[#FF6B2C]/30 hover:border-[#FF6B2C]/60 text-[#FF6B2C] hover:text-[#FF854C] text-[12px] font-sans font-black tracking-[0.14em] uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>

      </div>

    </motion.div>
  );
};
