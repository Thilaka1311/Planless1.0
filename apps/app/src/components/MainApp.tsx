import React, { useState, useRef } from "react";
import { useToast } from "../shared/contexts/ToastContext";
import {
  Bell, Users, Plus, Home, Calendar, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Plan, Circle, NotificationItem, Transaction, DbCircle, DbCircleMember, DbPlan, DbPlanParticipant, DbTransaction, DbPlanOutcome } from "../core/types";
import { getInitialsAvatar, mapCirclesToLegacyCircles, mapTransactionsToLegacy, mapNotificationsToLegacy } from "../lib/mappers";
import { insertCircle, insertCircleMembers, syncUserStats, insertTransaction } from "../lib/db";
import { usePlansStore } from "../features/plans/state/PlansContext";
import { useProfileStore } from "../features/profile/state/ProfileContext";
import { useWalletStore } from "../features/wallet/state/WalletContext";
import { useCirclesStore } from "../features/circles/state/CirclesContext";
import { CirclesScreen } from "../features/circles/screens/CirclesScreen";
import { WalletScreen } from "../features/wallet/screens/WalletScreen";
import { HomeScreen } from "../features/home/screens/HomeScreen";
import { PlansScreen } from "../features/plans/screens/PlansScreen";
import { CreatePlanScreen } from "../features/create/screens/CreatePlanScreen";
import { ProfileScreen } from "../features/profile/screens/ProfileScreen";
import { NotificationsScreen } from "../features/notifications/screens/NotificationsScreen";
import DetailedPlanModal from "../shared/modals/DetailedPlanModal";
import { getPlanCover } from "../features/plans/config/planCoverImages";
import DbExplorerModal from "../shared/modals/DbExplorerModal";
import NotificationsTrayModal from "../shared/modals/NotificationsTrayModal";
import DepositCashModal from "../shared/modals/DepositCashModal";
import PaymentConfirmationModal from "../shared/modals/PaymentConfirmationModal";
import ReservationSuccessModal from "../shared/modals/ReservationSuccessModal";
import { hasOutstandingMemoryAction } from "../lib/memoryContribution";
import { derivePlanMemoryInfo } from "../lib/planMemoryUtils";
import { MemoryScreen, MemoryRecord } from "../features/plans/screens/MemoryScreen";
import { EditPlanScreen } from "../features/plans/screens/EditPlanScreen";
import { useLivePlan } from "../features/plans/hooks/useLivePlan";
interface MainAppProps {
  userProfile: UserProfile;
  onLogout: () => void;
  activeUserId: string;
}

