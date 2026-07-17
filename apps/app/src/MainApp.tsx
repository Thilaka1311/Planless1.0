import React, { useState, useRef } from "react";
import { useToast } from "./shared/contexts/ToastContext";
import { supabase } from "./lib/supabaseClient";
import {
  Bell, Users, Plus, Home, Calendar, Wallet, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Plan, Circle, NotificationItem, Transaction, DbCircle, DbCircleMember, DbPlan, DbPlanParticipant, DbTransaction, DbPlanOutcome } from "./core/types";
import { getInitialsAvatar, mapCirclesToLegacyCircles, mapTransactionsToLegacy, mapNotificationsToLegacy } from "./lib/mappers";
import { insertCircle, insertCircleMembers, syncUserStats, insertTransaction } from "./lib/db";
import { usePlansStore } from "./features/plans/state/PlansContext";
import { useProfileStore } from "./features/profile/state/ProfileContext";
import { useWalletStore } from "./features/wallet/state/WalletContext";
import { useCirclesStore } from "./features/circles/state/CirclesContext";
import { CirclesScreen } from "./features/circles/screens/CirclesScreen";
import { CreateNewCircleButton } from "./features/circles/components/CreateNewCircleButton";
import { WalletScreen } from "./features/wallet/screens/WalletScreen";
import { HomeScreen } from "./features/home/screens/HomeScreen";
import { PlansScreen } from "./features/plans/screens/PlansScreen/PlansScreen";
import { CreatePlanScreen } from "./features/create/screens/Create";
import { ProfileScreen } from "./features/profile/screens/ProfileScreen";
import { NotificationsScreen } from "./features/notifications/screens/NotificationsScreen";
import DetailedPlanModal from "./components/common screens/DetailedPlanModal";
import { getPlanCover } from "./features/plans/config/planCoverImages";
import NotificationsTrayModal from "./shared/modals/NotificationsTrayModal";
import DepositCashModal from "./shared/modals/DepositCashModal";
import PaymentConfirmationModal from "./shared/modals/PaymentConfirmationModal";
import ReservationSuccessModal from "./shared/modals/ReservationSuccessModal";
import { NavigationFooter } from "./components/NavigationFooter";
import { HomeHeader } from "./components/HomeHeader";
import { MemoryRecord } from "./features/plans/screens/MemoryScreen";
import { useLivePlan } from "./features/plans/hooks/useLivePlan";
import { SearchYourPlansScreen } from "./features/plans/screens/PlansScreen/SearchYourPlansScreen";
interface MainAppProps {
  userProfile: UserProfile;
  onLogout: () => void;
  activeUserId: string;
}

