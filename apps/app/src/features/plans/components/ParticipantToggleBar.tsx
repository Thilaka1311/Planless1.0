import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plan, UserProfile } from "../../../core/types";
import { UserAvatar } from "../../../shared/components/UserAvatar";
import { usePlanVisibility } from "../../home/hooks/usePlanVisibility";

interface ParticipantToggleBarProps {
  plan: Plan;
  userProfile: UserProfile;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  setSelectedParticipantForActions?: (person: any) => void;
  onNavigateToPlanChat?: (planId: string) => void;
  isHolding?: boolean;
  holdProgress?: number;
}

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

export const ParticipantToggleBar: React.FC<ParticipantToggleBarProps> = ({
  plan,
  userProfile,
  isExpanded,
  setIsExpanded,
  setSelectedParticipantForActions,
  onNavigateToPlanChat,
  isHolding = false,
  holdProgress = 0,
}) => {
  const {
    isJoined,
    getParticipantStatusList,
    maxSpots,
    currentCount,
  } = usePlanVisibility(plan, userProfile);

  const planParticipants = React.useMemo(() => {
    const { going, waitlist, delivered, seen, skipped } = getParticipantStatusList();
    const STATUS_ORDER: Record<string, number> = {
      joined: 1,
      waitlisted: 2,
      invited: 3,
      skipped: 4,
    };
    const all = [...going, ...waitlist, ...seen, ...delivered, ...skipped];
    return all.sort((a, b) => {
      const orderA = STATUS_ORDER[a.status.toLowerCase()] || 99;
      const orderB = STATUS_ORDER[b.status.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [getParticipantStatusList]);

  const progressPercent = Math.min(100, Math.round((currentCount / maxSpots) * 100));
  const isHost = plan.hostId === userProfile.user_id || plan.hostId === userProfile.dbUuid;
  const isParticipant = isJoined || isHost;

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'JOINED':
        return 'bg-emerald-500/20 text-emerald-350 border border-emerald-500/30';
      case 'WAITLISTED':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'INVITED':
        return 'bg-white/10 text-white/90 border border-white/20';
      case 'SKIPPED':
        return 'bg-white/5 text-white/50 border border-white/10';
      default:
        return 'bg-white/5 text-white/60 border border-white/10';
    }
  };

  return (
    <motion.div 
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      className="mx-4 mb-4 z-10 relative select-none cursor-pointer overflow-hidden rounded-[24px] px-4 pt-3 pb-3 border no-hold"
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
            <UserAvatar
              src={plan.creatorAvatar}
              alt={plan.creatorName || "Host"}
              size="w-9 h-9"
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

      {/* Thick Progress Bar */}
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
                    className="flex items-center justify-between py-1.5 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (setSelectedParticipantForActions) {
                        e.stopPropagation();
                        setSelectedParticipantForActions(person);
                      }
                    }}
                  >
                    {/* Left: Avatar & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={person.avatar}
                        alt={person.name}
                        size="w-5 h-5"
                        className="border border-white/10"
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
            {isParticipant && onNavigateToPlanChat && (
              <div className="mt-4 pt-3 border-t border-white/[0.04] space-y-2 select-none"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToPlanChat(plan.id);
                  }}
                  className="w-full py-2.5 px-4 rounded-[12px] bg-[#FF6B2C] text-white hover:bg-[#FF854C] text-[11.5px] font-sans font-black tracking-[0.12em] uppercase transition-all duration-200 text-center cursor-pointer shadow-md active:scale-[0.98]"
                >
                  Open Plan Chat
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
