import React from "react";
import { UserProfile, Plan, NotificationItem } from "../../../core/types";
import { EmptyState } from "../components/EmptyState";
import { FeedHeader } from "../components/FeedHeader";
import { FeedFilters } from "../components/FeedFilters";
import { PlanStack } from "../components/PlanStack";
import { useHomeFeed } from "../hooks/useHomeFeed";
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { getMemoryContribution, hasOutstandingMemoryAction } from "../../../lib/memoryContribution";
import { derivePlanMemoryInfo } from "../../../lib/planMemoryUtils";
import { Star, X } from "lucide-react";

export interface HomeScreenProps {
  discoverablePlans: Plan[];
  userProfile: UserProfile;
  interestedPlanIds: string[];
  setSelectedPlan: (planId: string | null) => void;
  setSelectedMemoryPlan: (planId: string | null) => void;
  setPaymentConfirmationPlan: (planId: string | null) => void;
  walletBalance: number;
  handleToggleJoin: (planId: string) => void;
  setShowPaymentSuccess: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  handleSnoozePlan: (planId: string) => void;
  handleWaitlistPlan: (planId: string) => void;
  homeFeedRef: React.RefObject<HTMLDivElement | null>;
  selectedPlanId?: string | null;
  onNavigateToPlanChat?: (planId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = React.memo(({
  discoverablePlans,
  userProfile,
  interestedPlanIds,
  setSelectedPlan,
  setSelectedMemoryPlan,
  setPaymentConfirmationPlan,
  walletBalance,
  handleToggleJoin,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  setNotifications,
  activeCardId,
  setActiveCardId,
  handleSnoozePlan,
  handleWaitlistPlan,
  homeFeedRef,
  selectedPlanId,
  onNavigateToPlanChat,
}) => {
  const {
    plans,
    dbPlanParticipants,
    dbPlanOutcomes
  } = usePlansStore();
  const { plansToRender, handleScrollLoop } = useHomeFeed(discoverablePlans);

  const prevSelectedPlanIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    // When returning from detailed plan modal (selectedPlanId transitions from non-null to null)
    if (prevSelectedPlanIdRef.current && !selectedPlanId && activeCardId) {
      const basePlanId = activeCardId.replace("-loop-prev-dup", "").replace("-loop-next-dup", "");
      setTimeout(() => {
        const element = document.getElementById(`plan-card-${activeCardId}`) || 
                        document.querySelector(`[id$="${basePlanId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }, 50);
    }
    prevSelectedPlanIdRef.current = selectedPlanId || null;
  }, [selectedPlanId, activeCardId]);
  
  const userId = userProfile.dbUuid || userProfile.user_id || "";

  const [dismissedMemoryIds, setDismissedMemoryIds] = React.useState<string[]>(() => {
    try {
      const stored = sessionStorage.getItem("memory_prompt_dismissed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissPrompt = React.useCallback((memoryId: string) => {
    setDismissedMemoryIds(prev => {
      if (prev.includes(memoryId)) return prev;
      const next = [...prev, memoryId];
      try {
        sessionStorage.setItem("memory_prompt_dismissed", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  // Query pending memory prompts — derived from completed plans + plan_participants
  const completedPlans = plans.filter(p => p.status === "completed" || p.isHappened);
  const pendingPrompts = completedPlans
    .map(plan => {
      const memInfo = derivePlanMemoryInfo(plan, dbPlanParticipants);
      if (dismissedMemoryIds.includes(plan.dbUuid || plan.id)) return null;

      const isHost = plan.hostId === userId;

      const contrib = getMemoryContribution(
        memInfo,
        userId,
        isHost,
        dbPlanOutcomes
      );

      const isPending = hasOutstandingMemoryAction(
        memInfo,
        userId,
        isHost,
        dbPlanOutcomes
      );

      if (!isPending) return null;

      let title = "";
      let body = "";
      let cta = "";

      const mType = (memInfo.memoryType || "").toLowerCase();
      if (mType === "movie") {
        title = "Movie Night is complete";
        body = "How was the movie? Loved it, good, or not for you?";
        cta = "Rate Verdict";
      } else if (mType === "dining") {
        title = "Dinner is complete";
        body = "Would you return to this restaurant?";
        cta = "Record Verdict";
      } else if (mType === "football" || mType === "badminton") {
        const hasResult = dbPlanOutcomes.some(
          o => (o.plan_id === plan.id || o.plan_id === plan.dbUuid) && o.outcome_type === "stats"
        );
        if (!hasResult) {
          title = `${mType.toUpperCase()} session is complete`;
          body = isHost ? "Record the final match score." : "Waiting for host to record score.";
          cta = isHost ? "Record Result" : "View Memory";
        } else {
          title = `${mType.toUpperCase()} session is complete`;
          body = "Vote for today's MVP!";
          cta = "Vote MVP";
        }
      }

      return {
        plan,
        memInfo,
        contrib,
        title,
        body,
        cta,
        planId: plan.dbUuid || plan.id,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const activePrompt = pendingPrompts[0] || null;

  React.useEffect(() => {
    if (!activePrompt) return;
    const planId = activePrompt.planId;
    const timer = setTimeout(() => {
      dismissPrompt(planId);
    }, 600000); // 10 minutes visibility timer
    return () => clearTimeout(timer);
  }, [activePrompt?.planId, dismissPrompt]);

  const handleSelectPlan = (planId: string | null) => {
    if (planId) {
      const found = plans.find(p => p.id === planId || p.dbUuid === planId);
      if (found && found.status === "completed") {
        setSelectedMemoryPlan(planId);
        return;
      }
    }
    setSelectedPlan(planId);
  };

  return (
    <div id="home_tab_pane" className="w-full h-full relative overflow-hidden bg-[#020202] flex flex-col">
      {/* Memory Contribution Prompt Callout */}
      {activePrompt && (
        <div 
          id="memory_contribution_prompt"
          className="mx-6 mb-4 bg-[#121215]/80 backdrop-blur-md border border-[#ff8b66]/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-fade-in text-left shrink-0 relative overflow-hidden group select-none"
        >
          {/* Subtle accent gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff8b66]/5 to-transparent opacity-60 pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#ff8b66]/15 flex items-center justify-center text-[#ff8b66] border border-[#ff8b66]/20 shrink-0 shadow-inner">
              <Star className="w-4.5 h-4.5 fill-current animate-pulse" />
            </div>
            <div className="min-w-0 pr-1">
              <h4 className="text-[10px] font-sans font-black uppercase tracking-wider text-white">
                {activePrompt.title}
              </h4>
              <p className="text-[10.5px] font-sans text-zinc-400 mt-1 leading-snug truncate">
                {activePrompt.body}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10 shrink-0">
            <button
              id="memory_contribution_cta"
              type="button"
              onClick={() => {
                setSelectedMemoryPlan(activePrompt.planId);
                dismissPrompt(activePrompt.planId);
              }}
              className="px-4 py-2 bg-gradient-to-r from-[#ff8b66] to-[#ff7a55] hover:from-[#ff9b7a] hover:to-[#ff8a65] text-black text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 active:scale-[0.96] cursor-pointer shadow-lg hover:shadow-[#ff8b66]/10 shrink-0"
            >
              {activePrompt.cta}
            </button>
            <button
              type="button"
              onClick={() => dismissPrompt(activePrompt.planId)}
              className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        {discoverablePlans.length === 0 ? (
          <EmptyState />
        ) : (
          <PlanStack
            plansToRender={plansToRender}
            handleScrollLoop={handleScrollLoop}
            homeFeedRef={homeFeedRef}
            userProfile={userProfile}
            interestedPlanIds={interestedPlanIds}
            setSelectedPlan={handleSelectPlan}
            setPaymentConfirmationPlan={setPaymentConfirmationPlan}
            walletBalance={walletBalance}
            handleToggleJoin={handleToggleJoin}
            setShowPaymentSuccess={setShowPaymentSuccess}
            setShowWaitlistSuccess={setShowWaitlistSuccess}
            setNotifications={setNotifications}
            activeCardId={activeCardId}
            setActiveCardId={setActiveCardId}
            handleSnoozePlan={handleSnoozePlan}
            handleWaitlistPlan={handleWaitlistPlan}
            onNavigateToPlanChat={onNavigateToPlanChat}
          />
        )}
      </div>
    </div>
  );
});

