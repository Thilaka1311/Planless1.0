import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plan, UserProfile } from "../../../core/types";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";
import { getInitialsAvatar } from "../../../lib/mappers";
import { normalizeStatus } from "../../../lib/participantStatus";

interface ParticipantToggleBarProps {
  plan: Plan;
  userProfile: UserProfile;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  setSelectedParticipantForActions?: (person: any) => void;
  isHolding?: boolean;
  holdProgress?: number;
  onEditParticipants?: () => void;
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
  isHolding = false,
  holdProgress = 0,
  onEditParticipants,
}) => {
  const myMemberEntry = plan.members.find(m =>
    m.userId === userProfile.user_id ||
    (userProfile.dbUuid && m.userUuid === userProfile.dbUuid)
  );

  const isJoined = myMemberEntry ? (myMemberEntry.joinState === "JOINED") : false;

  const maxSpots = React.useMemo(() => {
    return plan.maxSpots || (plan.category === "movies" ? 10 : plan.category === "sports" ? 14 : 8);
  }, [plan.maxSpots, plan.category]);

  const currentCount = React.useMemo(() => {
    return plan.members.filter(m => m.joinState === "JOINED").length;
  }, [plan.members]);

  const getParticipantStatusList = React.useCallback(() => {
    const hostName = plan.creatorName || "Host";
    const hostAvatar = plan.creatorAvatar || getInitialsAvatar(hostName);

    const going: { name: string; avatar: string; status: string; isHost: boolean; userId: string }[] = [];
    const waitlist: { name: string; avatar: string; status: string; userId: string }[] = [];
    const delivered: { name: string; avatar: string; status: string; userId: string }[] = [];
    const skipped: { name: string; avatar: string; status: string; userId: string }[] = [];

    // Always put host first in going
    going.push({ name: hostName, avatar: hostAvatar, status: "JOINED", isHost: true, userId: plan.hostId });

    const hostUuid = plan.hostId;
    for (const m of plan.members) {
      if (m.userUuid === hostUuid || m.userId === hostUuid) continue;

      const entry = {
        name: m.name,
        avatar: m.avatar || getInitialsAvatar(m.name),
        userId: m.userUuid || m.userId,
      };

      const normalizedState = normalizeStatus(m.joinState);

      if (normalizedState === "JOINED") {
        going.push({ ...entry, status: "JOINED", isHost: false });
      } else if (normalizedState === "WAITLISTED") {
        waitlist.push({ ...entry, status: "WAITLISTED" });
      } else if (normalizedState === "INVITED") {
        delivered.push({ ...entry, status: "INVITED" });
      } else if (normalizedState === "SKIPPED") {
        skipped.push({ ...entry, status: "SKIPPED" });
      } else {
        delivered.push({ ...entry, status: "INVITED" });
      }
    }

    return { going, waitlist, delivered, skipped };
  }, [plan.creatorName, plan.creatorAvatar, plan.hostId, plan.members]);

  const planParticipants = React.useMemo(() => {
    const { going, waitlist, delivered, skipped } = getParticipantStatusList();
    const STATUS_ORDER: Record<string, number> = {
      joined: 1,
      waitlisted: 2,
      invited: 3,
      skipped: 4,
    };
    const all = [...going, ...waitlist, ...delivered, ...skipped];
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
            {/* Edit Participants — only shown when host passes onEditParticipants (review screen only) */}
            {onEditParticipants && (
              <motion.div
                variants={footerItemVariants}
                className="mt-3 mb-0.5"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onEditParticipants(); }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[11.5px] font-semibold text-white/60 hover:text-white/90 transition-colors select-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Participants
                </button>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
