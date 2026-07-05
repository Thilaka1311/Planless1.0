import React, { useState, useMemo, useEffect } from "react";
import { UserProfile, Plan } from "../../../../../core/types";
import { usePlansStore } from "../../../state/PlansContext";
import { useLivePlan } from "../../../hooks/useLivePlan";

import { useToast } from "../../../../../shared/contexts/ToastContext";
import { normalizeStatus } from "../../../../../lib/participantStatus";

interface UseDetailedPlanStateProps {
  planId: string;
  userProfile: UserProfile;
  activeUserId?: string;
  onClose: () => void;
  setSelectedMemoryPlan?: (planId: string) => void;
  setShowPaymentSuccess?: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  onLeavePlan?: () => void;
  onPlanCancelled?: (planId: string) => void;
}

export function useDetailedPlanState({
  planId,
  userProfile,
  activeUserId,
  onClose,
  setSelectedMemoryPlan,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  onLeavePlan,
  onPlanCancelled,
}: UseDetailedPlanStateProps) {
  const { showToast } = useToast();
  const {
    plans,
    dbPlans,
    dbPlanTeamAssignments,
    getTeamAssignments,
    getParticipantCounts,
    dbPlanParticipants,
    markPlanSeen,
    skipPlan,
    rejoinPlan,
    joinPlan,
    changePlanHost,
    cancelPlan,
    completePlan,
    removeParticipant,
  } = usePlansStore();

  const selectedPlan = useLivePlan(planId);


  // Local state variables
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
  const [selectedParticipantForActions, setSelectedParticipantForActions] = useState<any | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);

  const planUuid = selectedPlan ? ((selectedPlan as any).dbUuid || selectedPlan.id) : "";
  const resolvedUserUuid = userProfile.dbUuid || activeUserId || "";
  const isHost = selectedPlan ? selectedPlan.hostId === resolvedUserUuid : false;

  const myParticipantRecord = useMemo(() => {
    if (!selectedPlan) return undefined;
    return dbPlanParticipants.find(
      pp => pp.plan_id === planUuid && (pp.user_id === resolvedUserUuid || pp.user_id === activeUserId)
    );
  }, [dbPlanParticipants, selectedPlan, planUuid, activeUserId, resolvedUserUuid]);

  const isParticipant = useMemo(() => {
    return isHost || normalizeStatus(myParticipantRecord?.rsvp_status) === "going";
  }, [isHost, myParticipantRecord?.rsvp_status]);

  const goingMembers = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(m => m.joinState === "going" && m.name !== selectedPlan.creatorName);
  }, [selectedPlan]);

  const waitlistMembers = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(m => m.joinState === "waitlist");
  }, [selectedPlan]);

  const hostMember = useMemo(() => {
    if (!selectedPlan) return undefined;
    return selectedPlan.members.find(m => m.name === selectedPlan.creatorName);
  }, [selectedPlan]);

  const allGoingMembers = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(m => m.joinState === "going");
  }, [selectedPlan]);

  const planAssignments = useMemo(() => {
    return dbPlanTeamAssignments.filter(a => a.plan_id === planUuid);
  }, [dbPlanTeamAssignments, planUuid]);

  const teamAMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "A";
    });
  }, [allGoingMembers, planAssignments]);

  const teamBMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return a?.team === "B";
    });
  }, [allGoingMembers, planAssignments]);

  const unassignedMembers = useMemo(() => {
    return allGoingMembers.filter(m => {
      const a = planAssignments.find(pa => pa.user_id === (m.userUuid || m.userId));
      return !a;
    });
  }, [allGoingMembers, planAssignments]);

  const isFull = useMemo(() => {
    if (!selectedPlan) return false;
    const limit = selectedPlan.joinLimit || selectedPlan.capacity || 0;
    const acceptedCount = selectedPlan.members.filter(m => m.joinState === "going").length;
    return limit > 0 && acceptedCount >= limit && selectedPlan.waitlistEnabled;
  }, [selectedPlan]);

  const alreadySkipped = normalizeStatus(myParticipantRecord?.rsvp_status) === "skipped";

  const counts = useMemo(() => {
    return getParticipantCounts(planUuid);
  }, [getParticipantCounts, planUuid]);

  const eligibleParticipants = useMemo(() => {
    if (!selectedPlan) return [];
    return selectedPlan.members.filter(
      m =>
        m.userId !== activeUserId &&
        m.userId !== userProfile.dbUuid &&
        (m.joinState === "going" || m.joinState === "waitlist")
    );
  }, [selectedPlan, activeUserId, userProfile.dbUuid]);

  const responseDeadlineText = useMemo(() => {
    if (!selectedPlan) return "No deadline";
    return selectedPlan.response_deadline_at
      ? new Date(selectedPlan.response_deadline_at).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      : "No deadline";
  }, [selectedPlan]);

  const rawDbPlan = useMemo(() => {
    return dbPlans.find(p => p.id === planUuid);
  }, [dbPlans, planUuid]);

  const hasCost = rawDbPlan ? (rawDbPlan.total_cost !== undefined && rawDbPlan.total_cost !== null) : false;
  const costText = useMemo(() => {
    if (!rawDbPlan || !hasCost) return "";
    const totalCostVal = Number(rawDbPlan.total_cost || 0);
    if (totalCostVal === 0) return "Free";

    // Read cost_per_participant from the current participant record
    if (myParticipantRecord && myParticipantRecord.cost_per_participant !== undefined && myParticipantRecord.cost_per_participant !== null) {
      const shareVal = Number(myParticipantRecord.cost_per_participant);
      return `₹${shareVal.toFixed(2)} per person`;
    }

    // Hide or return empty if participant has no active split yet
    return "";
  }, [rawDbPlan, hasCost, myParticipantRecord]);

  const currentStatus = normalizeStatus(myParticipantRecord?.rsvp_status);
  const showJoinDirect = ["delivered", "seen", "waitlist", "new"].includes(currentStatus);
  const isJoinedOrWaitlisted = currentStatus === "going" || currentStatus === "waitlist";
  const isPlanEnded = selectedPlan ? (selectedPlan.status === "COMPLETED" || selectedPlan.status === "CANCELLED") : false;
  const isWaitlist = currentStatus === "waitlist";

  const showTeams = useMemo(() => {
    if (!selectedPlan) return false;
    const isFootball = (selectedPlan as any).subcategory === "football";
    return isFootball && isParticipant;
  }, [selectedPlan, isParticipant]);

  const calendarDay = useMemo(() => {
    if (!selectedPlan) return String(new Date().getDate());
    const dateStr = selectedPlan.date || "";
    const match = dateStr.match(/\d+/);
    if (match) return match[0];
    const fallbackDate = selectedPlan.response_deadline_at ? new Date(selectedPlan.response_deadline_at) : new Date();
    return String(fallbackDate.getDate());
  }, [selectedPlan]);

  const canRemoveParticipant = (targetUserId: string) => {
    if (!isHost || !selectedPlan) return false;
    const isPlanHost = targetUserId === selectedPlan.hostId;
    return !isPlanHost;
  };

  // Sync / Seen / Team hooks
  useEffect(() => {
    if (selectedPlan && activeUserId && normalizeStatus(myParticipantRecord?.rsvp_status) === "delivered") {
      markPlanSeen(selectedPlan.id, activeUserId);
    }
  }, [selectedPlan, activeUserId, myParticipantRecord?.rsvp_status, markPlanSeen]);

  useEffect(() => {
    if (selectedPlan && (selectedPlan as any).subcategory === "football") {
      getTeamAssignments(planUuid);
    }
  }, [planUuid, selectedPlan, getTeamAssignments]);

  // Async Action Handlers
  const handleSkip = async () => {
    if (!selectedPlan || !activeUserId || isSkipping) return;
    setIsSkipping(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      showToast("You left the plan.");
      if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to skip plan");
    } finally {
      setIsSkipping(false);
    }
  };

  const handleRejoin = async () => {
    if (!selectedPlan || !activeUserId || isRejoining) return;
    setIsRejoining(true);
    try {
      await rejoinPlan(selectedPlan.id, userProfile);
      if (isFull) {
        showToast("Added to Waitlist");
        if (setShowWaitlistSuccess) {
          setShowWaitlistSuccess(selectedPlan.id);
        }
      } else {
        showToast((selectedPlan as any).payment_required ? "Plan joined (mock checkout)" : "Plan joined");
        if (setShowPaymentSuccess) {
          setShowPaymentSuccess(selectedPlan.id);
        }
      }
      onClose();
    } catch (err) {
      showToast("Failed to join plan");
    } finally {
      setIsRejoining(false);
    }
  };

  const handleJoinDirect = async () => {
    if (!selectedPlan || isJoiningDirect) return;
    setIsJoiningDirect(true);
    try {
      await joinPlan(selectedPlan.id, userProfile);
      if (isFull) {
        showToast("Added to Waitlist");
        if (setShowWaitlistSuccess) {
          setShowWaitlistSuccess(selectedPlan.id);
        }
      } else {
        showToast((selectedPlan as any).payment_required ? "Joined plan successfully! (mock checkout)" : "Joined plan successfully!");
        if (setShowPaymentSuccess) {
          setShowPaymentSuccess(selectedPlan.id);
        }
      }
      onClose();
    } catch (err) {
      showToast("Failed to join plan");
    } finally {
      setIsJoiningDirect(false);
    }
  };

  const handleSkipConfirm = async () => {
    if (!selectedPlan || !activeUserId || isLeaving) return;
    setIsLeaving(true);
    try {
      await skipPlan(selectedPlan.id, activeUserId);
      showToast("You left the plan.");
      setShowLeaveConfirm(false);
      if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to skip plan");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDitchConfirm = async () => {
    if (!selectedPlan || isDitching) return;
    setIsDitching(true);
    try {
      await cancelPlan(selectedPlan.id);
      showToast("Plan cancelled.");
      setShowDitchConfirm(false);
      if (onPlanCancelled) {
        onPlanCancelled(selectedPlan.id);
      } else if (onLeavePlan) {
        onLeavePlan();
      } else {
        onClose();
      }
    } catch (err) {
      showToast("Failed to ditch plan");
    } finally {
      setIsDitching(false);
    }
  };

  const handleCompletePlan = async () => {
    if (!selectedPlan || isCompleting) return;
    setIsCompleting(true);
    try {
      await completePlan(selectedPlan.dbUuid || selectedPlan.id);
      showToast("Plan marked completed successfully");
      if (setSelectedMemoryPlan) {
        setSelectedMemoryPlan(selectedPlan.id);
      }
      onClose();
    } catch (err) {
      showToast("Failed to complete plan");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleChangeHostConfirm = async () => {
    if (!selectedPlan || !selectedNewHost || isChangingHost || !activeUserId) return;
    setIsChangingHost(true);
    try {
      await changePlanHost(selectedPlan.id, selectedNewHost.userId, activeUserId);
      showToast(`Ownership transferred to ${selectedNewHost.name}`);
      setSelectedNewHost(null);
      setShowChangeHostList(false);
      onClose();
    } catch (err) {
      showToast("Failed to transfer ownership");
    } finally {
      setIsChangingHost(false);
    }
  };

  const handleRemoveParticipant = async (userId: string, name: string) => {
    if (!selectedPlan) return;
    try {
      setIsRemoving(true);
      await removeParticipant(selectedPlan.id, userId);
      showToast(`✓ Removed ${name} from plan`);
      setUserToRemove(null);
    } catch (err: any) {
      showToast(`Error removing: ${err.message || err}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    selectedPlan,
    isFull,
    isSkipping,
    isRejoining,
    isJoiningDirect,
    showLeaveConfirm,
    setShowLeaveConfirm,
    isLeaving,
    showChangeHostList,
    setShowChangeHostList,
    isChangingHost,
    showDitchConfirm,
    setShowDitchConfirm,
    isDitching,
    isCompleting,
    selectedNewHost,
    setSelectedNewHost,
    showManageParticipants,
    setShowManageParticipants,
    showManageTeams,
    setShowManageTeams,
    userToRemove,
    setUserToRemove,
    isRemoving,
    selectedParticipantForActions,
    setSelectedParticipantForActions,
    isExpanded,
    setIsExpanded,
    isMenuOpen,
    setIsMenuOpen,
    showCompletionFlow,
    setShowCompletionFlow,
    resolvedUserUuid,
    isHost,
    isParticipant,
    goingMembers,
    waitlistMembers,
    hostMember,
    allGoingMembers,
    planAssignments,
    teamAMembers,
    teamBMembers,
    unassignedMembers,
    alreadySkipped,
    counts,
    eligibleParticipants,
    responseDeadlineText,
    hasCost,
    costText,
    currentStatus,
    showJoinDirect,
    isJoinedOrWaitlisted,
    isPlanEnded,
    isWaitlist,
    showTeams,
    calendarDay,
    canRemoveParticipant,
    handleSkip,
    handleRejoin,
    handleJoinDirect,
    handleSkipConfirm,
    handleDitchConfirm,
    handleCompletePlan,
    handleChangeHostConfirm,
    handleRemoveParticipant,
    showToast,
  };
}