export default function MainApp({ userProfile, onLogout, activeUserId }: MainAppProps) {
  // --- Decoupled Context Stores ---
  const { plans, dbPlans, setDbPlans, dbPlanParticipants, setDbPlanParticipants, dbPlanOutcomes, setDbPlanOutcomes, dbPlanTeamAssignments, setDbPlanTeamAssignments, joinPlan, waitlistPlan, passPlan, submitReview, submitStats, submitMvp, updatePlanDetails, cancelPlan, getHomeFeedPlans, dbMemories, dbMemoryResults } = usePlansStore();
  const { dbUsers, setDbUsers, setDbUserData, setDbFriendships, updateProfile, activeUserUuid } = useProfileStore();
  const { circles, setCircles, dbCircles, setDbCircles, dbCircleMembers, setDbCircleMembers, createCircle } = useCirclesStore();
  const { walletBalance, transactions, dbTransactions, setDbTransactions, refreshTransactions } = useWalletStore();

  // --- Core Navigation Tab state ---
  const [activeTab, setActiveTab] = useState<"home" | "plans" | "create" | "circles" | "wallet" | "profile">(() => {
    return (localStorage.getItem("planless_active_tab") as any) || "home";
  });
  const [childrenWantBottomNavHidden, setChildrenWantBottomNavHidden] = useState(false);

  // --- Shared Overlays & Interactive States ---
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    return localStorage.getItem("planless_selected_plan_id");
  });

  const [isTrackerExpanded, setIsTrackerExpanded] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "plans" | "payments" | "activity">("all");
  const { showToast } = useToast();
  const [activeCardId, setActiveCardId] = useState<string | null>(null);



  React.useEffect(() => {
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
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [plansFilter, setPlansFilter] = useState<'JOINED' | 'WAITLISTED' | 'passed' | 'hosted'>('JOINED');
  const [plansScrollY, setPlansScrollY] = useState(0);
  const [showPlansSearchScreen, setShowPlansSearchScreen] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // Circle Navigation helpers
  const [circleCreateStep, setCircleCreateStep] = useState<"members" | "details" | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  const [expandedCircleIds, setExpandedCircleIds] = useState<string[]>([]);
  const [isInvitingFriends, setIsInvitingFriends] = useState(false);

  const [selectedMemoryPlanId, setSelectedMemoryPlanId] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Derive live plan references from active state IDs
  const selectedPlan = useLivePlan(selectedPlanId);
  const paymentConfirmationPlan = useLivePlan(paymentConfirmationPlanId);
  const showPaymentSuccess = useLivePlan(showPaymentSuccessId);
  const showWaitlistSuccess = useLivePlan(showWaitlistSuccessId);
  const selectedMemoryPlan = useLivePlan(selectedMemoryPlanId);

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

  const homeFeedRef = useRef<HTMLDivElement>(null);

  // triggerToast removed — use showToast from ToastContext directly

  React.useEffect(() => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(activeUserId)) {
      return;
    }
    async function syncData() {
      try {
        const { data: plansData } = await (supabase as any)
          .from("plans")
          .select("*, discovery_items(category, subcategory)");
        const { data: participantsData } = await (supabase as any).from("plan_participants").select("*");
        if (plansData) setDbPlans(plansData);
        if (participantsData) setDbPlanParticipants(participantsData);
        setDbPlanTeamAssignments([]);

        // Load circles domain directly from Supabase
        const { data: circlesData } = await (supabase as any).from("circles").select("*");
        const { data: circleMembersData } = await (supabase as any).from("circle_members").select("*");
        const allCircles = circlesData || [];
        const allCircleMembers = circleMembersData || [];

        // Load remaining tables directly from Supabase
        const [
          { data: usersData },
          { data: userDataRows },
          { data: friendshipsData },
          { data: notificationsData },
        ] = await Promise.all([
          (supabase as any).from("users").select("*"),
          (supabase as any).from("user_data").select("*"),
          (supabase as any).from("friendships").select("*"),
          (supabase as any).from("notifications").select("*"),
        ]);

        const planOutcomesData: any[] = [];

        // 1. Set profile context
        if (usersData) {
          setDbUsers(usersData);
          if (!usersData.length) {
            console.error("[USER_HYDRATION_FAILED]", "Users list empty");
          }
        }
        if (userDataRows) setDbUserData(userDataRows);
        if (friendshipsData) setDbFriendships(friendshipsData);

        // 2. Set plans context
        setDbPlanOutcomes([]);

        // 3. Set circles context
        setDbCircles(allCircles);
        setDbCircleMembers(allCircleMembers);

        // Sync validation check
        allCircles.forEach((circleObj: any) => {
          const creatorUuid = circleObj.created_by;
          const creatorMember = allCircleMembers.find((cm: any) => cm.circle_id === circleObj.id && cm.user_id === creatorUuid);
          if (!creatorMember || creatorMember.role !== "admin") {
            console.warn(`[Sync Validation Warning] Circle "${circleObj.name}" (ID: ${circleObj.id}) creator (ID: ${creatorUuid}) does not have 'admin' role in circle_members. (Found role: ${creatorMember?.role || 'none'})`);
          }
        });

        // 5. Set notifications context
        if (notificationsData) {
          const mappedNotifs = mapNotificationsToLegacy(notificationsData, plansData || [], usersData || [], activeUserId);
          setNotifications(mappedNotifs);
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

    // Call store function using the hook result destructured at top of MainApp
    const store = { createCircle }; // createCircle is destructured from useCirclesStore at top of MainApp
    createCircle(name, description, circleCover, memberIds, activeUserId, dbUsers);

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
    // Persist read/settled status to Supabase directly
    (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.id)
      .then(({ error }: any) => {
        if (error) console.error("Failed to mark notification as read:", error);
      });

    showToast("✅ Settled & shared with circle!");
  };

  const handleAcceptInviteFromNotif = async (notif: NotificationItem) => {
    if (!notif.planId) return;
    const targetPlan = plans.find(p => p.id === notif.planId);
    if (targetPlan) {
      await handleToggleJoin(targetPlan);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, settled: true } : n));
      // Persist read/settled status to Supabase directly
      (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
        .then(({ error }: any) => {
          if (error) console.error("Failed to mark notification as read:", error);
        });
    }
  };

  const handleOpenNotification = async (notif: NotificationItem) => {
    // 1. Mark read in DB if not already read
    if (!notif.settled) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, settled: true } : n));
      (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id)
        .then(({ error }: any) => {
          if (error) console.error("Failed to mark notification as read:", error);
        });
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
    return plans.filter(p => !p.isHappened && p.status !== "CANCELLED");
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
    return 0;
  }, []);

  const completedMemories = React.useMemo(() => {
    return [];
  }, []);

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
    !childrenWantBottomNavHidden;

  return (
    <div className="w-full h-full bg-[#0C0C0E] flex flex-col justify-between relative overflow-hidden select-none">

      {/* ---------------- FIGMA ALIGNED HEADER ---------------- */}
      {activeTab === "home" && (
        <HomeHeader
          userProfile={userProfile}
          setActiveTab={setActiveTab}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          pendingMemoryCount={pendingMemoryCount}
        />
      )}

      {activeTab === "plans" && (
        <HomeHeader
          userProfile={userProfile}
          setActiveTab={setActiveTab}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          pendingMemoryCount={pendingMemoryCount}
          showSearch={true}
          onToggleSearch={() => setShowPlansSearchScreen(true)}
          title="Plans"
          scrollY={plansScrollY}
          hideNotificationsIcon={true}
        />
      )}

      {/* Toast is now rendered by ToastProvider in App.tsx */}

      {/* ---------------- MAIN APP SCREEN FRAME BODY ---------------- */}
      <main
        id="app_tab_content_wrapper"
        className="flex-1 relative overflow-hidden p-0 pb-18"
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
            onNavigateToCreate={() => setActiveTab("create")}
          />
        )}

        {/* TAB 2: PLANS — PREMIUM ACTIVITY HUB */}
        {activeTab === "plans" && (
          <PlansScreen
            setSelectedPlanId={setSelectedPlanId}
            passedByPlanId={passedByPlanId}
            plansFilter={plansFilter}
            setPlansFilter={setPlansFilter}
            onScroll={setPlansScrollY}
          />
        )}

        {/* TAB 3: SPONTANEOUS CREATOR - INSTANT PRODUCTIVITY AESTHETICS */}
        {activeTab === "create" && (
          <CreatePlanScreen
            setActiveTab={setActiveTab}
            notifications={notifications}
            setNotifications={setNotifications}
            onToggleBottomNav={setChildrenWantBottomNavHidden}
            setPlansFilter={setPlansFilter}
            setSelectedCircle={setSelectedCircle}
          />
        )}

        {/* TAB 4: CIRCLES / BUDDY GROUPS THREAD */}
        {activeTab === "circles" && (
          <CirclesScreen
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
            onToggleBottomNav={setChildrenWantBottomNavHidden}
          />
        )}

        {/* TAB: WALLET */}
        {activeTab === "wallet" && (
          <WalletScreen
            setActiveTab={setActiveTab}
            setSelectedPlanId={setSelectedPlanId}
          />
        )}

        {/* TAB 5: PROFILE & ACCOUNT MANAGEMENT */}
        {activeTab === "profile" && (
          <ProfileScreen
            onLogout={onLogout}
            setSelectedPlanId={setSelectedPlanId}
            setSelectedMemoryPlanId={setSelectedMemoryPlanId}
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
          setShowPaymentSuccess={setShowPaymentSuccessId}
          setShowWaitlistSuccess={setShowWaitlistSuccessId}
          onLeavePlan={() => {
            setSelectedPlanId(null);
          }}
          onPlanCancelled={() => {
            setSelectedPlanId(null);
            setShowCancelConfirmation(true);
          }}
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




      {/* ---------------- 🔍 SEARCH YOUR PLANS SCREEN ---------------- */}
      {showPlansSearchScreen && (
        <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col">
          <SearchYourPlansScreen
            onBack={() => setShowPlansSearchScreen(false)}
            setSelectedPlanId={(id) => {
              setSelectedPlanId(id);
              setShowPlansSearchScreen(false);
            }}
          />
        </div>
      )}

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
        <NavigationFooter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setShowNotifications={setShowNotifications}
          homeBadgeCount={homeBadgeCount}
        />
      )}

      {activeTab === "circles" && !circleCreateStep && !selectedCircle && (
        <div className="absolute bottom-[84px] right-4 z-50 animate-fade-in">
          <CreateNewCircleButton onClick={() => setCircleCreateStep("members")} />
        </div>
      )}

      {/* ---------------- PLAN CANCELLED CONFIRMATION OVERLAY ---------------- */}
      <AnimatePresence>
        {showCancelConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 bg-[#050505] z-50 flex flex-col justify-between p-5 text-left"
          >
            {/* Upper Centered Content Group */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">

              {/* Cancellation Animation / Indicator */}
              <div className="relative flex items-center justify-center">
                {/* Subtle expanding ring */}
                <motion.div
                  className="absolute rounded-full border border-red-500/30"
                  initial={{ width: 80, height: 80, opacity: 0.6 }}
                  animate={{ width: 170, height: 170, opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                />

                {/* Circular outline animation */}
                <motion.div
                  className="relative w-24 h-24 bg-red-500/5 border border-red-500/30 rounded-full flex items-center justify-center"
                  style={{ boxShadow: '0 0 32px 0 rgba(239,68,68,0.1)' }}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.05 }}
                >
                  {/* Cancellation symbol "X" */}
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25, delay: 0.25 }}
                  >
                    <X className="w-11 h-11 text-red-500 stroke-[2.5]" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Text Group */}
              <div className="text-center space-y-3">
                <motion.h2
                  className="text-3xl font-black text-white tracking-tight leading-none"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
                >
                  Plan Cancelled
                </motion.h2>
                <motion.p
                  className="text-[13px] text-zinc-500 font-medium max-w-[260px] mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.38 }}
                >
                  Your plan has been cancelled. Participants will no longer be able to join or attend this plan.
                </motion.p>
              </div>
            </div>

            {/* Actions Section */}
            <motion.div
              className="px-5 pb-10 pt-4 space-y-3 w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.48 }}
            >
              {/* Return Home (Primary Orange styled) */}
              <motion.button
                type="button"
                onClick={() => {
                  setShowCancelConfirmation(false);
                  setActiveTab('home');
                }}
                className="w-full bg-[#FF6B2C] text-[#050505] py-4 rounded-2xl font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer select-none"
                style={{ boxShadow: '0 8px 28px rgba(255,107,44,0.2)' }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                Return Home
              </motion.button>

              {/* Go to Plans (Secondary standard style) */}
              <motion.button
                type="button"
                onClick={() => {
                  setShowCancelConfirmation(false);
                  setPlansFilter('hosted');
                  setActiveTab('plans');
                }}
                className="w-full bg-transparent border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 py-4 rounded-2xl font-bold text-[11px] tracking-widest uppercase flex items-center justify-center transition-colors cursor-pointer select-none"
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                Go to Plans
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

  // Attendees are plan_participants with rsvp_status === "JOINED"
  const attendees = dbPlanParticipants
    .filter(pp => (pp.plan_id === planId || pp.plan_id === plan.id) && pp.rsvp_status === "JOINED")
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
    image: plan.coverImage || getPlanCover(plan.category, (plan as any).subcategory || (plan as any).sports_type || subcategory),
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
