import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plan, UserProfile } from "../../../core/types";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";
import { getInitialsAvatar } from "../../../lib/mappers";
import { normalizeStatus } from "../../../lib/participantStatus";
import { Calendar } from "lucide-react";

interface ParticipantToggleBarProps {
  plan: Plan;
  userProfile: UserProfile;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  setSelectedParticipantForActions?: (person: any) => void;
  isHolding?: boolean;
  holdProgress?: number;
  onEditParticipants?: () => void;
  showExpandableDetails?: boolean;
  planTitle?: string;
  formattedDateAndTime?: string;
  setSelectedPlan?: (planId: string | null) => void;
  hideHost?: boolean;
}

const footerItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 22
    }
  },
};

function formatStatusLabel(status: string): string {
  const val = status.toLowerCase();
  if (val === 'joined') return 'Joined';
  if (val === 'waitlisted') return 'Waitlisted';
  if (val === 'invited') return 'Invited';
  if (val === 'skipped') return 'Skipped';
  return status;
}

export const ParticipantToggleBar: React.FC<ParticipantToggleBarProps> = ({
  plan,
  userProfile,
  isExpanded,
  setIsExpanded,
  setSelectedParticipantForActions,
  isHolding = false,
  holdProgress = 0,
  onEditParticipants,
  showExpandableDetails = false,
  planTitle = "",
  formattedDateAndTime = "",
  setSelectedPlan,
  hideHost = false,
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

    // Always put host first in going, unless showExpandableDetails is true (dedicated Host section)
    if (!showExpandableDetails && !hideHost) {
      going.push({ name: hostName, avatar: hostAvatar, status: "JOINED", isHost: true, userId: plan.hostId });
    }

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
  }, [plan.creatorName, plan.creatorAvatar, plan.hostId, plan.members, showExpandableDetails]);

  const planParticipants = React.useMemo(() => {
    const { going, waitlist, delivered, skipped } = getParticipantStatusList();
    
    const sortAlphabetically = (list: typeof going) => {
      return [...list].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    };

    return [
      ...sortAlphabetically(going),
      ...sortAlphabetically(waitlist),
      ...sortAlphabetically(delivered),
      ...sortAlphabetically(skipped)
    ];
  }, [getParticipantStatusList]);

  const sortedGroups = React.useMemo(() => {
    const { going, waitlist, delivered, skipped } = getParticipantStatusList();
    
    const sortAlphabetically = (list: typeof going) => {
      return [...list].sort((a, b) => 
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
    };

    return {
      going: sortAlphabetically(going),
      waitlist: sortAlphabetically(waitlist),
      pending: sortAlphabetically(delivered),
      skipped: sortAlphabetically(skipped),
    };
  }, [getParticipantStatusList]);

  const invitedList = React.useMemo(() => {
    const list = [...sortedGroups.pending, ...sortedGroups.waitlist, ...sortedGroups.skipped];
    return list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [sortedGroups]);

  const progressPercent = Math.min(100, Math.round((currentCount / maxSpots) * 100));

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

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isExpanded && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isExpanded]);

  return (
    <motion.div
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      className="mx-3 mb-10 z-10 relative select-none cursor-pointer overflow-hidden rounded-[24px] px-4 pt-4 pb-4 border no-hold animate-height"
      style={{
        background: 'rgba(8, 8, 8, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255, 255, 255, 0.06)',
        opacity: isHolding ? Math.max(0.08, 1 - (holdProgress / 100) * 0.92) : 1,
      }}
      animate={{
        height: isExpanded ? 'auto' : (showExpandableDetails ? 112 : 84)
      }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 24,
        mass: 0.8
      }}
    >
      {showExpandableDetails ? (
        <div className="flex flex-col text-left select-text w-full">
          {/* Row 1: Title (left) & Action Group Column (right) */}
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-col text-left min-w-0 flex-1 pr-4">
              <h2 className="font-sans font-black text-[22px] text-white tracking-tight leading-none truncate mb-1.5 drop-shadow-sm">
                {planTitle || plan.title}
              </h2>
              {/* Date & Time (left-aligned below the title) */}
              <div className="flex items-center gap-1.5 text-white/80 text-[11px] font-mono tracking-wide font-bold mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-white/50 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-white truncate">
                  {formattedDateAndTime}
                </span>
              </div>
            </div>
            
            {/* Right Column: host info + chevron */}
            <div className="flex flex-col items-end flex-shrink-0 gap-2 mt-0.5">
              {/* Host row: "Hosted by Name" + avatar */}
              <div className="flex items-center gap-2">
                {!isExpanded && (
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-zinc-500 font-bold tracking-wider leading-none select-none">
                      Hosted by
                    </span>
                    <span className="text-[11px] text-white font-semibold tracking-tight leading-none truncate max-w-[72px] select-none">
                      {plan.creatorName || "Host"}
                    </span>
                  </div>
                )}
                {!isExpanded && (
                  <div className="flex-shrink-0">
                    <UserAvatar
                      src={plan.creatorAvatar}
                      alt={plan.creatorName || "Host"}
                      size="w-8 h-8"
                      className="border border-white/10"
                    />
                  </div>
                )}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="text-[11px] text-zinc-400 select-none font-bold pr-0.5 inline-block"
                >
                  ▼
                </motion.span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full">
          {hideHost ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full ring-2 ring-black/75 overflow-hidden bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm flex-shrink-0 select-none">
                👥
              </div>
              <div className="flex flex-col text-left justify-center">
                <span className="text-zinc-400 font-bold text-[9.5px] tracking-wider leading-none mb-0.5 select-none uppercase">
                  Participants
                </span>
                <span className="text-white font-semibold text-[13.5px] sm:text-[14px] tracking-tight leading-none">
                  {currentCount} {currentCount === 1 ? 'Person' : 'People'} Going
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full ring-2 ring-black/75 overflow-hidden bg-zinc-800 flex-shrink-0">
                <UserAvatar
                  src={plan.creatorAvatar}
                  alt={plan.creatorName || "Host"}
                  size="w-9 h-9"
                />
              </div>
              <div className="flex flex-col text-left justify-center">
                <span className="text-zinc-400 font-bold text-[9.5px] tracking-wider leading-none mb-0.5 select-none">
                  Hosted by
                </span>
                <span className="text-white font-semibold text-[13.5px] sm:text-[14px] tracking-tight leading-none">
                  {plan.creatorName || "Host"}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3.5 flex-shrink-0">
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
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="text-[11px] text-zinc-400 select-none font-bold pr-0.5 inline-block"
            >
              ▼
            </motion.span>
          </div>
        </div>
      )}

      {showExpandableDetails && (
        <div className="flex items-center gap-4 w-full mt-3">
          <div
            className="flex-1 rounded-full overflow-hidden bg-white/10"
            style={{ height: '5px' }}
          >
            <div
              className="h-full bg-[#FF6B2C] rounded-full transition-all duration-500 ease-out shadow-[0_0_6px_rgba(255,107,44,0.45)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[12px] font-mono text-white/90 font-bold select-none leading-none flex-shrink-0">
            {currentCount}/{maxSpots}
          </span>
        </div>
      )}

      {!showExpandableDetails && (
        <div
          className="w-full rounded-full overflow-hidden mt-2.5"
          style={{ height: '9px', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        >
          <div
            className="h-full bg-[#FF6B2C] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,107,44,0.55)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Expanded content — always mounted, visibility driven by isExpanded.
          This eliminates the AnimatePresence mount/unmount race condition where
          a staggered exit animation could still be running when isExpanded flips
          back to true, leaving the participant list briefly blank. */}
      <motion.div
        aria-hidden={!isExpanded}
        animate={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none' }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        className="overflow-hidden text-left"
        style={{ pointerEvents: isExpanded ? undefined : 'none' }}
      >
        {showExpandableDetails && (
          <>
            <div className="pt-5" />
            <div className="flex flex-col text-left gap-1.5">
              <span className="text-[9.5px] font-sans font-bold tracking-wider text-zinc-500 leading-none select-none">
                Hosted by
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                {isExpanded && (
                  <div className="flex-shrink-0">
                    <UserAvatar
                      src={plan.creatorAvatar}
                      alt={plan.creatorName || "Host"}
                      size="w-8 h-8"
                      className="border border-white/10"
                    />
                  </div>
                )}
                <span className="text-white font-semibold text-[13.5px] tracking-tight leading-none">
                  {plan.creatorName || "Host"}
                </span>
              </div>
            </div>
          </>
        )}

        {showExpandableDetails ? (
          <div className="pt-6" />
        ) : (
          <div className="w-full h-px bg-white/[0.06] my-3.5" />
        )}

        <div
          ref={scrollContainerRef}
          className="max-h-[200px] overflow-y-auto scrollbar-none space-y-4 pr-1 select-text"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {showExpandableDetails ? (
            /* Adaptive home card layout */
            <>
              {/*Going Section / Empty State */}
              {sortedGroups.going.length === 0 ? (
                <p className="text-[12px] font-normal text-white/50 leading-none select-none pl-0.5 py-1">
                  No one has joined yet.
                </p>
              ) : (
                <div>
                  <div className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 mt-1 mb-2 px-0.5 select-none">
                    Going ({sortedGroups.going.length})
                  </div>
                  <div className="space-y-1">
                    {sortedGroups.going.map((person, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex items-center justify-between py-1.5 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer"
                        onClick={(e) => {
                          if (setSelectedParticipantForActions) {
                            e.stopPropagation();
                            setSelectedParticipantForActions(person);
                          }
                        }}
                      >
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invited Section (Adaptive Layout) */}
              {invitedList.length > 0 && (
                invitedList.length <= 3 ? (
                  /* Case 1: 3 or fewer invited - show inline list */
                  <div className="mt-6">
                    <div className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 mt-1 mb-2 px-0.5 select-none">
                      Invited
                    </div>
                    <div className="space-y-1">
                      {invitedList.map((person, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between py-1.5 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => {
                            if (setSelectedParticipantForActions) {
                              e.stopPropagation();
                              setSelectedParticipantForActions(person);
                            }
                          }}
                        >
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
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Case 2: 4 or more invited - show compact overlapping avatar stack CTA */
                  <div
                    className="mt-6 flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer pointer-events-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (setSelectedPlan) {
                        sessionStorage.setItem('expand_participants_once', plan.id);
                        setSelectedPlan(plan.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Overlapping Avatar Stack */}
                      <div className="flex -space-x-1.5 isolate">
                        {invitedList.slice(0, 3).map((person, idx) => (
                          <div key={idx} className="relative z-10">
                            <UserAvatar
                              src={person.avatar}
                              alt={person.name}
                              size="w-[22px] h-[22px]"
                              className="border border-[#141416] rounded-full"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-[11.5px] font-sans font-bold text-zinc-400">
                        +{invitedList.length - 3}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-semibold text-zinc-400 hover:text-white transition-colors">
                      <span>View Invited</span>
                      <span className="text-[11px] font-semibold pr-1">→</span>
                    </div>
                  </div>
                )
              )}
            </>
          ) : (
            /* Immersive detail view layout (displays everyone in actual RSVP state) */
            <>
              {[
                { id: 'going', label: 'Going', items: sortedGroups.going },
                { id: 'pending', label: 'Pending', items: sortedGroups.pending },
                { id: 'waitlist', label: 'Waitlist', items: sortedGroups.waitlist },
                { id: 'skipped', label: 'Skipped', items: sortedGroups.skipped },
              ]
                .filter((g) => g.items.length > 0)
                .map((group, gIdx) => (
                  <div key={group.id} className={gIdx > 0 ? "mt-4" : ""}>
                    <div className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 mt-1 mb-1.5 px-0.5 select-none">
                      {group.label} ({group.items.length})
                    </div>
                    <div className="w-full h-px bg-white/[0.06] mb-2" />
                    <div className="space-y-1">
                      {group.items.map((person, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between py-1.5 px-0.5 hover:bg-white/[0.02] rounded-lg transition-colors cursor-pointer"
                          onClick={(e) => {
                            if (setSelectedParticipantForActions) {
                              e.stopPropagation();
                              setSelectedParticipantForActions(person);
                            }
                          }}
                        >
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
        {onEditParticipants && (
          <div
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
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
