import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Plan, NotificationItem } from "../../../core/types";
import { usePlanVisibility } from "../hooks/usePlanVisibility";
import { useHoldToAccept } from "../hooks/useHoldToAccept";
import { HoldToAcceptOverlay } from "./HoldToAcceptOverlay";
import { usePlansStore } from "../../plans/state/PlansContext";
import { useToast } from "../../../shared/contexts/ToastContext";
import { useLivePlan } from "../../plans/hooks/useLivePlan";

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

const footerContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const footerItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 220,
      damping: 20
    }
  },
  exit: { 
    opacity: 0, 
    y: 8,
    transition: {
      duration: 0.15,
      ease: 'easeInOut'
    }
  }
};

export interface PlanCardProps {
  planId: string;
  userProfile: UserProfile;
  interestedPlanIds: string[];
  setSelectedPlan: (planId: string | null) => void;
  setPaymentConfirmationPlan: (planId: string | null) => void;
  walletBalance: number;
  handleToggleJoin: (planId: string) => void;
  setShowPaymentSuccess: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeCardId: string | null;
  onSelectCard: (planId: string) => void;
  handleSnoozePlan: (planId: string) => void;
  waitlistPlan?: (planId: string, userProfile: any) => void;
  onNavigateToPlanChat?: (planId: string) => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  planId,
  userProfile,
  interestedPlanIds,
  setSelectedPlan,
  setPaymentConfirmationPlan,
  walletBalance,
  handleToggleJoin,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  setNotifications,
  activeCardId,
  onSelectCard,
  handleSnoozePlan,
  waitlistPlan,
  onNavigateToPlanChat,
}) => {
  const plan = useLivePlan(planId);
  const { showToast } = useToast();
  if (!plan) return null;
  const {
    isJoined,
    isWaitlisted,
    isDeadlinePassed,
    formattedDateAndTime,
    getParticipantStatusList,
    displayActivityName,
    glowStyle,
    coverToUse,
    maxSpots,
    currentCount,
    isFull,
    groupName,
  } = usePlanVisibility(plan, userProfile);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const { markPlanSeen } = usePlansStore();

  React.useEffect(() => {
    if (!cardRef.current || !userProfile.user_id) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const rawId = plan.dbUuid || plan.id;
          const cleanId = rawId.replace("-loop-prev-dup", "").replace("-loop-next-dup", "");
          const myParticipant = plan.members.find(
            m => m.userId === userProfile.user_id || m.userUuid === userProfile.dbUuid
          );
          if (myParticipant && myParticipant.joinState === "delivered") {
            console.log(`[Home Feed Visibility Trigger] Transitioning delivered -> seen for plan: ${plan.title}`);
            const resolvedUserUuid = userProfile.dbUuid || userProfile.user_id;
            markPlanSeen(cleanId, resolvedUserUuid).catch(console.error);
          }
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [plan.id, userProfile.user_id, plan.members, markPlanSeen]);

  const {
    holdProgress,
    isHolding,
    isSuccess,
    successMode,
    isExpanded,
    setIsExpanded,
    dragY,
    startHolding,
    stopHolding,
    handlePointerMove,
    cancelHolding,
  } = useHoldToAccept({
    plan,
    userProfile,
    isDeadlinePassed,
    isJoined,
    isWaitlisted,
    isFull,
    handleToggleJoin: (p) => handleToggleJoin(p.id),
    setShowPaymentSuccess: (p) => setShowPaymentSuccess(p ? p.id : null),
    setShowWaitlistSuccess: (p) => setShowWaitlistSuccess ? setShowWaitlistSuccess(p ? p.id : null) : undefined,
    setNotifications,
    activeCardId,
    onSelectCard,
    handleSnoozePlan,
    waitlistPlan: waitlistPlan ? (id, up) => waitlistPlan(id, up) : undefined,
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'GOING':
        return 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30';
      case 'WAITLIST':
      case 'WAITLISTED':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'DELIVERED':
        return 'bg-white/10 text-white/90 border border-white/20';
      case 'SEEN':
        return 'bg-white/5 text-white/75 border border-white/10';
      case 'SKIPPED':
        return 'bg-white/5 text-white/50 border border-white/10';
      default:
        return 'bg-white/5 text-white/60 border border-white/10';
    }
  };

  const calendarDay = React.useMemo(() => {
    if (plan.datetime) {
      const d = new Date(plan.datetime);
      if (!isNaN(d.getTime())) {
        return String(d.getDate());
      }
    }
    const fallbackDate = plan.response_deadline_at ? new Date(plan.response_deadline_at) : new Date();
    return String(fallbackDate.getDate());
  }, [plan.datetime, plan.response_deadline_at]);

  const planParticipants = React.useMemo(() => {
    const { going, waitlist, delivered, seen, skipped } = getParticipantStatusList();
    const STATUS_ORDER: Record<string, number> = {
      going: 1,
      waitlist: 2,
      seen: 3,
      delivered: 4,
      skipped: 5,
    };
    const all = [...going, ...waitlist, ...seen, ...delivered, ...skipped];
    return all.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status.toLowerCase()] || 99;
      const orderB = STATUS_ORDER[b.status.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [getParticipantStatusList]);

  const progressPercent = Math.min(100, Math.round((currentCount / maxSpots) * 100));
  
  const goingCount = planParticipants.filter(p => p.status.toLowerCase() === "going").length;
  const isHost = plan.hostId === userProfile.user_id || plan.hostId === userProfile.dbUuid;
  const isParticipant = isJoined || isHost;

  return (
    <motion.div
      ref={cardRef}
      id={`plan-card-${plan.id}`}
      animate={{ 
        scale: isHolding ? 0.97 : 1,
      }}
      transition={{ 
        scale: { type: 'spring', stiffness: 350, damping: 25 },
      }}
      onPointerDown={startHolding}
      onPointerMove={handlePointerMove}
      onPointerUp={stopHolding}
      onPointerLeave={cancelHolding}
      onClick={() => onSelectCard(plan.id)}
      className="h-full w-full snap-start snap-always relative rounded-[32px] overflow-hidden border border-white/[0.08] flex flex-col justify-end bg-[#050505] shadow-2xl shadow-black/80 group cursor-pointer flex-shrink-0 mb-0"
    >
      {/* Full-bleed high-contrast premium card poster cover image */}
      <img 
        src={coverToUse} 
        alt={plan.title} 
        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.80] transition-transform duration-700 group-hover:scale-105 pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Shadow gradient mesh overlay over imagery to guarantee extreme textual readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-0" />
      
      {/* Top Row Badges of the event poster */}
      <div 
        className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10 select-none transition-opacity duration-75"
        style={{ opacity: isHolding ? Math.max(0.08, 1 - (holdProgress / 100) * 0.92) : 1 }}
      >
        {/* Group badge - dark glassmorphic pill precisely matching image */}
        <div 
          className="bg-black/55 backdrop-blur-md px-4.5 rounded-full text-[11px] font-sans font-black text-white tracking-[0.16em] flex items-center justify-center uppercase select-none pointer-events-auto border border-white/[0.08] shadow-2xl"
          style={{ height: '36px' }}
        >
          {groupName.toUpperCase()}
        </div>

        {/* Circle category decoration icon with dynamic activity emoji */}
        <div className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/[0.08] flex items-center justify-center shadow-lg pointer-events-auto">
          <span className="text-[18px] leading-none select-none">{getPlanActivityIcon(plan)}</span>
        </div>
      </div>

      {/* EVENT INFO DISPLAYED DIRECTLY ON POSTER */}
      <div 
        className="px-5 pb-0 z-10 text-left w-full select-none relative -translate-y-6 transition-opacity duration-75"
        style={{ opacity: isHolding ? Math.max(0.08, 1 - (holdProgress / 100) * 0.92) : 1 }}
      >
        {/* Plan title */}
        <h2 className="font-sans font-black text-[30px] sm:text-[32px] text-white tracking-tight leading-none mb-1 drop-shadow-[0_2.5px_8px_rgba(0,0,0,0.95)]">
          {displayActivityName}
        </h2>

        {/* Stacked Metadata Rows: Calendar Badge style */}
        <div className="flex flex-col gap-1.5 text-white drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.85)] font-semibold pl-0.5 mb-3">
          <div className="flex items-center gap-2.5 text-[12px] font-mono tracking-wide">
            {/* Mini calendar block */}
            <div className="w-[18px] h-[19px] rounded-[3.5px] bg-[#FFFFFF] border border-black/40 overflow-hidden flex flex-col items-center flex-shrink-0 shadow-md">
              <div className="w-full h-[5px] bg-[#EF4444]" />
              <div className="flex-1 flex items-center justify-center text-[9px] font-sans font-black text-[#1C1C1E] leading-none mt-[0.5px]">
                {calendarDay}
              </div>
            </div>
            
            <span className="uppercase text-[12.5px] font-mono tracking-wider text-white font-bold">
              {formattedDateAndTime.includes('•') ? (
                <>
                  {formattedDateAndTime.split('•')[0]}<span className="text-[#FF6B2C] font-sans font-black mx-1.5">•</span>{formattedDateAndTime.split('•')[1]}
                </>
              ) : (
                formattedDateAndTime
              )}
            </span>
          </div>
        </div>
      </div>

      {/* COMPACT SOCIAL PARTICIPANT STRIP (FLOATING CAPSULE GLASS PANEL) */}
      <motion.div 
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerLeave={(e) => e.stopPropagation()}
        onPointerCancel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="mx-4 mb-[88px] z-10 relative select-none cursor-pointer overflow-hidden rounded-[24px] px-4 pt-3 pb-3 border"
        style={{
          background: 'rgba(8, 8, 8, 0.72)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          opacity: isHolding ? Math.max(0.08, 1 - (holdProgress / 100) * 0.92) : 1,
        }}
        animate={{
          height: isExpanded ? 'auto' : 84
        }}
        transition={{
          type: 'spring',
          damping: 19,
          stiffness: 200,
        }}
      >
        {/* Row 1: Host info and Joined stack indicator */}
        <div className="flex items-center justify-between">
          {/* LEFT SIDE: Host Avatar & Info */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full ring-2 ring-black/75 overflow-hidden bg-zinc-800 flex-shrink-0">
              <img 
                src={plan.creatorAvatar || "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"} 
                alt={plan.creatorName || "Host"} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col text-left justify-center">
              <span className="text-zinc-400 font-bold text-[9.5px] uppercase tracking-wider leading-none mb-0.5 select-none">
                HOSTED BY
              </span>
              <span className="text-white font-semibold text-[13.5px] sm:text-[14px] tracking-tight leading-none">
                {plan.creatorName || "Host"}
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Invitation summary & Chevron */}
          <div className="flex items-center gap-1.5">
            <AnimatePresence initial={false} mode="popLayout">
              {!isExpanded && (
                <motion.span
                  key="invited-count"
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="text-[11.5px] text-zinc-400 font-medium select-none whitespace-nowrap"
                >
                  +{planParticipants.filter(p => p.name !== (plan.creatorName || "Host")).length} Invited
                </motion.span>
              )}
            </AnimatePresence>
            <motion.span 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="text-[11px] text-zinc-400 select-none font-bold pr-0.5 inline-block"
            >
              ▼
            </motion.span>
          </div>
        </div>

        {/* Thick Premium Progress Bar */}
        <div 
          className="w-full rounded-full overflow-hidden mt-2.5" 
          style={{ height: '9px', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div 
            className="h-full bg-[#FF6B2C] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,107,44,0.55)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Expandable participant list */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="participants-list-container"
              initial="hidden"
              animate="show"
              exit="exit"
              variants={footerContainerVariants}
              className="overflow-hidden text-left"
            >
              <motion.div 
                variants={footerItemVariants}
                className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase mt-4 mb-1.5 px-0.5 select-none"
              >
                Participants
              </motion.div>
              <motion.div 
                variants={footerItemVariants}
                className="w-full h-px bg-white/[0.06] mb-2" 
              />
              <div 
                className="max-h-[145px] overflow-y-auto scrollbar-none space-y-1 pr-1 select-text"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {planParticipants.map((person, pIdx) => {
                  return (
                    <motion.div 
                      key={pIdx} 
                      variants={footerItemVariants}
                      className="flex items-center justify-between py-1.5 px-0.5"
                    >
                      {/* Left: Avatar & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={person.avatar} 
                          alt={person.name} 
                          className="w-5 h-5 rounded-full object-cover border border-white/10 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-sans text-[13px] text-white/95 font-medium leading-none truncate">
                          {person.name}
                        </span>
                      </div>

                      {/* Right: status chip */}
                      <span className={`text-[8.5px] font-sans font-bold tracking-wider px-2 py-1.5 rounded-[5px] uppercase flex-shrink-0 leading-none ${getStatusClasses(person.status.toUpperCase())}`}>
                        {person.status}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Coordination / Chat Section */}
              {isParticipant && (
                <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2 select-none"
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerMove={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {goingCount >= 2 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToPlanChat?.(plan.id);
                      }}
                      className="w-full py-2.5 px-4 rounded-[12px] bg-[#FF6B2C] text-white hover:bg-[#FF854C] text-[11.5px] font-sans font-black tracking-[0.12em] uppercase transition-all duration-200 text-center cursor-pointer shadow-md active:scale-[0.98]"
                    >
                      Open Plan Chat
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-[12px] bg-zinc-900/40 border border-zinc-800/60 border-dashed text-center">
                      <span className="text-[10.5px] font-sans font-medium text-zinc-550 uppercase tracking-wide">
                        ⏳ Chat unlocks when another attendee joins.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        <HoldToAcceptOverlay
          planId={plan.id}
          holdProgress={holdProgress}
          isHolding={isHolding}
          isFull={isFull}
          formattedDateAndTime={formattedDateAndTime}
        />

        {isSuccess && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="absolute inset-0 bg-[#0c0c0e]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center pointer-events-none"
          >
            {successMode === "waitlist" ? (
              <>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.25)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <span className="text-base font-sans font-black tracking-[0.2em] text-amber-400 mt-6 uppercase">WAITLISTED</span>
                <span className="text-xs font-sans text-zinc-400 mt-2">Added to Waitlist</span>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <span className="text-base font-sans font-black tracking-[0.2em] text-emerald-400 mt-6 uppercase">JOINED</span>
                <span className="text-xs font-sans text-zinc-400 mt-2">Opening wallet split payment popup...</span>
              </>
            )}
          </motion.div>
        )}

        {isDeadlinePassed && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-sans font-black tracking-[0.2em] text-zinc-400 mt-4 uppercase">RESPONSES CLOSED</span>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
