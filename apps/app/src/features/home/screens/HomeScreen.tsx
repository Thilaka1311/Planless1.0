import React from "react";
import { UserProfile, Plan, NotificationItem } from "../../../core/types";
import { EmptyState } from "../components/EmptyState";
import { FeedHeader } from "../components/FeedHeader";
import { FeedFilters } from "../components/FeedFilters";
import { PlanStack } from "../components/PlanStack";
import { useHomeFeed } from "../hooks/useHomeFeed";
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { getMemoryContribution, hasOutstandingMemoryAction } from "../../../lib/memoryContribution";
import { Star } from "lucide-react";

export interface HomeScreenProps {
  discoverablePlans: Plan[];
  userProfile: UserProfile;
  interestedPlanIds: string[];
  setSelectedPlan: (plan: Plan | null) => void;
  setSelectedMemoryPlan: (plan: Plan | null) => void;
  setPaymentConfirmationPlan: (plan: Plan | null) => void;
  walletBalance: number;
  handleToggleJoin: (plan: Plan) => void;
  setShowPaymentSuccess: (plan: Plan | null) => void;
  setShowWaitlistSuccess?: (plan: Plan | null) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  triggerToast: (msg: string) => void;
  activeCardId: string | null;
  setActiveCardId: (id: string | null) => void;
  handleSnoozePlan: (planId: string) => void;
  handleWaitlistPlan: (planId: string) => void;
  homeFeedRef: React.RefObject<HTMLDivElement | null>;
  selectedPlan?: Plan | null;
  onNavigateToPlanChat?: (plan: Plan) => void;
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
  triggerToast,
  activeCardId,
  setActiveCardId,
  handleSnoozePlan,
  handleWaitlistPlan,
  homeFeedRef,
  selectedPlan,
  onNavigateToPlanChat,
}) => {
  const {
    plans,
    dbMemories,
    dbMemoryAttendees,
    dbMemoryMovieVerdicts,
    dbMemoryRestaurantVotes,
    dbMemoryMatchResults,
    dbMemoryMvpVotes,
    dbMemoryBadmintonResults
  } = usePlansStore();
  const { plansToRender, handleScrollLoop } = useHomeFeed(discoverablePlans);

  const prevSelectedPlanRef = React.useRef<Plan | null>(null);

  React.useEffect(() => {
    // When returning from detailed plan modal (selectedPlan transitions from non-null to null)
    if (prevSelectedPlanRef.current && !selectedPlan && activeCardId) {
      const basePlanId = activeCardId.replace("-loop-prev-dup", "").replace("-loop-next-dup", "");
      setTimeout(() => {
        const element = document.getElementById(`plan-card-${activeCardId}`) || 
                        document.querySelector(`[id$="${basePlanId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }, 50);
    }
    prevSelectedPlanRef.current = selectedPlan || null;
  }, [selectedPlan, activeCardId]);
  
  const userId = userProfile.dbUuid || userProfile.user_id || "";

  // Query pending memory prompts
  const completedPlans = plans.filter(p => p.status === "completed" || p.isHappened);
  const pendingPrompts = completedPlans
    .map(plan => {
      const memory = dbMemories.find(m => m.plan_id === plan.id || m.plan_id === plan.dbUuid);
      if (!memory) return null;

      const attendees = dbMemoryAttendees.filter(a => a.memory_id === memory.id);
      const verdicts = dbMemoryMovieVerdicts.filter(v => v.memory_id === memory.id);
      const votes = dbMemoryRestaurantVotes.filter(v => v.memory_id === memory.id);
      const results = dbMemoryMatchResults.filter(r => r.memory_id === memory.id);
      const mvps = dbMemoryMvpVotes.filter(v => v.memory_id === memory.id);
      const badmintons = dbMemoryBadmintonResults.filter(r => r.memory_id === memory.id);
      const isHost = plan.hostId === userId || plan.creatorId === userId;

      const contrib = getMemoryContribution(
        memory,
        userId,
        isHost,
        attendees,
        verdicts,
        votes,
        results,
        mvps,
        badmintons
      );

      const isPending = hasOutstandingMemoryAction(
        memory,
        userId,
        isHost,
        attendees,
        verdicts,
        votes,
        results,
        mvps,
        badmintons
      );

      if (!isPending) return null;

      let title = "";
      let body = "";
      let cta = "";

      const mType = (memory.memory_type || "").toLowerCase();
      if (mType === "movie") {
        title = "Movie Night is complete";
        body = "How was the movie? Loved it, good, or not for you?";
        cta = "Rate Verdict";
      } else if (mType === "dining") {
        title = "Dinner is complete";
        body = "Would you return to this restaurant?";
        cta = "Record Verdict";
      } else if (mType === "football" || mType === "badminton") {
        const hasResult = results.some(r => r.memory_id === memory.id);
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
        memory,
        contrib,
        title,
        body,
        cta,
        createdAtTime: new Date(memory.created_at).getTime(),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.createdAtTime - b.createdAtTime);

  const activePrompt = pendingPrompts[0] || null;

  const handleSelectPlan = (plan: Plan | null) => {
    if (plan && plan.status === "completed") {
      setSelectedMemoryPlan(plan);
      return;
    }
    setSelectedPlan(plan);
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
            <div className="min-w-0">
              <h4 className="text-[10px] font-sans font-black uppercase tracking-wider text-white">
                {activePrompt.title}
              </h4>
              <p className="text-[10.5px] font-sans text-zinc-400 mt-1 leading-snug truncate">
                {activePrompt.body}
              </p>
            </div>
          </div>
          <button
            id="memory_contribution_cta"
            type="button"
            onClick={() => setSelectedMemoryPlan(activePrompt.plan)}
            className="px-4 py-2 bg-gradient-to-r from-[#ff8b66] to-[#ff7a55] hover:from-[#ff9b7a] hover:to-[#ff8a65] text-black text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 active:scale-[0.96] cursor-pointer shadow-lg hover:shadow-[#ff8b66]/10 shrink-0 relative z-10"
          >
            {activePrompt.cta}
          </button>
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
            triggerToast={triggerToast}
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