export default function MainApp({ userProfile, onLogout, activeUserId }: MainAppProps) {
  // --- Decoupled Context Stores ---
  const { plans, dbPlans, setDbPlans, dbPlanParticipants, setDbPlanParticipants, dbPlanOutcomes, setDbPlanOutcomes, dbPlanTeamAssignments, setDbPlanTeamAssignments, joinPlan, waitlistPlan, passPlan, submitReview, submitStats, submitMvp, updatePlanDetails, cancelPlan, getHomeFeedPlans, dbMemories, dbMemoryResults } = usePlansStore();
  const { dbUsers, setDbUsers, setDbUserData, setDbFriendships, updateProfile, activeUserUuid } = useProfileStore();
  const { circles, setCircles, dbCircles, setDbCircles, dbCircleMembers, setDbCircleMembers } = useCirclesStore();
  const { walletBalance, transactions, dbTransactions, setDbTransactions, refreshTransactions } = useWalletStore();

  // --- Core Navigation Tab state ---
  const [activeTab, setActiveTab] = useState<"home" | "plans" | "create" | "circles" | "wallet" | "profile">(() => {
    return (localStorage.getItem("planless_active_tab") as any) || "home";
  });
  const [childrenWantBottomNavHidden, setChildrenWantBottomNavHidden] = useState(false);
  const [showDbExplorer, setShowDbExplorer] = useState(false);
  const [selectedDbTable, setSelectedDbTable] = useState<string>("users");

  // --- Shared Overlays & Interactive States ---
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    return localStorage.getItem("planless_selected_plan_id");
  });
  const [activePlanChatId, setActivePlanChatId] = useState<string | null>(() => {
    return localStorage.getItem("planless_active_plan_chat_id");
  });
  const [isTrackerExpanded, setIsTrackerExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "plans" | "payments" | "activity">("all");
  const { showToast } = useToast();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const [chatOriginTab, setChatOriginTab] = useState<string | null>(null);

  const handleOpenPlanChat = (planId: string) => {
    setChatOriginTab(activeTab);
    setActivePlanChatId(planId);
    setSelectedPlanId(null);
    setActiveTab("circles");
  };

  const handleClosePlanChat = (val: string | null) => {
    if (val === null && activePlanChatId) {
      const planToReopen = activePlanChatId;
      setSelectedPlanId(planToReopen);
      if (chatOriginTab) {
        setActiveTab(chatOriginTab as any);
        setChatOriginTab(null);
      }
    }
    setActivePlanChatId(val);
  };

  React.useEffect(() => {
    if (activeTab !== "circles") {
      setActivePlanChatId(null);
    }
    setChildrenWantBottomNavHidden(false);
  }, [activeTab]);

  // Snooze and Auto-Pass overrides
  const [interestedPlanIds, setInterestedPlanIds] = useState<string[]>([]);
  const [snoozedPlanIds, setSnoozedPlanIds] = useState<string[]>([]);
  const [passedByPlanId, setPassedByPlanId] = useState<Record<string, string[]>>({});
  const [reminderSentPlanIds, setReminderSentPlanIds] = useState<string[]>([]);

  // Checkout splits overlay
  const [paymentConfirmationPlanId, setPaymentConfirmationPlanId] = useState<string | null>(null);
  const [showPaymentSuccessId, setShowPaymentSuccessId] = useState<string | null>(null);
  const [showWaitlistSuccessId, setShowWaitlistSuccessId] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // Circle Navigation helpers
  const [circleCreateStep, setCircleCreateStep] = useState<"members" | "details" | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [expandedCircleIds, setExpandedCircleIds] = useState<string[]>([]);
  const [isInvitingFriends, setIsInvitingFriends] = useState(false);

  const [selectedMemoryPlanId, setSelectedMemoryPlanId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(() => {
    return localStorage.getItem("planless_editing_plan_id");
  });
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Derive live plan references from active state IDs
  const selectedPlan = useLivePlan(selectedPlanId);
  const activePlanChat = useLivePlan(activePlanChatId);
  const paymentConfirmationPlan = useLivePlan(paymentConfirmationPlanId);
  const showPaymentSuccess = useLivePlan(showPaymentSuccessId);
  const showWaitlistSuccess = useLivePlan(showWaitlistSuccessId);
  const selectedMemoryPlan = useLivePlan(selectedMemoryPlanId);
  const editingPlan = useLivePlan(editingPlanId);

  const activeMemoryRecord = React.useMemo(() => {
    if (!selectedMemoryPlan) return null;
    return mapDbToMemoryRecord(
      selectedMemoryPlan,
      dbPlanParticipants,
      dbPlanOutcomes,
      dbUsers,
      activeUserId,
      dbMemories,
      dbMemoryResults
    );
  }, [selectedMemoryPlan, dbPlanParticipants, dbPlanOutcomes, dbUsers, activeUserId, dbMemories, dbMemoryResults]);

  React.useEffect(() => {
    console.log(
      "SELECTED_MEMORY_PLAN_CHANGED",
      selectedMemoryPlan?.id
    );
  }, [selectedMemoryPlan]);

  React.useEffect(() => {
    console.log("[NAV_DEBUG] MainApp mounted");
    return () => {
      console.log("[NAV_DEBUG] MainApp unmounted");
    };
  }, []);

  React.useEffect(() => {
    console.log("[NAV_DEBUG] State change detected:", {
      activeTab,
      selectedPlanId,
      selectedCircleId: selectedCircle?.id || null,
      selectedMemoryPlanId,
      editingPlanId,
      activePlanChatId
    });
  }, [activeTab, selectedPlanId, selectedCircle, selectedMemoryPlanId, editingPlanId, activePlanChatId]);

  const homeFeedRef = useRef<HTMLDivElement>(null);

  // triggerToast removed — use showToast from ToastContext directly

  React.useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeUserId)) {
      return;
    }
    async function syncData() {
      try {
        const res = await fetch("/api/db/fetch-all");
        if (res.ok) {
          const json = await res.json();
          if (json.configured) {
            const d = json.data || {};

            // 1. Set profile context
            if (d.users !== undefined) {
              setDbUsers(d.users || []);
              console.log("[USERS_LOADED]", d.users.length);
              if (!d.users.length) {
                console.error("[USER_HYDRATION_FAILED]", "Users list empty");
              }
            }
            if (d.user_data !== undefined) setDbUserData(d.user_data || []);
            if (d.friendships !== undefined) setDbFriendships(d.friendships || []);

            // 2. Set plans context
            if (d.plans !== undefined) setDbPlans(d.plans || []);
            if (d.plan_participants !== undefined) setDbPlanParticipants(d.plan_participants || []);
            if (d.plan_outcomes !== undefined) setDbPlanOutcomes(d.plan_outcomes || []);
            if (d.plan_team_assignments !== undefined) setDbPlanTeamAssignments(d.plan_team_assignments || []);
            // plans is now a useMemo in PlansContext — automatically derived from dbPlans

            // 3. Set circles context — only show circles where the current user is a member
            const allCircles = d.circles || [];
            const allCircleMembers = d.circle_members || [];
            const allDbUsers = d.users || [];
            const meUser = allDbUsers.find((u: any) => u.id === activeUserId || u.user_id === activeUserId);
            const meUuid = meUser ? meUser.id : activeUserId;
            const myCircleIds = meUuid
              ? allCircleMembers.filter((cm: any) => cm.user_id === meUuid).map((cm: any) => cm.circle_id)
              : [];
            const myCircles = allCircles.filter((c: any) => myCircleIds.includes(c.id));
            if (d.circles !== undefined) setDbCircles(allCircles);
            if (d.circle_members !== undefined) setDbCircleMembers(allCircleMembers);

            // Sync validation check: verify circles.created_by matches circle_members.role === 'host'
            allCircles.forEach((circleObj: any) => {
              const creatorUuid = circleObj.created_by;
              const creatorMember = allCircleMembers.find((cm: any) => cm.circle_id === circleObj.id && cm.user_id === creatorUuid);
              if (!creatorMember || creatorMember.role !== "host") {
                console.warn(`[Sync Validation Warning] Circle "${circleObj.name}" (ID: ${circleObj.id}) creator (ID: ${creatorUuid}) does not have 'host' role in circle_members. (Found role: ${creatorMember?.role || 'none'})`);
              }
            });

            // 4. Set wallet context
            if (d.transactions !== undefined) {
              const fetchedTxs = d.transactions || [];
              setDbTransactions(fetchedTxs);
            }

            // 5. Set notifications context
            if (d.notifications !== undefined) {
              const mappedNotifs = mapNotificationsToLegacy(d.notifications || [], d.plans || [], d.users || [], activeUserId);
              setNotifications(mappedNotifs);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch initial Supabase data:", err);
      } finally {
        setIsInitialLoadComplete(true);
      }
    }
    syncData();
  }, [activeUserId]);

  // Snooze swipe vertical snooze actions
  const handleSnoozePlan = (planId: string) => {
    setSnoozedPlanIds(prev => [...prev, planId]);
    showToast("Snoozed: We'll show this plan again later");
  };

  // Write state changes to localStorage
  React.useEffect(() => {
    localStorage.setItem("planless_active_tab", activeTab);
  }, [activeTab]);

  React.useEffect(() => {
    if (selectedPlanId) {
      localStorage.setItem("planless_selected_plan_id", selectedPlanId);
    } else if (isInitialLoadComplete) {
      localStorage.removeItem("planless_selected_plan_id");
    }
  }, [selectedPlanId, isInitialLoadComplete]);

  React.useEffect(() => {
    if (selectedCircle) {
      localStorage.setItem("planless_selected_circle_id", selectedCircle.id);
    } else if (isInitialLoadComplete) {
      localStorage.removeItem("planless_selected_circle_id");
    }
  }, [selectedCircle, isInitialLoadComplete]);

  React.useEffect(() => {
    if (editingPlanId) {
      console.log(
        "[RESTORE_DEBUG] saved editing plan id",
        editingPlanId
      );
      localStorage.setItem("planless_editing_plan_id", editingPlanId);
    } else if (isInitialLoadComplete) {
      console.log("[NAV_DEBUG] Removing planless_editing_plan_id from localStorage");
      localStorage.removeItem("planless_editing_plan_id");
    }
  }, [editingPlanId, isInitialLoadComplete]);

  React.useEffect(() => {
    if (activePlanChatId) {
      localStorage.setItem("planless_active_plan_chat_id", activePlanChatId);
    } else if (isInitialLoadComplete) {
      localStorage.removeItem("planless_active_plan_chat_id");
    }
  }, [activePlanChatId, isInitialLoadComplete]);

  React.useEffect(() => {
    const savedId = localStorage.getItem("planless_selected_circle_id");
    if (selectedCircle) {
      const fresh = circles.find(c => c.id === selectedCircle.id || c.dbUuid === selectedCircle.dbUuid);
      if (fresh && fresh !== selectedCircle) {
        setSelectedCircle(fresh);
      }
    } else if (savedId && circles.length > 0) {
      const fresh = circles.find(c => c.id === savedId || c.dbUuid === savedId);
      if (fresh) {
        setSelectedCircle(fresh);
      }
    }
  }, [circles]);

  const handleSetMemories = async (updater: any) => {
    const currentList = activeMemoryRecord ? [activeMemoryRecord] : [];
    const newList = typeof updater === "function" ? updater(currentList) : updater;
    const newRecord = newList[0];
    if (!newRecord || !activeMemoryRecord) return;

    // planId is always the plan's UUID directly (plan_outcomes.plan_id references plan directly)
    const memoryId = selectedMemoryPlan?.dbUuid || selectedMemoryPlan?.id || "";

    // 1. Movie Verdicts
    if (newRecord.movieRatings !== activeMemoryRecord.movieRatings) {
      const myRatingObj = newRecord.movieRatings["Thilaka Sundar"];
      const oldRatingObj = activeMemoryRecord.movieRatings["Thilaka Sundar"];
      if (myRatingObj && myRatingObj !== oldRatingObj) {
        const existing = dbPlanOutcomes.find(o => o.plan_id === memoryId && o.submitted_by_user_id === activeUserId && o.outcome_type === "review");
        await submitReview(memoryId, 'movie', myRatingObj.rating, myRatingObj.review || "", activeUserId, existing?.id);
      }
    }

    // 2. Dining Reviews
    if (newRecord.diningRatings !== activeMemoryRecord.diningRatings) {
      const myRatingObj = newRecord.diningRatings["Thilaka Sundar"];
      const oldRatingObj = activeMemoryRecord.diningRatings["Thilaka Sundar"];
      if (myRatingObj && myRatingObj !== oldRatingObj) {
        const existing = dbPlanOutcomes.find(o => o.plan_id === memoryId && o.submitted_by_user_id === activeUserId && o.outcome_type === "review");
        await submitReview(memoryId, 'dining', myRatingObj.rating, myRatingObj.review || "", activeUserId, existing?.id);
      }
    }

    // 3. Football score
    if (newRecord.footballScore !== activeMemoryRecord.footballScore && newRecord.footballScore) {
      await submitStats(memoryId, 'football', { scoreA: newRecord.footballScore.teamA, scoreB: newRecord.footballScore.teamB }, activeUserId);
    }



    // 5. MVP vote
    if (newRecord.votedUserMvp !== activeMemoryRecord.votedUserMvp && newRecord.votedUserMvp) {
      const votedUser = dbUsers.find(u => u.full_name === newRecord.votedUserMvp || (u as any).name === newRecord.votedUserMvp);
      if (votedUser) {
        const votedUuid = votedUser.id || votedUser.user_id;
        await submitMvp(memoryId, activeUserId, votedUuid);
      }
    }
  };

  const parseDateTimeStringToIso = (timeStr: string): string => {
    try {
      const parts = timeStr.split('•').map(p => p.trim());
      const datePart = parts[0] || '';
      const timePart = parts[1] || '';

      const now = new Date();
      let targetDate = new Date();

      const dateClean = datePart.trim().toLowerCase();
      if (dateClean === 'today') {
        // Keep today
      } else if (dateClean === 'tomorrow') {
        targetDate.setDate(now.getDate() + 1);
      } else if (dateClean) {
        const dateParts = datePart.split(',').map(s => s.trim());
        const parseablePart = dateParts[1] || dateParts[0];
        const words = parseablePart.split(/\s+/).filter(Boolean);

        let day = now.getDate();
        let month = now.getMonth();

        if (words.length >= 2) {
          const isFirstWordNumber = !isNaN(parseInt(words[0]));
          const dayStr = isFirstWordNumber ? words[0] : words[1];
          const monthStr = isFirstWordNumber ? words[1] : words[0];

          day = parseInt(dayStr) || day;
          const monthIndex = [
            'jan', 'feb', 'mar', 'apr', 'may', 'jun',
            'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
          ].findIndex(m => monthStr.toLowerCase().startsWith(m));

          if (monthIndex !== -1) {
            month = monthIndex;
          }
        }
        targetDate.setMonth(month);
        targetDate.setDate(day);
        targetDate.setFullYear(2026);
      }

      const timeClean = timePart.trim().toLowerCase();
      const timeMatch = timeClean.match(/(\d+):(\d+)\s*(am|pm)?/);
      let hours = 12;
      let minutes = 0;
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const ampm = timeMatch[3];
        if (ampm === 'pm' && hours < 12) {
          hours += 12;
        } else if (ampm === 'am' && hours === 12) {
          hours = 0;
        }
      }
      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate.toISOString();
    } catch (err) {
      console.error("Failed to parse date/time string, falling back to current time", err);
      return new Date().toISOString();
    }
  };
  const handleSaveEditedPlan = async (updatedPlan: Plan) => {
    try {
      const parsedIso = (updatedPlan.datetime && updatedPlan.datetime.includes("T"))
        ? new Date(updatedPlan.datetime).toISOString()
        : parseDateTimeStringToIso(updatedPlan.time);

      const updates = {
        title: updatedPlan.title,
        datetime: parsedIso,
        location: updatedPlan.location,
        join_limit: updatedPlan.capacity,
        max_people: updatedPlan.capacity,
        cover_image: updatedPlan.coverImage,
        description: updatedPlan.description,
        split_amount: updatedPlan.cost,
        payment_required: (updatedPlan.cost || 0) > 0,
        response_deadline_at: updatedPlan.response_deadline_at,
      };
      const rebalanceInfo = await updatePlanDetails(updatedPlan.id, updates);
      setEditingPlanId(null);
      if (rebalanceInfo && rebalanceInfo.promotedCount > 0) {
        showToast(`Promotion: ${rebalanceInfo.promotedCount} ${rebalanceInfo.promotedCount === 1 ? 'participant' : 'participants'} moved from waitlist to going.`);
      } else if (rebalanceInfo && rebalanceInfo.demotedCount > 0) {
        showToast(`Demotion: ${rebalanceInfo.demotedCount} ${rebalanceInfo.demotedCount === 1 ? 'participant' : 'participants'} moved from going to waitlist.`);
      } else {
        showToast("✓ Plan Updated Successfully");
      }
    } catch (err: any) {
      console.error("Failed to update plan details:", err);
      showToast("Unable to update plan. Please try again.");
    }
  };
  const handleCancelEditedPlan = async (planId: string) => {
    try {
      await cancelPlan(planId);
      setEditingPlanId(null);
      showToast("Plan cancelled successfully.");
    } catch (err: any) {
      console.error("Failed to cancel plan:", err);
      showToast("Failed to cancel plan.");
    }
  };



  // Checkin join toggle
  const handleToggleJoin = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    await joinPlan(plan.id, userProfile);

    // Sync Wallet & Ledger for cost-based plans without payment_required (which bypass Razorpay checkout but still deduct balance)
    if (plan.cost > 0 && !(plan as any).payment_required) {
      // Resolve UUIDs before writing to DB (transactions must use users.id, not user_id)
      const meTxUser = dbUsers.find(u => u.user_id === activeUserId);
      const meTxUuid = meTxUser?.id || activeUserUuid || activeUserId;
      const creatorTxUser = dbUsers.find(u => u.user_id === plan.creatorId || u.id === plan.creatorId);
      const creatorTxUuid = creatorTxUser?.id || plan.creatorId || null;

      const newDbTx = {
        transaction_id: `T_pay_${Date.now()}`,
        sender_id: meTxUuid,
        receiver_id: creatorTxUuid,
        plan_id: plan.dbUuid || plan.id,
        amount: plan.cost,
        transaction_type: "split_payment",
        status: "success",
        timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        created_at: new Date().toISOString()
      };
      await insertTransaction(newDbTx as any);
    }
    await refreshTransactions();
  };

  // Cash deposits
  const handleDepositMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast("Enter a valid amount to deposit");
      return;
    }

    // Resolve UUID for receiver before writing to DB
    const meDepUser = dbUsers.find(u => u.user_id === activeUserId);
    const meDepUuid = meDepUser?.id || activeUserUuid || activeUserId;
    const newDbTx = {
      transaction_id: `T_dep_${Date.now()}`,
      sender_id: "UPI",
      receiver_id: meDepUuid,
      plan_id: null,
      amount: amountNum,
      transaction_type: "deposit",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      created_at: new Date().toISOString()
    };
    await insertTransaction(newDbTx as any);
    await refreshTransactions();

    setDepositAmount("");
    setShowDepositModal(false);
    showToast(`💰 Added ₹${amountNum} successfully!`);
  };

  // Buddy groups creation
  const handleCreateCircle = (
    name: string,
    description: string,
    image: string | null,
    memberIds: string[]  // short user_id values e.g. "U002"
  ) => {
    if (!name.trim()) {
      showToast("Give your circle a name!");
      return;
    }

    const circleCover = image || getInitialsAvatar(name);

    // Resolve current user's UUID
    const meUser = dbUsers.find(u => u.user_id === activeUserId);
    const meUuid = userProfile.dbUuid || (meUser ? (meUser as any).id : activeUserId);

    const adminMemberObj = {
      userId: activeUserId,
      name: meUser?.full_name || userProfile.name,
      phone: meUser?.phone_number || "",
      avatar: meUser?.profile_photo || getInitialsAvatar(meUser?.full_name || userProfile.name)
    };

    const invitedMembers = memberIds.map(shortId => {
      const u = dbUsers.find(usr => usr.user_id === shortId);
      return {
        userId: shortId,
        name: u?.full_name || "Unknown Friend",
        phone: u?.phone_number || "",
        avatar: u?.profile_photo || getInitialsAvatar(u?.full_name || "Unknown Friend")
      };
    });

    const allMembersList = [adminMemberObj, ...invitedMembers];

    const tempCircleId = `__temp__${Date.now()}`;
    const now = new Date().toISOString();

    const tempDbCircle: DbCircle = {
      circle_id: tempCircleId,
      id: tempCircleId,
      name,
      description: description || "An active private circle for coordination.",
      category: "custom",
      created_by: meUuid,
      cover_image: circleCover,
      location_anchor: "Spontaneous",
      privacy: "private",
      created_at: now
    } as any;

    const tempDbCircleMembers: DbCircleMember[] = [
      {
        circle_member_id: `CM_temp_host_${Date.now()}`,
        circle_id: tempCircleId,
        user_id: meUuid,
        role: "host",
        joined_at: now
      },
      ...memberIds.map((shortId, idx) => {
        const uObj = dbUsers.find(u => u.user_id === shortId);
        const uUuid = uObj ? (uObj as any).id : shortId;
        return {
          circle_member_id: `CM_temp_member_${idx}_${Date.now()}`,
          circle_id: tempCircleId,
          user_id: uUuid,
          role: "member" as const,
          joined_at: now
        };
      })
    ];

    // Persist to Supabase (async, non-blocking)
    const persistCircle = async () => {
      try {
        const savedCircle = await insertCircle({
          circle_id: `c_${Date.now()}`,
          name,
          description: description || "An active private circle for coordination.",
          category: "custom",
          created_by: meUuid,
          cover_image: circleCover,
          location_anchor: "Spontaneous",
          privacy: "private",
          created_at: now
        });

        if (!savedCircle || !(savedCircle as any).id) {
          console.error("[Circles] insertCircle returned no UUID", savedCircle);
          return;
        }

        const circleUuid = (savedCircle as any).id;
        console.log("[Circles] Created circle UUID:", circleUuid);

        // Build member rows using UUIDs
        const membersToInsert = [
          { circle_id: circleUuid, user_id: meUuid, role: "host" as const, joined_at: now },
          ...memberIds.map(shortId => {
            const uObj = dbUsers.find(u => u.user_id === shortId);
            const uUuid = uObj ? (uObj as any).id : shortId;
            return { circle_id: circleUuid, user_id: uUuid, role: "member" as const, joined_at: now };
          })
        ];

        const insertedMembers = await insertCircleMembers(membersToInsert);
        console.log("[Circles] Inserted members:", insertedMembers?.length);

        // Sync stats for all members
        for (const m of membersToInsert) {
          await syncUserStats(m.user_id, "join_circle");
        }

        // Replace the temp circle in db states with real ones
        const realDbCircle: DbCircle = {
          circle_id: circleUuid,
          id: circleUuid,
          name,
          description: tempDbCircle.description,
          category: tempDbCircle.category,
          created_by: meUuid,
          cover_image: circleCover,
          location_anchor: tempDbCircle.location_anchor,
          privacy: tempDbCircle.privacy,
          created_at: now
        } as any;

        const realDbMembers: DbCircleMember[] = membersToInsert.map((m, idx) => ({
          circle_member_id: `CM_real_${idx}_${Date.now()}`,
          circle_id: circleUuid,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at
        }));

        setDbCircles(prev => [realDbCircle, ...prev.filter(c => c.circle_id !== tempCircleId && c.id !== tempCircleId)]);
        setDbCircleMembers(prev => [
          ...prev.filter(m => m.circle_id !== tempCircleId),
          ...realDbMembers
        ]);
      } catch (err) {
        console.error("[Circles] Failed to persist circle:", err);
      }
    };

    // Show optimistic UI immediately by setting db states
    setDbCircles(prev => [tempDbCircle, ...prev]);
    setDbCircleMembers(prev => [...prev, ...tempDbCircleMembers]);

    persistCircle();

    showToast(`👥 Circle "${name}" created!`);
  };

  // Settle overdue shared split bills from Notifications list
  const handleSettleOverdue = async (notification: NotificationItem) => {
    const cost = notification.cost || 0;
    if (cost > walletBalance) {
      showToast(`Unable to settle. Please top-up ₹${cost - walletBalance} into wallet.`);
      setActiveTab("profile");
      return;
    }

    // Resolve UUIDs before writing to DB
    const meStlUser = dbUsers.find(u => u.user_id === activeUserId);
    const meStlUuid = meStlUser?.id || activeUserUuid || activeUserId;
    const creatorStlUser = dbUsers.find(u => u.user_id === notification.creatorId || u.id === notification.creatorId);
    const creatorStlUuid = creatorStlUser?.id || notification.creatorId || null;
    const newDbTx = {
      transaction_id: `T_stl_${Date.now()}`,
      sender_id: meStlUuid,
      receiver_id: creatorStlUuid,
      plan_id: notification.planId || null,
      amount: cost,
      transaction_type: "settlement",
      status: "success",
      timestamp: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      created_at: new Date().toISOString()
    };
    await insertTransaction(newDbTx as any);
    await refreshTransactions();

    setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, settled: true } : n));
    // Persist read/settled status to Supabase database
    fetch("/api/db/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "notifications",
        records: [{ id: notification.id, is_read: true }]
      })
    }).catch(err => console.error("Failed to mark notification as read:", err));

    showToast("✅ Settled & shared with circle!");
  };

  const handleAcceptInviteFromNotif = async (notif: NotificationItem) => {
    if (!notif.planId) return;
    const targetPlan = plans.find(p => p.id === notif.planId);
    if (targetPlan) {
      await handleToggleJoin(targetPlan);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, settled: true } : n));
      // Persist read/settled status to Supabase database
      fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "notifications",
          records: [{ id: notif.id, is_read: true }]
        })
      }).catch(err => console.error("Failed to mark notification as read:", err));
    }
  };

  const handleOpenNotification = async (notif: NotificationItem) => {
    // 1. Mark read in DB if not already read
    if (!notif.settled) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, settled: true } : n));
      fetch("/api/db/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "notifications",
          records: [{ id: notif.id, is_read: true }]
        })
      }).catch(err => console.error("Failed to mark notification as read:", err));
    }

    // 2. Open associated plan preview
    if (notif.planId) {
      const plan = plans.find(p => p.plan_id === notif.planId || p.id === notif.planId);
      if (plan) {
        setSelectedPlanId(plan.id);
        setShowNotifications(false);
      }
    }
  };

  // Syncing countdown timers
  const upcomingCirclePlans = React.useMemo(() => {
    return plans.filter(p => !p.isHappened && p.status !== "cancelled");
  }, [plans]);

  // Resolve current user's UUID
  const meUserObj = React.useMemo(() => {
    return dbUsers.find(u => u.user_id === activeUserId);
  }, [dbUsers, activeUserId]);

  const meUuid = React.useMemo(() => {
    return meUserObj ? (meUserObj as any).id : activeUserId;
  }, [meUserObj, activeUserId]);

  // Filter plans based on visibility rules:
  // A plan is visible on Home strictly based on plan_participants record status.
  const discoverablePlans = React.useMemo(() => {
    return getHomeFeedPlans(activeUserId);
  }, [getHomeFeedPlans, activeUserId]);

  const homeBadgeCount = React.useMemo(() => {
    return discoverablePlans.length;
  }, [discoverablePlans]);

  const pendingMemoryCount = React.useMemo(() => {
    const completedPlans = plans.filter(p => p.status === "completed" || p.isHappened);
    return completedPlans.filter(plan => {
      const memInfo = derivePlanMemoryInfo(plan, dbPlanParticipants);
      // Permissions derive exclusively from plans.host_id — creatorId grants no host powers after transfer.
      const isHost = plan.hostId === activeUserUuid || plan.hostId === activeUserId;
      const userId = activeUserUuid || activeUserId;
      return hasOutstandingMemoryAction(memInfo, userId, isHost, dbPlanOutcomes);
    }).length;
  }, [plans, dbPlanParticipants, activeUserId, activeUserUuid, dbPlanOutcomes]);

  const completedMemories = React.useMemo(() => {
    const completedPlans = plans.filter(p => p.status === "completed" || p.isHappened);
    const userId = activeUserUuid || activeUserId;
    return completedPlans
      .filter(plan =>
        dbPlanParticipants.some(
          pp => (pp.plan_id === plan.id || pp.plan_id === plan.dbUuid) && pp.user_id === userId && pp.status === "going"
        )
      )
      .map(plan => {
        const isHost = plan.hostId === activeUserUuid || plan.hostId === activeUserId;
        const memInfo = derivePlanMemoryInfo(plan, dbPlanParticipants);
        const isPending = hasOutstandingMemoryAction(memInfo, userId, isHost, dbPlanOutcomes);

        const mType = (memInfo.memoryType || "").toLowerCase();
        let subtitle = "";
        if (mType === "movie") subtitle = "✓ Memory Recorded";
        else if (mType === "dining") subtitle = "✓ Memory Recorded";
        else if (mType === "football") subtitle = "✓ Result Recorded";
        else if (mType === "badminton") subtitle = "✓ Results Recorded";

        return {
          memInfo,
          plan,
          title: plan.title,
          subtitle,
          isPending
        };
      });
  }, [plans, dbPlanParticipants, activeUserId, activeUserUuid, dbPlanOutcomes]);

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter(n => {
      if (notificationFilter === "all") return true;
      if (notificationFilter === "plans") return n.type === "general" || n.type === "invitation";
      if (notificationFilter === "payments") return n.type === "payments" || n.type === "payment";
      return false;
    });
  }, [notifications, notificationFilter]);

  const shouldShowBottomNav =
    !selectedPlan &&
    !selectedMemoryPlan &&
    !editingPlan &&
    !childrenWantBottomNavHidden;

  return (
    <div className="w-full h-full bg-[#0C0C0E] flex flex-col justify-between relative overflow-hidden select-none">

      {/* ---------------- FIGMA ALIGNED HEADER ---------------- */}
      {activeTab === "home" && (
        <header id="figma_coordinate_header" className="h-14 shrink-0 border-b border-zinc-950 bg-[#09090b]/99 backdrop-blur-md flex items-center justify-between px-4 z-30 select-none relative">
          <div className="flex items-center gap-1.5 z-10">
            <button
              onClick={() => {
                setActiveTab("profile");
                setShowNotifications(false);
              }}
              className="relative group shrink-0 block focus:outline-none cursor-pointer"
              aria-label="View Profile Settings"
            >
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-9 h-9 rounded-full border-2 border-zinc-800 object-cover hover:border-[#ff8b66] transition-colors"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-stone-100 font-sans font-black text-xl tracking-[0.25em] leading-none text-center">
              PLANLESS
            </h1>
          </div>

          <div className="flex items-center gap-1.5 z-10">
            <button
              id="bell_notification_trigger"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`w-9 h-9 rounded-full flex items-center justify-center relative cursor-pointer transition-all ${showNotifications ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"}`}
            >
              <Bell className="w-4.5 h-4.5" />
              {(notifications.some(n => !n.settled) || pendingMemoryCount > 0) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff5d41] rounded-full ring-2 ring-zinc-950 shadow animate-pulse" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Toast is now rendered by ToastProvider in App.tsx */}

      {/* ---------------- MAIN APP SCREEN FRAME BODY ---------------- */}
      <main
        id="app_tab_content_wrapper"
        className="flex-1 relative overflow-hidden p-0"
      >
        {/* TAB 1: HOME PANEL */}
        {activeTab === "home" && (
          <HomeScreen
            discoverablePlans={discoverablePlans}
            userProfile={userProfile}
            interestedPlanIds={interestedPlanIds}
            setSelectedPlan={setSelectedPlanId}
            setSelectedMemoryPlan={setSelectedMemoryPlanId}
            setPaymentConfirmationPlan={setPaymentConfirmationPlanId}
            walletBalance={walletBalance}
            handleToggleJoin={handleToggleJoin}
            setShowPaymentSuccess={setShowPaymentSuccessId}
            setShowWaitlistSuccess={setShowWaitlistSuccessId}
            setNotifications={setNotifications}
            activeCardId={activeCardId}
            setActiveCardId={setActiveCardId}
            handleSnoozePlan={handleSnoozePlan}
            handleWaitlistPlan={waitlistPlan}
            homeFeedRef={homeFeedRef}
            selectedPlanId={selectedPlanId}
            onNavigateToPlanChat={handleOpenPlanChat}
            onNavigateToCreate={() => setActiveTab("create")}
          />
        )}

        {/* TAB 2: PLANS — PREMIUM ACTIVITY HUB */}
        {activeTab === "plans" && (
          <PlansScreen
            setSelectedPlanId={setSelectedPlanId}
            passedByPlanId={passedByPlanId}
          />
        )}

        {/* TAB 3: SPONTANEOUS CREATOR - INSTANT PRODUCTIVITY AESTHETICS */}
        {activeTab === "create" && (
          <CreatePlanScreen
            setActiveTab={setActiveTab}
            notifications={notifications}
            setNotifications={setNotifications}
            onToggleBottomNav={setChildrenWantBottomNavHidden}
          />
        )}

        {/* TAB 4: CIRCLES / BUDDY GROUPS THREAD */}
        {activeTab === "circles" && (
          <CirclesScreen
            activePlanChatId={activePlanChatId}
            setActivePlanChatId={handleClosePlanChat}
            circleCreateStep={circleCreateStep}
            setCircleCreateStep={setCircleCreateStep}
            circles={circles}
            selectedCircle={selectedCircle}
            setSelectedCircle={setSelectedCircle}
            notifications={notifications}
            setNotifications={setNotifications}
            activeUserId={activeUserId}
            userProfile={userProfile}
            dbCircleMembers={dbCircleMembers}
            setDbCircleMembers={setDbCircleMembers}
            upcomingCirclePlans={upcomingCirclePlans}
            expandedCircleIds={expandedCircleIds}
            setExpandedCircleIds={setExpandedCircleIds}
            isInvitingFriends={isInvitingFriends}
            setIsInvitingFriends={setIsInvitingFriends}
            setActiveTab={setActiveTab}
            dbUsers={dbUsers}
            setCircles={setCircles}
            plans={plans}
            setPaymentConfirmationPlanId={setPaymentConfirmationPlanId}
            handleToggleJoin={handleToggleJoin}
            setSelectedPlanId={setSelectedPlanId}
            setSelectedMemoryPlanId={setSelectedMemoryPlanId}
            handleCreateCircle={handleCreateCircle}
            onEditPlan={setEditingPlanId}
            onToggleBottomNav={setChildrenWantBottomNavHidden}
          />
        )}

        {/* TAB: WALLET */}
        {activeTab === "wallet" && (
          <WalletScreen
            walletBalance={walletBalance}
            transactions={transactions}
            setShowDepositModal={setShowDepositModal}
            setActiveTab={setActiveTab}
          />
        )}

        {/* TAB 5: PROFILE & ACCOUNT MANAGEMENT */}
        {activeTab === "profile" && (
          <ProfileScreen
            onLogout={onLogout}
            setSelectedPlanId={setSelectedPlanId}
            setSelectedMemoryPlanId={setSelectedMemoryPlanId}
            setShowDbExplorer={setShowDbExplorer}
            setShowDepositModal={setShowDepositModal}
            onToggleBottomNav={setChildrenWantBottomNavHidden}
          />
        )}
      </main>

      {/* ---------------- ACTIVE DETAILED OVERLAY POPUP (PLAN DETAILS) ---------------- */}
      {selectedPlanId && isInitialLoadComplete && (
        <DetailedPlanModal
          planId={selectedPlanId}
          onClose={() => setSelectedPlanId(null)}
          userProfile={userProfile}
          activeUserId={activeUserId}
          setSelectedMemoryPlan={setSelectedMemoryPlanId}
          onEditPlan={setEditingPlanId}
          setShowPaymentSuccess={setShowPaymentSuccessId}
          setShowWaitlistSuccess={setShowWaitlistSuccessId}
          onLeavePlan={() => {
            setSelectedPlanId(null);
            setActivePlanChatId(null);
          }}
          onNavigateToPlanChat={handleOpenPlanChat}
          onNavigateToCircle={(circleId) => {
            const circleObj = dbCircles.find(c => c.circle_id === circleId || c.id === circleId);
            if (circleObj) {
              const legacyCircles = mapCirclesToLegacyCircles(dbCircles, dbCircleMembers, dbUsers);
              const legacyCircle = legacyCircles.find(c => c.id === circleId || c.dbUuid === circleId);
              if (legacyCircle) {
                setSelectedCircle(legacyCircle);
              }
            }
            setActiveTab("circles");
          }}
        />
      )}



      {/* ---------------- 📝 MEMORY DETAIL SCREEN ---------------- */}
      {selectedMemoryPlanId && isInitialLoadComplete && selectedMemoryPlan && activeMemoryRecord && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col">
          <MemoryScreen
            planId={selectedMemoryPlanId}
            onBack={() => setSelectedMemoryPlanId(null)}
            memories={[activeMemoryRecord]}
            setMemories={handleSetMemories}
            circleId={selectedMemoryPlan.groupId || "c1"}
          />
        </div>
      )}

      {/* ---------------- ✏️ EDIT PLAN SCREEN ---------------- */}
      {editingPlanId && isInitialLoadComplete && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col">
          <EditPlanScreen
            planId={editingPlanId}
            onBack={() => setEditingPlanId(null)}
            onSave={handleSaveEditedPlan}
            onEndPlan={handleCancelEditedPlan}
          />
        </div>
      )}

      {/* ---------------- 💾 RELATIONAL DATABASE EXPLORER ---------------- */}
      <DbExplorerModal
        isOpen={showDbExplorer}
        onClose={() => setShowDbExplorer(false)}
        selectedDbTable={selectedDbTable}
        setSelectedDbTable={setSelectedDbTable}
        dbUsers={dbUsers}
        dbCircles={dbCircles}
        dbCircleMembers={dbCircleMembers}
        dbPlans={dbPlans}
        dbPlanParticipants={dbPlanParticipants}
        dbTransactions={dbTransactions}
        dbPlanOutcomes={dbPlanOutcomes}
      />

      {/* ---------------- 🔔 NOTIFICATIONS SCREEN OVERLAY ---------------- */}
      {showNotifications && (
        <div className="fixed inset-x-0 top-0 bottom-18 z-40 bg-black flex flex-col">
          <NotificationsScreen
            notifications={notifications}
            onBack={() => setShowNotifications(false)}
            onAcceptInvite={(notif) => {
              handleAcceptInviteFromNotif(notif);
              setShowNotifications(false);
            }}
            onOpenNotification={(notif) => {
              handleOpenNotification(notif);
              setShowNotifications(false);
            }}
            completedMemories={completedMemories}
            onSelectMemoryPlan={(plan) => {
              setSelectedMemoryPlanId(plan.id);
              setShowNotifications(false);
            }}
          />
        </div>
      )}

      {/* ---------------- DEPOSIT CASH MODAL ---------------- */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        handleDepositMoney={handleDepositMoney}
      />

      {/* 💳 LIGHTWEIGHT PAYMENT CONFIRMATION SCREEN */}
      <PaymentConfirmationModal
        paymentConfirmationPlanId={paymentConfirmationPlanId}
        onClose={() => setPaymentConfirmationPlanId(null)}
        walletBalance={walletBalance}
        handleToggleJoin={handleToggleJoin}
        setSelectedPlanId={setSelectedPlanId}
        setShowPaymentSuccessId={setShowPaymentSuccessId}
      />

      {/* RESERVATION SUCCESS OVERLAYS */}
      <ReservationSuccessModal
        planId={showPaymentSuccessId || showWaitlistSuccessId}
        isWaitlist={!!showWaitlistSuccessId}
        onClose={() => {
          setShowPaymentSuccessId(null);
          setShowWaitlistSuccessId(null);
        }}
        setActiveTab={setActiveTab}
      />

      {/* ---------------- NAVIGATION FOOTER TABS ---------------- */}
      {shouldShowBottomNav && (
        <footer id="main_app_footer_nav" className="h-18 shrink-0 border-t border-zinc-950 bg-[#09090b]/99 backdrop-blur-md flex justify-around items-center px-4 z-30 pb-2 shadow-2xl relative select-none">
          <button
            id="nav_item_home"
            onClick={() => { setActiveTab("home"); setShowNotifications(false); }}
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all cursor-pointer ${activeTab === "home" ? "text-[#ff8b66]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <div className="relative">
              <Home className="w-4.5 h-4.5" />
              {homeBadgeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#f43f5e] text-white text-[8px] font-sans font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow">
                  {homeBadgeCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-sans tracking-wide mt-1 font-medium">Home</span>
          </button>

          <button
            id="nav_item_plans"
            onClick={() => { setActiveTab("plans"); setShowNotifications(false); }}
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all cursor-pointer ${activeTab === "plans" ? "text-[#ff8b66]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans tracking-wide mt-1 font-medium">Plans</span>
          </button>

          <button
            id="nav_item_create"
            onClick={() => {
              setActiveTab("create");
              setShowNotifications(false);
            }}
            className="flex flex-col items-center justify-center w-12 h-12 transition-all cursor-pointer"
          >
            <div className={`w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${activeTab === "create" ? "border-[#ff8b66]" : ""}`}>
              <Plus className="w-4 h-4 text-[#ff8b66]" />
            </div>
            <span className="text-[9px] font-sans tracking-wide mt-0.5 font-medium">Create</span>
          </button>

          <button
            id="nav_item_circles"
            onClick={() => { setActiveTab("circles"); setShowNotifications(false); }}
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all cursor-pointer ${activeTab === "circles" ? "text-[#ff8b66]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans tracking-wide mt-1 font-medium">Circle</span>
          </button>

          <button
            id="nav_item_wallet"
            onClick={() => { setActiveTab("wallet"); setShowNotifications(false); }}
            className={`flex flex-col items-center justify-center w-12 h-12 transition-all cursor-pointer ${activeTab === "wallet" ? "text-[#ff8b66]" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Wallet className="w-4.5 h-4.5" />
            <span className="text-[9px] font-sans tracking-wide mt-1 font-medium">Wallet</span>
          </button>
        </footer>
      )}

      {activeTab === "circles" && !circleCreateStep && !selectedCircle && (
        <div className="absolute bottom-[84px] right-4 z-50 animate-fade-in">
          <button
            type="button"
            onClick={() => setCircleCreateStep("members")}
            className="inline-flex h-13 w-13 items-center justify-center rounded-full bg-[#09090b] border-2 border-[#ff8b66] text-[#ff8b66] shadow-lg transition-transform hover:scale-[1.06] active:scale-[0.95]"
          >
            <div className="relative">
              <span className="text-xl">👥</span>
              <span className="absolute -top-1.5 -right-2 bg-black border border-[#ff8b66] text-[#ff8b66] font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">+</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function mapDbToMemoryRecord(
  plan: Plan,
  dbPlanParticipants: any[],
  dbPlanOutcomes: DbPlanOutcome[],
  dbUsers: any[],
  activeUserId: string,
  dbMemories?: any[],
  dbMemoryResults?: any[]
): MemoryRecord {
  // planId is the direct key used in plan_outcomes.plan_id
  const planId = plan.dbUuid || plan.id;

  const memoryObj = dbMemories?.find(m => m.plan_id === planId);
  const memoryResult = memoryObj ? dbMemoryResults?.find(r => r.memory_id === memoryObj.id) : null;

  // Attendees are plan_participants with status === "going"
  const attendees = dbPlanParticipants
    .filter(pp => (pp.plan_id === planId || pp.plan_id === plan.id) && pp.status === "going")
    .map(pp => {
      const u = dbUsers.find((u: any) => u.id === pp.user_id || u.user_id === pp.user_id);
      return {
        name: u?.full_name || "Member",
        avatar: u?.profile_photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u?.full_name || "UA")}&backgroundColor=ff8b66`,
        isHost: plan.hostId === pp.user_id,
      };
    });

  if (attendees.length === 0) {
    const members = plan.members || [];
    members.forEach(m => {
      attendees.push({
        name: m.name || "Member",
        avatar: m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name || "UA")}&backgroundColor=ff8b66`,
        isHost: plan.hostId === m.userId,
      });
    });
  }

  const matchResult = dbPlanOutcomes.find(o => o.plan_id === planId && o.outcome_type === 'stats');
  let footballScore = matchResult ? { teamA: matchResult.payload.teamAScore, teamB: matchResult.payload.teamBScore } : undefined;
  if (!footballScore && memoryResult && memoryObj?.memory_type === 'football') {
    footballScore = { teamA: memoryResult.score_home, teamB: memoryResult.score_away };
  }



  const movieRatings: Record<string, { rating: number; review?: string }> = {};
  const movieVerdicts = dbPlanOutcomes.filter(o => o.plan_id === planId && o.outcome_type === 'review' && plan.category === 'movies');
  movieVerdicts.forEach(o => {
    const u = dbUsers.find((u: any) => u.id === o.submitted_by_user_id || u.user_id === o.submitted_by_user_id);
    if (u?.full_name) {
      movieRatings[u.full_name] = { rating: o.payload.rating, review: o.payload.review || "" };
    }
  });

  const diningRatings: Record<string, { rating: number; review?: string }> = {};
  const restaurantVotes = dbPlanOutcomes.filter(o => o.plan_id === planId && o.outcome_type === 'review' && plan.category === 'restaurants');
  restaurantVotes.forEach(o => {
    const u = dbUsers.find((u: any) => u.id === o.submitted_by_user_id || u.user_id === o.submitted_by_user_id);
    if (u?.full_name) {
      diningRatings[u.full_name] = { rating: o.payload.rating, review: o.payload.review || "" };
    }
  });

  // Fallback ratings for movie/dining from memory_results
  if (memoryResult && (memoryObj?.memory_type === 'movies' || memoryObj?.memory_type === 'dining')) {
    const hostUser = dbUsers.find(u => u.id === plan.hostId || u.user_id === plan.hostId);
    const hostName = hostUser?.full_name || "Thilaka Sundar";
    const ratingsMap = memoryObj.memory_type === 'movies' ? movieRatings : diningRatings;
    if (!ratingsMap[hostName] && memoryResult.average_rating !== null) {
      ratingsMap[hostName] = { rating: Number(memoryResult.average_rating), review: memoryResult.review || "" };
    }
  }

  const mvpVotes: Record<string, number> = {};
  const mvpVotesList = dbPlanOutcomes.filter(o => o.plan_id === planId && o.outcome_type === 'mvp_vote');
  mvpVotesList.forEach(o => {
    const nominee = dbUsers.find((u: any) => u.id === o.payload.mvp_user_id || u.user_id === o.payload.mvp_user_id);
    if (nominee?.full_name) {
      mvpVotes[nominee.full_name] = (mvpVotes[nominee.full_name] || 0) + 1;
    }
  });

  let votedUserMvp = undefined;
  const myMvpVoteObj = mvpVotesList.find(o => o.submitted_by_user_id === activeUserId);
  const myMvpVoteUser = myMvpVoteObj ? dbUsers.find((u: any) => u.id === myMvpVoteObj.payload.mvp_user_id || u.user_id === myMvpVoteObj.payload.mvp_user_id) : undefined;
  votedUserMvp = myMvpVoteUser?.full_name;

  if (!votedUserMvp && memoryResult && memoryResult.mvp_user_id) {
    const mvpUser = dbUsers.find((u: any) => u.id === memoryResult.mvp_user_id || u.user_id === memoryResult.mvp_user_id);
    votedUserMvp = mvpUser?.full_name;
    if (votedUserMvp) {
      mvpVotes[votedUserMvp] = (mvpVotes[votedUserMvp] || 0) + 1;
    }
  }

  const category = plan.category === "restaurants" ? "dining" : (plan.category as any);
  const subcategory = (plan as any).activity_type || (plan as any).activityType || null;

  // Option A: always allow editing (far future)
  const FAR_FUTURE = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();



  return {
    id: planId,
    title: plan.title,
    category: category || "custom",
    subcategory,
    image: (plan.coverImage && !plan.coverImage.includes("unsplash.com") && !plan.coverImage.includes("navkis_matchday.png"))
      ? plan.coverImage
      : getPlanCover(plan.category, (plan as any).subcategory || (plan as any).sports_type || subcategory),
    location: plan.location || "",
    time: plan.time || "",
    completedAt: new Date().toISOString(),
    editableUntil: FAR_FUTURE,
    memory_attendees: attendees,
    recapTitle: plan.title,
    recapMetrics: [],
    mvpVotes,
    votedUserMvp,
    funFactorCount: 14,
    userClickedFunFactor: false,
    highlights: [],
    footballScore,
    movieRatings,
    diningRatings,
  };
}
