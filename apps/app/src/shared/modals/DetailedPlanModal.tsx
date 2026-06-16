import React, { useState } from "react";
import { 
  MapPin, 
  Clock, 
  Hourglass, 
  ChevronLeft, 
  Check, 
  Sparkles,
  Trophy,
  Activity,
  X,
  Send,
  MessageSquare,
  LogOut,
  MoreVertical,
  Edit,
  Trash,
  Trash2,
  UserX,
  Crown,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Plan, UserProfile } from "../../core/types";
import { getPlanCover } from "../../features/plans/config/planCoverImages";
import { normalizeStatus } from "../../lib/participantStatus";
import { usePlansStore } from "../../features/plans/state/PlansContext";
import { useCirclesStore } from "../../features/circles/state/CirclesContext";
import { useChatStore } from "../../features/chat/state/ChatContext";
import TeamOrganizerModal from "./TeamOrganizerModal";

interface DetailedPlanModalProps {
  selectedPlan: Plan;
  onClose: () => void;
  userProfile: UserProfile;
  activeUserId?: string;
  triggerToast: (msg: string) => void;
  setSelectedMemoryPlan?: (plan: Plan) => void;
  onNavigateToCircle?: (circleId: string) => void;
  onNavigateToPlanChat?: (plan: Plan) => void;
}

const getPlanActivityIcon = (plan: any) => {
  const category = plan.category || 'sports';
  const subcategory = plan.subcategory || null;

  if (category === 'sports') {
    switch (subcategory) {
      case 'football': return '⚽';
      case 'badminton': return '🏸';
      case 'basketball': return '🏀';
      case 'tennis': return '🎾';
      case 'volleyball': return '🏐';
      case 'cricket': return '🏏';
      default: return '⚽';
    }
  }
  if (category === 'movies') return '🎬';
  if (category === 'dining' || category === 'restaurants' || category === 'cafe') return '🍴';
  return '⚡';
};

const getPlanDescription = (plan: Plan) => {
  if (plan.category === 'sports') {
    if (plan.sports_type === 'Badminton') {
      return 'Spontaneous 2v2 badminton sessions. Intermediate level. Bring your own rackets; shuttlecocks are provided. Play Arena booked for 2 hours.';
    }
    return 'Weekend casual sports match. Friendly rotation, clean play, and high energy. Quick rotation, clean tackles. Water provided.';
  }
  if (plan.category === 'movies') {
    return 'Late-night high-framerate action in IMAX. Pre-booking seat rows F–H. Grab some popcorn, check in 15 mins early.';
  }
  if ((plan.category as string) === 'dining' || plan.category === 'restaurants') {
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

const drawerContainerVariants = {
  hidden: { 
    height: 0,
    opacity: 0,
  },
  show: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        type: 'spring',
        duration: 0.24,
        bounce: 0,
      },
      opacity: {
        duration: 0.15,
      },
      staggerChildren: 0.04,
    }
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        type: 'spring',
        duration: 0.22,
        bounce: 0,
      },
      opacity: {
        duration: 0.12,
      },
      staggerChildren: 0.02,
      staggerDirection: -1 as const,
    }
  }
};

const drawerItemVariants = {
  hidden: { 
    opacity: 0, 
    y: -10 
  },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 400, 
      damping: 28 
    } 
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.12,
    }
  }
};

