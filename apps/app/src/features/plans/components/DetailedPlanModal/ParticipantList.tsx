import React from "react";
import { Check, Hourglass } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Plan, UserProfile } from "../../../../core/types";
import { UserAvatar } from "../../../../shared/components/UserAvatar";
import { sortParticipantsByResponseOrder } from "../../../../lib/mappers";

interface ParticipantListProps {
  selectedPlan: Plan;
  activeUserId?: string;
  userProfile: UserProfile;
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  setSelectedParticipantForActions: (person: any) => void;
  progressPercent: number;
}

const drawerContainerVariants = {
  hidden: { height: 0, opacity: 0 },
  show: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { type: 'spring', duration: 0.24, bounce: 0 },
      opacity: { duration: 0.15 },
      staggerChildren: 0.04,
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { type: 'spring', duration: 0.22, bounce: 0 },
      opacity: { duration: 0.12 },
      staggerChildren: 0.02,
      staggerDirection: -1 as const,
    }
  }
};

const drawerItemVariants = {
  hidden: { opacity: 0, y: -10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 400, damping: 28 }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.12 }
  }
};

export const ParticipantList: React.FC<ParticipantListProps> = ({
  selectedPlan,
  activeUserId,
  userProfile,
  isExpanded,
  setIsExpanded,
  setSelectedParticipantForActions,
  progressPercent,
}) => {
  const planParticipants = React.useMemo(() => {
    const sorted = sortParticipantsByResponseOrder(selectedPlan.members);
    const going = sorted.filter(m => m.joinState === "going").map(m => ({ ...m, status: "GOING" }));
    const waitlist = sorted.filter(m => m.joinState === "waitlist").map(m => ({ ...m, status: "WAITLISTED" }));
    const seen = sorted.filter(m => m.joinState === "seen").map(m => ({ ...m, status: "SEEN" }));
    const skipped = sorted.filter(m => m.joinState === "skipped").map(m => ({ ...m, status: "SKIPPED" }));
    const delivered = sorted.filter(m => m.joinState === "delivered").map(m => ({ ...m, status: "DELIVERED" }));

    return [...going, ...waitlist, ...seen, ...skipped, ...delivered];
  }, [selectedPlan.members]);

  return (
    <div id="immersive-participants-block" className="px-6 select-none text-left">
      {/* MINIMAL PROGRESS ACCENT LINE */}
      <div id="immersive-progress-block" className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden mt-2 mb-4">
        <motion.div
          id="immersive-progress-bar"
          className="h-full bg-gradient-to-r from-[#FF6B2C] to-[#FF854C] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </div>

      {/* Clickable Summary Row acting as the trigger */}
      <div
        id="immersive-summary-trigger"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer py-4 px-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/[0.04] transition-colors group select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 leading-none">
          <span className="text-[13px] font-sans font-bold text-white tracking-wide">
            Participants
          </span>
          <div className="flex items-center flex-shrink-0">
            {planParticipants.slice(0, 3).map((person, idx) => (
              <UserAvatar
                key={idx}
                src={person.avatar}
                alt={person.name}
                size="w-5 h-5"
                className="border-[1.5px] border-[#050505]"
                style={{ marginLeft: idx > 0 ? '-6px' : '0px', zIndex: 10 - idx }}
              />
            ))}
            {planParticipants.length > 3 && (
              <span className="text-[9px] text-zinc-500 font-bold ml-1 select-none font-mono">
                +{planParticipants.length - 3}
              </span>
            )}
          </div>

          <div className="hidden xs:flex items-center min-w-0 text-[12px] text-zinc-400 font-normal tracking-tight select-none ml-auto mr-2">
            <span className="mr-1 flex-shrink-0 whitespace-nowrap">Hosted by</span>
            <span className="text-zinc-300 font-semibold whitespace-nowrap">{selectedPlan.creatorName || "Host"}</span>
          </div>
        </div>

        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="text-[10px] text-zinc-450 font-bold pr-0.5 group-hover:text-zinc-200 transition-colors flex items-center justify-center flex-shrink-0 ml-1.5"
        >
          ▼
        </motion.span>
      </div>

      {/* Expandable participant list drawer */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="immersive-participants-drawer"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={drawerContainerVariants}
            className="overflow-hidden"
          >
            <div className="pt-1.5 pb-2.5 space-y-2 select-text">
              {planParticipants.map((person, pIdx) => {
                const isGoing = person.status === 'GOING';
                const isWaitlisted = person.status === 'WAITLISTED';
                const isLast = pIdx === planParticipants.length - 1;

                return (
                  <motion.div
                    key={pIdx}
                    id={isLast ? "immersive-last-participant" : undefined}
                    variants={drawerItemVariants}
                    onClick={() => setSelectedParticipantForActions(person)}
                    className="flex items-center justify-between py-2 px-2.5 rounded-xl hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/[0.08] flex-shrink-0">
                        <UserAvatar src={person.avatar} alt={person.name} size="w-full h-full" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[14px] text-zinc-150 font-semibold leading-tight text-white">
                          {person.name}
                        </span>
                        <span className="text-[10px] text-zinc-550 font-medium font-sans">
                          {person.userId === selectedPlan.hostId ? 'Host' : 'Member'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isGoing ? (
                        <span className="text-[9.5px] font-sans font-black tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-[6px] flex items-center gap-1 text-center whitespace-nowrap">
                          <Check className="w-3 h-3 stroke-[2.5]" /> GOING
                        </span>
                      ) : isWaitlisted ? (
                        <span className="text-[9.5px] font-sans font-black tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 px-2.5 py-1 rounded-[6px] flex items-center gap-1 text-center whitespace-nowrap">
                          <Hourglass className="w-3 h-3" /> WAITLISTED
                        </span>
                      ) : (person.status === 'SKIPPED') ? (
                        <span className="text-[9.5px] font-sans font-bold text-zinc-500 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-[6px] text-center whitespace-nowrap">
                          SKIPPED
                        </span>
                      ) : (person.status === 'SEEN') ? (
                        <span className="text-[9.5px] font-sans font-bold text-zinc-500 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-[6px] text-center whitespace-nowrap">
                          SEEN
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-sans font-bold text-zinc-455 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-[6px] text-center whitespace-nowrap">
                          DELIVERED
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
