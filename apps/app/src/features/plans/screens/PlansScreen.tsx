import React, { useState, useMemo } from "react";
import { ChevronRight, Check, X, CreditCard, Inbox } from "lucide-react";
import { motion } from "motion/react";
import { Plan } from "../../../core/types";
import { normalizeStatus } from "../../../lib/participantStatus";
import { usePlansStore } from "../state/PlansContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { SearchBar } from "../../../components/SearchBar";
import { EmptyState } from "../../home/components/EmptyState";

interface PlansScreenProps {
  setSelectedPlan: (plan: Plan | null) => void;
  passedByPlanId?: Record<string, string[]>;
}

export const PlansScreen = React.memo(({
  setSelectedPlan,
  passedByPlanId = {},
}: PlansScreenProps) => {
  const { plans, dbPlans, dbPlanParticipants, acceptPlan, declinePlan, hostPay, bookNow, getParticipantCounts } = usePlansStore();
  const { userProfile, activeUserId } = useProfileStore();
  const { circles } = useCirclesStore();
  const [pendingAction, setPendingAction] = useState<Record<string, "joining" | "skipping" | "paying">>({});

  const [plansFilter, setPlansFilter] = useState<'going' | 'waitlist' | 'passed' | 'hosted' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const userUuid = userProfile?.dbUuid || "";

  const involvedPlans = useMemo(() => {
    return plans.filter(p => {
      if (p.status === "cancelled") return false;
      return p.members.some(m => m.userUuid && m.userUuid === userUuid);
    });
  }, [plans, userUuid]);

  // Helper filter function for search and status match
  const filterByStatus = (statusFilter: 'all' | 'going' | 'waitlist' | 'passed' | 'hosted') => {
    return involvedPlans.filter((p) => {
      const planCircle = p.circleId ? circles.find((c) => c.id === p.circleId) : null;
      const circleName = planCircle?.name || "";
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circleName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;

      const myParticipant = dbPlanParticipants.find(
        (pp) => pp.plan_id === p.id && pp.user_id === userUuid
      );
      const myStatus = normalizeStatus(myParticipant?.status);
      const isSkipped = myStatus === "skipped";
      const isGoing = myStatus === "going";
      const isWaitlisted = myStatus === "waitlist";
      const isHosted = p.creatorId === userUuid || p.hostId === userUuid || (activeUserId && (p.creatorId === activeUserId || p.hostId === activeUserId));
      const autoPassed = (passedByPlanId[p.id] || []).includes(userProfile?.name || "");

      if (statusFilter === "going") return isGoing && !p.isHappened && !autoPassed && !isSkipped;
      if (statusFilter === "waitlist") return isWaitlisted && !p.isHappened && !isSkipped;
      if (statusFilter === "passed") return isSkipped || autoPassed;
      if (statusFilter === "hosted") return isHosted;

      return false;
    });
  };

  const allPlans = useMemo(() => filterByStatus('all'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const goingPlans = useMemo(() => filterByStatus('going'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const waitlistPlans = useMemo(() => filterByStatus('waitlist'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const passedPlans = useMemo(() => filterByStatus('passed'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const hostedPlans = useMemo(() => filterByStatus('hosted'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);

  // Status badge config per filter
  const getStatusBadge = (key: string) => {
    switch (key) {
      case "going":
        return {
          label: "Going ✓",
          cls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        };
      case "waitlist":
        return {
          label: "Waitlisted",
          cls: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        };
      case "passed":
        return {
          label: "Passed",
          cls: "bg-rose-500/15 border-rose-500/30 text-rose-400",
        };
      case "hosted":
        return {
          label: "Hosted ★",
          cls: "bg-white/12 border-white/25 text-zinc-100",
        };
      default:
        return null;
    }
  };

  const renderPlanRow = (plan: Plan) => {
    const planCircle = plan.circleId ? circles.find((c) => c.id === plan.circleId) : null;
    const circleName = planCircle?.name || null;

    let badge = plansFilter ? getStatusBadge(plansFilter) : null;
    if (!badge) {
      const myPp = dbPlanParticipants.find((pp) => pp.plan_id === plan.id && pp.user_id === activeUserId);
      const myNormalizedStatus = normalizeStatus(myPp?.status);
      const isGoing = myNormalizedStatus === "going";
      const isWait = myNormalizedStatus === "waitlist";
      const isHosted = plan.creatorId === userUuid || plan.hostId === userUuid || (activeUserId && (plan.creatorId === activeUserId || plan.hostId === plan.creatorId));
      const isPassed = (passedByPlanId[plan.id] || []).includes(userProfile?.name || "") || myNormalizedStatus === "skipped";
      if (isPassed) badge = getStatusBadge("passed");
      else if (isHosted) badge = getStatusBadge("hosted");
      else if (isGoing) badge = getStatusBadge("going");
      else if (isWait) badge = getStatusBadge("waitlist");
    }

    const myParticipant = dbPlanParticipants.find(
      (pp) => (pp.plan_id === plan.dbUuid || pp.plan_id === plan.id) && pp.user_id === userProfile?.dbUuid
    );
    const myStatus = myParticipant?.status || "";
    const isDelivered = myStatus === "delivered" || myStatus === "seen";
    const isAccepted = myStatus === "accepted";
    const isHostOfPlan = plan.hostId === userUuid || (activeUserId && plan.hostId === activeUserId);

    const isDeadlinePassed = plan.response_deadline_at
      ? new Date().getTime() > new Date(plan.response_deadline_at).getTime()
      : false;

    const dbPlan = dbPlans.find((dp) => dp.id === plan.dbUuid || dp.plan_id === plan.id);
    const acceptanceStatus = (dbPlan as any)?.acceptance_status || null;
    const isConfirmed = acceptanceStatus === "confirmed";
    const isPaid = acceptanceStatus === "paid";

    const actionKey = plan.id;
    const isBusy = !!pendingAction[actionKey];
    const planStatus = dbPlan?.status;

    return (
      <motion.div
        key={plan.id}
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setSelectedPlan(plan)}
        className="w-full bg-[#0A0A0C] hover:bg-[#121215] border border-white/[0.04] rounded-2xl py-3 px-4 transition-all duration-150 cursor-pointer flex flex-col group active:scale-[0.99] select-none text-left"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Thumbnail circle avatar */}
            <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-white/[0.06] shadow-md flex-shrink-0 relative bg-zinc-955">
              <div className="absolute inset-0 bg-black/40 z-10" />
              <img
                src={plan.coverImage || "/navkis_matchday.png"}
                alt={plan.title}
                className="w-full h-full object-cover relative z-0 scale-100 group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/navkis_matchday.png";
                }}
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Content details side-by-side */}
            <div className="min-w-0 flex-1">
              <h3 className="font-sans font-semibold text-[14px] text-white tracking-wide truncate">
                {plan.title}
              </h3>
              
              <div className="flex items-center gap-1 text-[11px] font-sans text-zinc-500 mt-1 select-none truncate">
                <span>⏰</span>
                <span className="text-zinc-400 font-medium">{plan.time}</span>
                <span className="text-zinc-700 font-semibold mx-1">•</span>
                <span>📍</span>
                <span className="text-zinc-500 font-normal truncate">{plan.location}</span>
                {circleName && (
                  <>
                    <span className="text-zinc-700 font-semibold mx-1">•</span>
                    <span>👥</span>
                    <span className="text-zinc-500 font-normal truncate">{circleName.toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Extreme Right status interaction items */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-3.5">
            {plan.cost > 0 && (
              <span className="text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900 border border-white/[0.04] px-2 py-0.5 rounded-md">
                ₹{plan.cost}
              </span>
            )}
            
            <span className="bg-[#1C1C1E] text-zinc-300 border border-[#2C2C2E] text-[9px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] uppercase">
              {(() => {
                if (isDelivered && !isAccepted) return "Pending Invite";
                if (isAccepted && !isConfirmed && !isPaid) return "Joined ✓";
                if (isConfirmed && !isPaid) return "Confirmed ✓";
                if (isPaid) return "Paid ✓";
                
                const label = badge?.label.replace(" ✓", "") || plan.status;
                if (label === "Going" && dbPlanParticipants.find(pp => pp.plan_id === plan.id && pp.user_id === activeUserId)?.payment_status === "unpaid" && plan.cost > 0) {
                  return `Pay ₹${plan.cost}`;
                }
                return label;
              })()}
              {badge?.label === "Hosted" && <span className="text-[8px] pl-0.5">▼</span>}
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* ── Join / Skip action row (for delivered/pending invitations) ── */}
        {isDelivered && !isAccepted && (
          isDeadlinePassed ? (
            <div className="flex flex-col items-center gap-1.5 px-3.5 pb-3.5 w-full mt-3">
              <div className="flex gap-2 w-full">
                <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-zinc-600 text-[10px] font-black font-mono uppercase tracking-widest opacity-50 cursor-not-allowed">
                  <Check className="w-3.5 h-3.5" /> Join
                </button>
                <button disabled className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60 text-zinc-600 text-[10px] font-black font-mono uppercase tracking-widest opacity-50 cursor-not-allowed">
                  <X className="w-3.5 h-3.5" /> Skip
                </button>
              </div>
              <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest font-extrabold pt-1">
                Responses Closed
              </span>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex gap-2 px-3.5 pb-3.5 animate-fade-in w-full mt-3"
            >
              <button
                id={`join_btn_${plan.id}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isBusy || !userProfile) return;
                  setPendingAction((p) => ({ ...p, [actionKey]: "joining" }));
                  try {
                    await acceptPlan(plan.id, userProfile);
                  } catch (err) {
                    console.error("Failed to join plan:", err);
                    alert("Failed to join plan. Please try again.");
                  } finally {
                    setPendingAction((p) => { const n = { ...p }; delete n[actionKey]; return n; });
                  }
                }}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500/12 border border-emerald-500/25 hover:bg-emerald-500/20 active:scale-[0.97] transition-all text-emerald-400 text-[10px] font-black font-mono uppercase tracking-widest cursor-pointer disabled:opacity-50"
              >
                {pendingAction[actionKey] === "joining" ? (
                  <span className="animate-spin text-xs">⟳</span>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Join
              </button>
              <button
                id={`skip_btn_${plan.id}`}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isBusy || !userProfile) return;
                  setPendingAction((p) => ({ ...p, [actionKey]: "skipping" }));
                  try {
                    await declinePlan(plan.id, userProfile);
                  } catch (err) {
                    console.error("Failed to skip plan:", err);
                    alert("Failed to skip plan. Please try again.");
                  } finally {
                    setPendingAction((p) => { const n = { ...p }; delete n[actionKey]; return n; });
                  }
                }}
                disabled={isBusy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/12 border border-rose-500/25 hover:bg-rose-500/20 active:scale-[0.97] transition-all text-rose-400 text-[10px] font-black font-mono uppercase tracking-widest cursor-pointer disabled:opacity-50"
              >
                {pendingAction[actionKey] === "skipping" ? (
                  <span className="animate-spin text-xs">⟳</span>
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                Skip
              </button>
            </div>
          )
        )}

        {/* ── Host Pay Now CTA ── */}
        {isHostOfPlan && isConfirmed && !isPaid && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="px-3.5 pb-3.5 animate-fade-in w-full mt-3"
          >
            <button
              id={`host_pay_${plan.id}`}
              onClick={async (e) => {
                e.stopPropagation();
                if (isBusy || !userProfile) return;
                setPendingAction((p) => ({ ...p, [actionKey]: "paying" }));
                const ok = await hostPay(plan.id, userProfile);
                setPendingAction((p) => { const n = { ...p }; delete n[actionKey]; return n; });
                if (!ok) alert("Payment failed. Please try again.");
              }}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e3a]/25 to-[#ff8b66]/15 border border-[#ff5e3a]/40 text-[#ff8b66] text-[10px] font-black font-mono uppercase tracking-widest transition-all hover:from-[#ff5e3a]/35 hover:to-[#ff8b66]/25 active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {pendingAction[actionKey] === "paying" ? (
                <span className="animate-spin text-xs">⟳</span>
              ) : (
                <CreditCard className="w-3 h-3" />
              )}
              PAY NOW — Split with all {plan.members.filter(m => m.joinState === "going").length} people
            </button>
          </div>
        )}

        {/* ── Sports Book Now CTA ── */}
        {isHostOfPlan && planStatus === "BOOKING_READY" && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="px-3.5 pb-3.5 animate-fade-in w-full mt-3"
          >
            <button
              id={`book_now_${plan.id}`}
              onClick={async (e) => {
                e.stopPropagation();
                if (isBusy || !userProfile) return;
                setPendingAction((p) => ({ ...p, [actionKey]: "paying" }));
                const result = await bookNow(plan.id, userProfile);
                setPendingAction((p) => { const n = { ...p }; delete n[actionKey]; return n; });
                if (result && result.success) {
                  alert(`✨ Booking confirmed! Total charged: ₹${result.finalTotalCost}`);
                } else {
                  alert(result?.error || "Booking failed.");
                }
              }}
              disabled={isBusy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[10px] font-black font-mono uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-md"
            >
              {pendingAction[actionKey] === "paying" ? (
                <span className="animate-spin text-xs">⟳</span>
              ) : (
                <CreditCard className="w-3 h-3" />
              )}
              BOOK NOW — Split court costs (Total: ₹{(dbPlan as any)?.venue_cost})
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full bg-[#050505] text-left">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-3 pb-24">
        
        {/* Premium Header Block */}
        <div className="mb-4 mt-1 animate-fade-in">
          <h2 className="font-display font-semibold text-[28px] tracking-tight text-white">
            Plans
          </h2>
        </div>

        {/* Search Bar */}
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Search your plans"
          pulseIcon={true}
        />

        {/* Segmented Control */}
        <div className="grid grid-cols-4 bg-[#0A0A0C] border border-[#1A1A1A] rounded-[24px] p-1 mb-6 relative">
          {[
            { id: 'going' as const, label: 'Going', count: goingPlans.length, activeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
            { id: 'waitlist' as const, label: 'Waitlist', count: waitlistPlans.length, activeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
            { id: 'passed' as const, label: 'Passed', count: passedPlans.length, activeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
            { id: 'hosted' as const, label: 'Hosted', count: hostedPlans.length, activeColor: 'text-white border-white/10 bg-white/[0.04]' }
          ].map((tab) => {
            const isActive = plansFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPlansFilter(prev => prev === tab.id ? null : tab.id)}
                className={`relative py-2.5 rounded-[18px] text-[10px] font-sans font-bold tracking-wide transition-all duration-300 focus:outline-none flex flex-col items-center justify-center cursor-pointer ${
                  isActive 
                    ? `${tab.activeColor} border shadow-md` 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span className="truncate">{tab.label} ({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Screen Area */}
        <div className="flex-1">
          {plansFilter === null && (
            allPlans.length === 0 ? (
              <EmptyState 
                icon={<Inbox className="w-8 h-8 text-zinc-600 stroke-[1.5]" />} 
                description="No plans yet" 
                py="py-28" 
              />
            ) : (
              <div className="space-y-3">
                {allPlans.map((plan) => renderPlanRow(plan))}
              </div>
            )
          )}

          {plansFilter === 'going' && (
            goingPlans.length === 0 ? (
              <EmptyState 
                icon="✓" 
                description="No upcoming plans yet" 
                py="py-28" 
              />
            ) : (
              <div className="space-y-3">
                {goingPlans.map((plan) => renderPlanRow(plan))}
              </div>
            )
          )}

          {plansFilter === 'waitlist' && (
            waitlistPlans.length === 0 ? (
              <EmptyState 
                icon="⏳" 
                description="No waitlisted plans currently" 
                py="py-28" 
              />
            ) : (
              <div className="space-y-3">
                {waitlistPlans.map((plan) => renderPlanRow(plan))}
              </div>
            )
          )}

          {plansFilter === 'passed' && (
            passedPlans.length === 0 ? (
              <EmptyState 
                icon="📦" 
                description="No past plans to show" 
                py="py-28" 
              />
            ) : (
              <div className="space-y-3">
                {passedPlans.map((plan) => renderPlanRow(plan))}
              </div>
            )
          )}

          {plansFilter === 'hosted' && (
            hostedPlans.length === 0 ? (
              <EmptyState 
                icon="🎯" 
                description="You haven't hosted a plan yet" 
                py="py-28" 
              />
            ) : (
              <div className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center gap-3 w-full my-4 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] font-bold">TODAY</span>
                  </div>
                  <div className="flex-1 h-[0.5px] bg-[#1C1C1E]"></div>
                  <span className="text-[10px] font-mono text-[#8E8E93]">{hostedPlans.length} {hostedPlans.length === 1 ? 'plan' : 'plans'}</span>
                </div>

                {/* Card layout list */}
                <div className="space-y-3">
                  {hostedPlans.map((plan) => renderPlanRow(plan))}
                </div>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
});