function DetailedPlanModal({
  selectedPlan,
  onClose,
  userProfile,
  activeUserId,
  triggerToast,
  setSelectedMemoryPlan,
  onNavigateToCircle,
  onNavigateToPlanChat,
}: DetailedPlanModalProps) {
  const { dbPlanTeamAssignments, getTeamAssignments, getParticipantCounts, dbPlanParticipants, markPlanSeen, skipPlan, rejoinPlan, acceptPlan, joinPlan, leavePlan, changePlanHost, cancelPlan, completePlan, removeParticipant } = usePlansStore();
  const { setActiveRoom, messages, sendMessage, isLoading: chatLoading } = useChatStore();
  
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const [isJoiningDirect, setIsJoiningDirect] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
  const [showChangeHostList, setShowChangeHostList] = useState(false);
  const [isChangingHost, setIsChangingHost] = useState(false);
  const [showDitchConfirm, setShowDitchConfirm] = useState(false);
  const [isDitching, setIsDitching] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedNewHost, setSelectedNewHost] = useState<{ userId: string; name: string } | null>(null);

  const [showManageParticipants, setShowManageParticipants] = useState(false);
  const [showManageTeams, setShowManageTeams] = useState(false);
  const [userToRemove, setUserToRemove] = useState<{ userId: string; name: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Immersive layout states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hostMember = selectedPlan.members.find(m => m.name === selectedPlan.creatorName);
  const goingMembers = selectedPlan.members.filter(m => m.joinState === "going" && m.name !== selectedPlan.creatorName);
  const waitlistMembers = selectedPlan.members.filter(m => m.joinState === "waitlist");

  const planUuid = (selectedPlan as any).dbUuid || selectedPlan.id;
  const counts = getParticipantCounts(planUuid);

  const resolvedUserUuid = userProfile.dbUuid || activeUserId;
  const isHost = selectedPlan.hostId === resolvedUserUuid || selectedPlan.creatorId === resolvedUserUuid;
  const isModerator = isHost;

  const canRemoveParticipant = (targetUserId: string) => {
    if (!isModerator) return false;
    const isPlanHost =
      targetUserId === selectedPlan.creatorId ||
      targetUserId === selectedPlan.hostId;
    return !isPlanHost;
  };

  const myParticipantRecord = React.useMemo(() => {
    const planUuidForPp = (selectedPlan as any).dbUuid || selectedPlan.id;
    const resolvedUserUuid = userProfile.dbUuid || activeUserId;
    return dbPlanParticipants.find(
      pp => pp.plan_id === planUuidForPp && (pp.user_id === resolvedUserUuid || pp.user_id === activeUserId)
    );
  }, [dbPlanParticipants, selectedPlan, activeUserId, userProfile]);

  React.useEffect(() => {
    if (activeUserId && myParticipantRecord?.status === "delivered") {
      markPlanSeen(selectedPlan.id, activeUserId);
    }
  }, [selectedPlan.id, activeUserId, myParticipantRecord?.status, markPlanSeen]);

  React.useEffect(() => {
    if (selectedPlan.sports_type === "Football" || (selectedPlan as any).activity_type === "football") {
      getTeamAssignments(planUuid);
    }
  }, [planUuid, selectedPlan, getTeamAssignments]);

  const navigatingToChatRef = React.useRef(false);

  React.useEffect(() => {
    const pUuid = (selectedPlan as any).dbUuid || selectedPlan.id;
    const cId = selectedPlan.circleId || (selectedPlan as any).circle_id;
    if (cId) {
      setActiveRoom(cId, pUuid);
    }
    return () => {
      if (!navigatingToChatRef.current) {
        setActiveRoom(null, null);
      }
    };
  }, [selectedPlan, setActiveRoom]);

  const isParticipant = React.useMemo(() => {
    return isModerator || myParticipantRecord?.status === "going";
  }, [isModerator, myParticipantRecord?.status]);

  const allGoingMembers = React.useMemo(() => {
    return selectedPlan.members.filter(m => m.joinState === "going");
  }, [selectedPlan.members]);

  const planAssignments = React.useMemo(() => {
    return dbPlanTeamAssignments.filter(a => a.plan_id === planUuid);
  }, [dbPlanTeamAssignments, planUuid]);

  const teamAMembers = React.useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "A";
    });
  }, [allGoingMembers, planAssignments]);

  const teamBMembers = React.useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "B";
    });
  }, [allGoingMembers, planAssignments]);

  const unassignedMembers = React.useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return !a;
    });
  }, [allGoingMembers, planAssignments]);

  const alreadySkipped = normalizeStatus(myParticipantRecord?.status) === "skipped";

  const handleSkip = async () => {
    if (!activeUserId || isSkipping) return;
    setIsSkipping(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      triggerToast("Plan skipped");
      onClose();
    } catch (err) {
      triggerToast("Failed to skip plan");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleRejoin = async () => {
    if (!activeUserId || isRejoining) return;
    setIsRejoining(true);
    try {
      await rejoinPlan(selectedPlan.id, userProfile);
      triggerToast("Plan joined");
    } catch (err) {
      triggerToast("Failed to join plan");
    } finally {
      setIsRejoining(false);
    }
  };

  const handleJoinDirect = async () => {
    if (isJoiningDirect) return;
    setIsJoiningDirect(true);
    try {
      await joinPlan(selectedPlan.id, userProfile);
      triggerToast("Joined plan successfully!");
    } catch (err) {
      triggerToast("Failed to join plan");
    } finally {
      setIsJoiningDirect(false);
    }
  };

  const handleSkipConfirm = async () => {
    if (!activeUserId || isLeaving) return;
    setIsLeaving(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      triggerToast("Plan skipped successfully");
      setShowLeaveConfirm(false);
      onClose();
    } catch (err) {
      triggerToast("Failed to skip plan");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDitchConfirm = async () => {
    if (isDitching) return;
    setIsDitching(true);
    try {
      await cancelPlan(selectedPlan.id);
      triggerToast("Plan ditched/cancelled successfully");
      setShowDitchConfirm(false);
      onClose();
    } catch (err) {
      triggerToast("Failed to ditch plan");
    } finally {
      setIsDitching(false);
    }
  };

  const handleCompletePlan = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    try {
      await completePlan(selectedPlan.dbUuid || selectedPlan.id);
      triggerToast("Plan marked completed successfully");
      if (setSelectedMemoryPlan) {
        setSelectedMemoryPlan({
          ...selectedPlan,
          status: "completed"
        });
      }
      onClose();
    } catch (err) {
      triggerToast("Failed to complete plan");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleChangeHostConfirm = async () => {
    if (!selectedNewHost || isChangingHost || !activeUserId) return;
    setIsChangingHost(true);
    try {
      await changePlanHost(selectedPlan.id, selectedNewHost.userId, activeUserId);
      triggerToast(`Ownership transferred to ${selectedNewHost.name}`);
      setSelectedNewHost(null);
      setShowChangeHostList(false);
      onClose();
    } catch (err) {
      triggerToast("Failed to transfer ownership");
    } finally {
      setIsChangingHost(false);
    }
  };

  const eligibleParticipants = React.useMemo(() => {
    return selectedPlan.members.filter(
      m => m.userId !== activeUserId && m.userId !== userProfile.dbUuid && m.joinState !== "skipped" && m.joinState !== "passed"
    );
  }, [selectedPlan.members, activeUserId, userProfile.dbUuid]);

  const responseDeadlineText = selectedPlan.response_deadline_at
    ? new Date(selectedPlan.response_deadline_at).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No deadline";

  const currentStatus = normalizeStatus(myParticipantRecord?.status);
  const showJoinDirect = ["delivered", "seen", "waitlist", "new"].includes(currentStatus);
  const isJoinedOrWaitlisted = currentStatus === "going" || currentStatus === "waitlist";
  const isPlanEnded = selectedPlan.status === "completed" || selectedPlan.status === "cancelled";
  const isWaitlist = currentStatus === "waitlist";

  const showTeams = React.useMemo(() => {
    const isFootball = selectedPlan.sports_type === "Football" || (selectedPlan as any).activity_type === "football";
    return isFootball && isParticipant;
  }, [selectedPlan, isParticipant]);

  const renderTeamsSection = (isOverlay: boolean) => {
    if (!showTeams) return null;

    return (
      <div className={`space-y-3.5 text-left select-none ${isOverlay ? "" : "bg-zinc-905 border border-zinc-900 rounded-3xl p-5"}`}>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
            ⚽ Teams
          </span>
          {isModerator && (
            <button
              type="button"
              onClick={() => setShowManageTeams(true)}
              className="text-[9px] font-mono font-bold text-[#ff8b66] hover:text-[#ff9a7c] uppercase tracking-wider cursor-pointer focus:outline-none"
            >
              Manage
            </button>
          )}
        </div>

        <div className="space-y-3.5">
          {/* Team A */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-emerald-450 font-bold px-1">
              <span>Team A</span>
              <span>({teamAMembers.length})</span>
            </div>
            {teamAMembers.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-650 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">
                No players assigned
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teamAMembers.map(m => (
                  <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                    <img 
                      src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || "UA")}&backgroundColor=ff8b66`} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-emerald-500/30" 
                    />
                    <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-sky-400 font-bold px-1">
              <span>Team B</span>
              <span>({teamBMembers.length})</span>
            </div>
            {teamBMembers.length === 0 ? (
              <div className="text-[10px] font-mono text-zinc-650 py-3 text-center bg-zinc-950/20 border border-dashed border-zinc-900 rounded-2xl">
                No players assigned
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teamBMembers.map(m => (
                  <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-sky-950/20 border border-sky-500/20">
                    <img 
                      src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || "UA")}&backgroundColor=ff8b66`} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-sky-500/30" 
                    />
                    <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned */}
          {unassignedMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[8.5px] font-mono uppercase tracking-wider text-zinc-500 font-bold px-1">
                <span>Unassigned</span>
                <span>({unassignedMembers.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unassignedMembers.map(m => (
                  <div key={m.userId} className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                    <img 
                      src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || "UA")}&backgroundColor=ff8b66`} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover border border-zinc-800" 
                    />
                    <span className="text-xs font-semibold text-zinc-200">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const calendarDay = React.useMemo(() => {
    const dateStr = selectedPlan.date || "";
    const match = dateStr.match(/\d+/);
    if (match) return match[0];
    const fallbackDate = selectedPlan.response_deadline_at ? new Date(selectedPlan.response_deadline_at) : new Date();
    return String(fallbackDate.getDate());
  }, [selectedPlan.date, selectedPlan.response_deadline_at]);

  const planParticipants = React.useMemo(() => {
    const going = selectedPlan.members.filter(m => m.joinState === "going").map(m => ({ ...m, status: "GOING" }));
    const waitlist = selectedPlan.members.filter(m => m.joinState === "waitlist").map(m => ({ ...m, status: "WAITLISTED" }));
    const delivered = selectedPlan.members.filter(m => m.joinState === "delivered").map(m => ({ ...m, status: "DELIVERED" }));
    const seen = selectedPlan.members.filter(m => m.joinState === "seen").map(m => ({ ...m, status: "SEEN" }));
    const skipped = selectedPlan.members.filter(m => m.joinState === "skipped").map(m => ({ ...m, status: "SKIPPED" }));
    
    return [...going, ...waitlist, ...delivered, ...seen, ...skipped];
  }, [selectedPlan.members]);

  const goingCount = selectedPlan.members.filter(m => m.joinState === "going").length;
  const capacity = selectedPlan.maxSpots || (selectedPlan.category === "movies" ? 10 : selectedPlan.category === "sports" ? 14 : 8);
  const progressPercent = Math.min(100, Math.round((goingCount / capacity) * 100));

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
      default:
        return 'bg-white/5 text-white/60 border border-white/10';
    }
  };
  

  return (
    <motion.div
      id="detailed_plan_modal"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute inset-0 bg-[#050505] z-45 flex flex-col h-full relative overflow-hidden text-left"
    >
      {/* Skip/Leave confirmation overlay */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-50 animate-fade-in text-center">
          <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Skip Plan?</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Are you sure you want to skip this plan?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipConfirm}
                disabled={isLeaving}
                className="flex-1 py-2.5 rounded-xl bg-[#ff5e3a] hover:bg-[#ff4e2a] text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(255,94,58,0.2)] disabled:opacity-40"
              >
                {isLeaving ? "Skipping…" : "Skip Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ditch Plan confirmation overlay */}
      {showDitchConfirm && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-50 animate-fade-in text-center">
          <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Ditch Plan?</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              This will permanently close the plan for all participants.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDitchConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDitchConfirm}
                disabled={isDitching}
                className="flex-1 py-2.5 rounded-xl bg-rose-650 hover:bg-rose-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(239,68,68,0.2)] disabled:opacity-40"
              >
                {isDitching ? "Ditching…" : "Ditch Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Host List Overlay */}
      {showChangeHostList && (
        <div className="absolute inset-0 bg-black/95 flex flex-col z-50 animate-fade-in text-left">
          <div className="p-4 flex items-center justify-between border-b border-zinc-900">
            <button
              onClick={() => setShowChangeHostList(false)}
              className="text-zinc-500 hover:text-white flex items-center gap-1.5 text-xs focus:outline-none"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#ff8b66] font-bold">
              Select New Host
            </span>
            <div className="w-10" />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Transfer ownership of this plan. You will no longer be the host and will become a normal participant.
            </p>
            {eligibleParticipants.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                No eligible participants available to transfer ownership.
              </div>
            ) : (
              <div className="space-y-2">
                {eligibleParticipants.map(member => (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedNewHost({ userId: member.userId, name: member.name })}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-full border border-zinc-800"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{member.name}</div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                          Status: {member.joinState}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#ff8b66] uppercase tracking-wider font-bold">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Host Change Overlay */}
      {selectedNewHost && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 space-y-6 z-55 animate-fade-in text-center">
          <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
            <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">Transfer Host?</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Are you sure you want to transfer ownership of this plan to <span className="text-zinc-200 font-semibold">{selectedNewHost.name}</span>?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedNewHost(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangeHostConfirm}
                disabled={isChangingHost}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_16px_rgba(16,185,129,0.2)] disabled:opacity-40"
              >
                {isChangingHost ? "Transferring…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Overlay */}
      {userToRemove && (() => {
        return (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-55 animate-fade-in text-center">
            <div className="bg-[#0C0C0E]/90 backdrop-blur-md border border-zinc-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-2xl">
              <h3 className="text-base font-sans font-black text-white uppercase tracking-wider">
                Remove Participant?
              </h3>
              
              <div className="space-y-3.5 text-left font-sans text-[11px] text-zinc-400">
                <p className="text-center font-semibold text-zinc-200">
                  {userToRemove.name} will be removed from this plan.
                </p>
                <p className="font-semibold text-zinc-350 mt-3 text-center">
                  Are you sure you want to remove them?
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToRemove(null)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-zinc-900 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setIsRemoving(true);
                      await removeParticipant(selectedPlan.id, userToRemove.userId);
                      triggerToast(`✓ Removed ${userToRemove.name} from plan`);
                      setUserToRemove(null);
                    } catch (err: any) {
                      triggerToast(`Error removing: ${err.message || err}`);
                    } finally {
                      setIsRemoving(false);
                    }
                  }}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                >
                  {isRemoving ? "Removing…" : "Remove Participant"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SCROLLABLE VIEWPORT CONTAINER */}
      <div 
        id="immersive-plan-scroll-container" 
        className="flex-1 overflow-y-auto scrollbar-none pb-10"
      >
        {/* SECTION 1: HERO AREA */}
        <div 
          id="immersive-plan-hero-container" 
          className={`relative w-full flex flex-col justify-end overflow-hidden flex-shrink-0 transition-all duration-300 ${isParticipant ? 'h-[190px]' : 'h-[250px]'}`}
        >
          {/* Full-bleed high contrast cover page image */}
          <img 
            id="immersive-plan-hero-image"
            src={(selectedPlan.coverImage && !selectedPlan.coverImage.includes("unsplash.com") && !selectedPlan.coverImage.includes("navkis_matchday.png"))
              ? selectedPlan.coverImage
              : getPlanCover(selectedPlan.category, (selectedPlan as any).subcategory || (selectedPlan as any).sports_type)}
            alt={selectedPlan.title}
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.75]"
            referrerPolicy="no-referrer"
          />

          {/* Soft edge darkening filter gradations */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/45 to-transparent pointer-events-none z-0" />
          
          {/* Floating back button */}
          <button
            id="immersive-plan-back-btn"
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Host-only ⋮ overflow button */}
          {isHost && (
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/65 active:scale-95 transition duration-200 cursor-pointer"
                title="Host Actions"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-[#0F0F13]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1 z-40 animate-fade-in origin-top-right text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowChangeHostList(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Edit className="w-4 h-4 text-[#FF6B2C]" />
                      <span>Transfer Host</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowDitchConfirm(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash className="w-4 h-4 text-red-500" />
                      <span>End Plan</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Hero Meta Info */}
          <div className="px-6 pb-4 z-10 w-full relative">
            {/* Group Tagline Capsule */}
            <div className="flex items-center gap-2 mb-2">
              <span id="immersive-group-badge" className="bg-[#FF6B2C]/20 border border-[#FF6B2C]/30 px-3 py-0.5 rounded-full text-[9px] font-sans font-black text-[#FF6B2C] tracking-[0.15em] uppercase">
                {selectedPlan.circleName?.toUpperCase() || "PLANLESS CIRCLE"}
              </span>
              <div className="w-5 h-5 rounded-full bg-black/45 border border-white/10 flex items-center justify-center">
                <span className="text-[11px] leading-none select-none">{getPlanActivityIcon(selectedPlan)}</span>
              </div>
            </div>

            <h1 id="immersive-plan-title" className="font-sans font-black text-[26px] text-white tracking-tight leading-none mb-2 select-text">
              {selectedPlan.title}
            </h1>

            {/* Hosted By Mini Badge */}
            <div className="flex items-center gap-2 mt-1">
              <img 
                id="immersive-host-avatar"
                src={selectedPlan.creatorAvatar || "https://api.dicebear.com/7.x/initials/svg?seed=Host"} 
                alt={selectedPlan.creatorName} 
                className="w-5 h-5 rounded-full object-cover border border-white/10"
                referrerPolicy="no-referrer"
              />
              <span id="immersive-host-attribution" className="text-[11.5px] text-zinc-300 font-medium">
                Hosted by <strong className="text-white font-semibold">{selectedPlan.creatorName || "Host"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* CONTENT BLOCK WITH SPACIOUS MARGINS */}
        <div id="immersive-plan-scroll-content" className="px-6 pt-2 space-y-5">
          
          {/* SECTION 2: QUICK INFORMATION */}
          <div id="immersive-quick-info" className="space-y-2.5 font-sans text-left">
            {/* Location details */}
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] text-white font-semibold leading-tight">{selectedPlan.location}</span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">LOCATION</span>
              </div>
            </div>

            {/* Clock details */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] text-white font-semibold leading-tight">{selectedPlan.date} • {selectedPlan.time}</span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">TIMING</span>
              </div>
            </div>

            {/* Deadline details */}
            <div className="flex items-center gap-3">
              <Hourglass className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-[13px] text-[#EF4444] font-bold leading-tight">{responseDeadlineText}</span>
                <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase mt-0.5">RSVP DEADLINE</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: DESCRIPTION */}
          {hasUserEnteredDescription(selectedPlan) && (
            <div id="immersive-description-block" className="space-y-1.5 text-left select-text">
              <span className="text-[11px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase">
                About
              </span>
              <p className="text-[13px] text-zinc-300 font-sans leading-[1.72]">
                {selectedPlan.description}
              </p>
            </div>
          )}

          {/* SECTION 4: PEOPLE PARTICIPANTS LIST */}
          <div id="immersive-participants-block" className="select-none text-left">
            <div className="text-[11px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase pt-1">
              Who's Coming ({planParticipants.length})
            </div>

            {/* MINIMAL PROGRESS ACCENT LINE */}
            <div id="immersive-progress-block" className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden mt-4 mb-4">
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
              className="flex items-center justify-between cursor-pointer py-3 px-3.5 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl border border-white/[0.04] transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 leading-none">
                <div className="flex items-center flex-shrink-0">
                  {planParticipants.slice(0, 3).map((person, idx) => (
                    <img
                      key={idx}
                      src={person.avatar}
                      alt={person.name}
                      className="w-[22px] h-[22px] rounded-full object-cover border-[1.5px] border-[#050505] flex-shrink-0 select-none"
                      style={{ 
                        marginLeft: idx > 0 ? '-7px' : '0px',
                        zIndex: 10 - idx
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                  {planParticipants.length > 3 && (
                    <span className="text-[10px] text-zinc-500 font-bold ml-1.5 select-none font-mono">
                      +{planParticipants.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center min-w-0 text-[13.5px] text-zinc-300 font-medium tracking-tight select-none">
                  <span className="text-zinc-400 font-normal mr-1 flex-shrink-0 whitespace-nowrap">Hosted by</span>
                  <span className="text-white font-bold whitespace-nowrap">{selectedPlan.creatorName || "Host"}</span>
                </div>
              </div>

              <motion.span 
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="text-[10px] text-zinc-400 font-bold pr-0.5 group-hover:text-zinc-200 transition-colors flex items-center justify-center flex-shrink-0 ml-1.5"
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
                      const isSelf = person.userId === activeUserId || person.userId === userProfile.dbUuid;

                      return (
                        <motion.div 
                          key={pIdx} 
                          id={isLast ? "immersive-last-participant" : undefined}
                          variants={drawerItemVariants}
                          className="flex items-center justify-between py-1.5 px-1 rounded-xl hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-zinc-800 border border-white/[0.08] flex-shrink-0">
                              <img 
                                src={person.avatar} 
                                alt={person.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-[14px] text-zinc-150 font-semibold leading-tight text-white">
                                {person.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium font-sans">
                                {person.userId === selectedPlan.hostId || person.userId === selectedPlan.creatorId ? 'Host' : 'Member'}
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
                            ) : (person.status === 'SEEN') ? (
                              <span className="text-[9.5px] font-sans font-bold text-zinc-500 bg-white/[0.04] border border-white/10 px-2.5 py-1 rounded-[6px] text-center whitespace-nowrap">
                                SEEN
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-sans font-bold text-zinc-450 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-[6px] text-center whitespace-nowrap">
                                DELIVERED
                              </span>
                            )}

                            {/* Host participant removal controls */}
                            {isHost && !isSelf && person.userId !== selectedPlan.hostId && person.userId !== selectedPlan.creatorId && (
                              <button
                                type="button"
                                onClick={() => setUserToRemove({ userId: person.userId, name: person.name })}
                                className="p-1 rounded-lg hover:bg-white/[0.06] border border-transparent hover:border-white/5 text-rose-500 transition-all cursor-pointer"
                              >
                                <UserX className="w-3.5 h-3.5" />
                              </button>
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


          {/* SECTION 4.5: TEAM ORGANIZER ACCENT */}
          {showTeams && renderTeamsSection(false)}

        </div>

        {/* SECTION 5: ACTIONS MATRIX DOCK */}
        {!isParticipant ? (
          <div 
            id="immersive-actions-dock"
            className="px-6 pt-3 pb-6 border-t border-white/[0.05] flex flex-col gap-3 z-10 relative mt-4 text-center bg-[#050505]"
          >
            {showJoinDirect && (
              <button
                id="immersive-join-btn"
                type="button"
                onClick={handleJoinDirect}
                disabled={isJoiningDirect}
                className="w-full py-4 px-6 rounded-[20px] text-[13px] font-sans font-black tracking-[0.14em] uppercase transition-all duration-200 text-center cursor-pointer bg-[#FF6B2C] text-white hover:bg-[#FF854C] border border-[#FF6B2C]/20 shadow-lg shadow-[#FF6B2C]/15 active:scale-[0.98] disabled:opacity-40"
              >
                {isJoiningDirect ? "Joining…" : "Join Plan"}
              </button>
            )}

            {alreadySkipped && (
              <button
                id="immersive-join-btn"
                type="button"
                onClick={handleRejoin}
                disabled={isRejoining}
                className="w-full py-4 px-6 rounded-[20px] text-[13px] font-sans font-black tracking-[0.14em] uppercase transition-all duration-200 text-center cursor-pointer bg-[#FF6B2C] text-white hover:bg-[#FF854C] border border-[#FF6B2C]/20 shadow-lg shadow-[#FF6B2C]/15 active:scale-[0.98] disabled:opacity-40"
              >
                {isRejoining ? "Rejoining…" : "Rejoin Plan"}
              </button>
            )}

            <button
              id="immersive-skip-btn"
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="w-full py-1 text-[11px] font-sans font-black tracking-[0.15em] text-[#94A3B8]/60 hover:text-white transition-colors uppercase text-center cursor-pointer active:opacity-70 disabled:opacity-30"
            >
              {isSkipping ? "Skipping…" : "Skip"}
            </button>
          </div>
        ) : (
          <div 
            id="immersive-actions-dock-joined"
            className="px-6 pt-3 pb-6 border-t border-white/[0.05] flex flex-col gap-3 z-10 relative mt-4 bg-[#050505]"
          >
            <button
              id="immersive-open-chat-btn"
              type="button"
              onClick={() => {
                if (goingCount >= 2) {
                  onNavigateToPlanChat?.(selectedPlan);
                }
              }}
              disabled={goingCount < 2}
              className={`w-full py-4 px-6 rounded-[20px] text-[12px] font-sans font-black tracking-[0.12em] uppercase transition-all duration-200 text-center cursor-pointer border shadow-lg active:scale-[0.98] ${
                goingCount >= 2
                  ? "bg-[#FF6B2C] text-white hover:bg-[#FF854C] border-[#FF6B2C]/20 shadow-[#FF6B2C]/15"
                  : "bg-zinc-900/40 text-zinc-500 border-zinc-800/40 shadow-none cursor-not-allowed opacity-50"
              }`}
            >
              {goingCount >= 2 ? "Open Chat" : "Chat unlocks when another attendee joins."}
            </button>

            {isHost ? (
              <button
                type="button"
                onClick={() => setShowDitchConfirm(true)}
                className="w-full py-3.5 px-6 rounded-[20px] text-[11px] font-sans font-black tracking-[0.12em] text-rose-500/80 hover:text-rose-450 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all uppercase text-center cursor-pointer"
              >
                End Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full py-3.5 px-6 rounded-[20px] text-[11px] font-sans font-black tracking-[0.12em] text-rose-500/80 hover:text-rose-450 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 transition-all uppercase text-center cursor-pointer"
              >
                Leave Plan
              </button>
            )}

            {/* Host-only Mark Completed CTA */}
            {isHost && selectedPlan.status === "active" && (
              <button
                type="button"
                onClick={handleCompletePlan}
                disabled={isCompleting}
                className="w-full py-3.5 rounded-[20px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-[11px] font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer text-center shadow-[0_0_12px_rgba(16,185,129,0.2)] disabled:opacity-50"
              >
                {isCompleting ? "Marking complete…" : "Complete Plan"}
              </button>
            )}

            {/* Co-host Team Organizer Action */}
            {showTeams && (
              <button
                type="button"
                onClick={() => setShowManageTeams(true)}
                className="w-full py-3.5 rounded-[20px] border border-[#ff8b66]/25 bg-[#ff8b66]/5 text-[#ff8b66] hover:bg-[#ff8b66]/10 text-xs font-mono font-bold uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                ⚽ Team Organizer
              </button>
            )}
          </div>
        )}

      </div>

  

      {/* Team Organizer Overlay */}
      {showManageTeams && (
        <TeamOrganizerModal
          plan={selectedPlan}
          userProfile={userProfile}
          activeUserId={activeUserId}
          onClose={() => setShowManageTeams(false)}
          triggerToast={triggerToast}
        />
      )}
    </motion.div>
  );
}

export default React.memo(DetailedPlanModal);
