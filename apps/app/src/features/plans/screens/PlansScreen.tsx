import React, { useState, useMemo } from "react";
import { ChevronRight, Check, X, CreditCard, Inbox } from "lucide-react";
import { motion } from "motion/react";
import { Plan } from "../../../core/types";
import { normalizeStatus } from "../../../lib/participantStatus";
import { formatPlanDate } from "../../../lib/mappers";
import { usePlansStore } from "../state/PlansContext";
import { useProfileStore } from "../../profile/state/ProfileContext";
import { useCirclesStore } from "../../circles/state/CirclesContext";
import { SearchBar } from "../../../shared/components/SearchBar";
import { EmptyState } from "../../home/components/EmptyState";
import { getPlanCover } from "../config/planCoverImages";
import { DiscoveryImages } from "../../../IMGfromDB/PlanImages";

interface PlansScreenProps {
  setSelectedPlanId: (planId: string | null) => void;
  passedByPlanId?: Record<string, string[]>;
  plansFilter?: 'JOINED' | 'WAITLISTED' | 'passed' | 'hosted';
  setPlansFilter?: (filter: 'JOINED' | 'WAITLISTED' | 'passed' | 'hosted') => void;
}

export const PlansScreen = React.memo(({
  setSelectedPlanId,
  passedByPlanId = {},
  plansFilter: propPlansFilter,
  setPlansFilter: propSetPlansFilter,
}: PlansScreenProps) => {
  const { plans, dbPlanParticipants } = usePlansStore();
  const { userProfile, activeUserId } = useProfileStore();
  const { circles } = useCirclesStore();

  const [localPlansFilter, setLocalPlansFilter] = useState<'JOINED' | 'WAITLISTED' | 'passed' | 'hosted'>('JOINED');
  const plansFilter = propPlansFilter !== undefined ? propPlansFilter : localPlansFilter;
  const setPlansFilter = propSetPlansFilter !== undefined ? propSetPlansFilter : setLocalPlansFilter;
  const [searchQuery, setSearchQuery] = useState("");

  const userUuid = userProfile?.dbUuid || "";

  const getPlanDateTime = (plan: Plan): Date => {
    const now = new Date();

    if (plan.datetime && plan.datetime.includes("T") && plan.datetime.includes("-")) {
      const d = new Date(plan.datetime);
      if (!isNaN(d.getTime())) return d;
    }

    const dateStr = (plan.date || "").trim().toUpperCase();
    const timeStr = (plan.time || "").trim().toUpperCase().replace(/⏰/g, "");

    let targetDate = new Date();
    if (dateStr === "TOMORROW") {
      targetDate.setDate(now.getDate() + 1);
    } else if (dateStr !== "TODAY" && dateStr !== "") {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    if (timeStr) {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3];
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        targetDate.setHours(hours, minutes, 0, 0);
        return targetDate;
      }
    }

    if (plan.createdAt) {
      const d = new Date(plan.createdAt);
      if (!isNaN(d.getTime())) return d;
    }

    return targetDate;
  };

  const groupPlansByDate = (plansList: Plan[]) => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const dayAfterTomorrowStart = new Date(todayStart);
    dayAfterTomorrowStart.setDate(todayStart.getDate() + 2);

    const sevenDaysLaterStart = new Date(todayStart);
    sevenDaysLaterStart.setDate(todayStart.getDate() + 8);

    const groups = {
      today: [] as Plan[],
      tomorrow: [] as Plan[],
      thisWeek: [] as Plan[],
      later: [] as Plan[],
      past: [] as Plan[],
    };

    const sortedPlans = [...plansList].sort((a, b) => {
      return getPlanDateTime(a).getTime() - getPlanDateTime(b).getTime();
    });

    for (const plan of sortedPlans) {
      const planDate = getPlanDateTime(plan);
      const planTime = planDate.getTime();

      if (planTime < todayStart.getTime()) {
        groups.past.push(plan);
      } else if (planTime < tomorrowStart.getTime()) {
        groups.today.push(plan);
      } else if (planTime < dayAfterTomorrowStart.getTime()) {
        groups.tomorrow.push(plan);
      } else if (planTime < sevenDaysLaterStart.getTime()) {
        groups.thisWeek.push(plan);
      } else {
        groups.later.push(plan);
      }
    }

    groups.past.sort((a, b) => getPlanDateTime(b).getTime() - getPlanDateTime(a).getTime());

    return groups;
  };

  const getGroupedPlansCount = (plansList: Plan[], showPastOnly: boolean) => {
    const groups = groupPlansByDate(plansList);
    if (showPastOnly) {
      return groups.past.length;
    } else {
      return groups.today.length + groups.tomorrow.length + groups.thisWeek.length + groups.later.length;
    }
  };

  const involvedPlans = useMemo(() => {
    return plans.filter(p => {
      return p.members.some(m => m.userUuid && m.userUuid === userUuid);
    });
  }, [plans, userUuid]);

  // Helper filter function for search and status match
  const filterByStatus = (statusFilter: 'all' | 'JOINED' | 'WAITLISTED' | 'passed' | 'hosted') => {
    return involvedPlans.filter((p) => {
      const planCircle = p.circleId ? circles.find((c) => c.id === p.circleId) : null;
      const circleName = planCircle?.name || "";
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        circleName.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Cancelled plans should only show up under the 'passed' (past/skipped) filter section.
      if (p.status === "CANCELLED") {
        return statusFilter === "passed" || statusFilter === "all";
      }

      const myParticipant = dbPlanParticipants.find(
        (pp) => pp.plan_id === p.id && pp.user_id === userUuid
      );
      const myStatus = normalizeStatus(myParticipant?.rsvp_status);
      const isSkipped = myStatus === "SKIPPED";
      const isJoined = myStatus === "JOINED";
      const isWaitlisted = myStatus === "WAITLISTED";
      const isHosted = p.hostId === userUuid || p.hostId === activeUserId;
      const autoPassed = (passedByPlanId[p.id] || []).includes(userProfile?.name || "");

      if (statusFilter === "all") return isJoined || isWaitlisted || isHosted || isSkipped || autoPassed;
      if (statusFilter === "JOINED") return isJoined;
      if (statusFilter === "WAITLISTED") return isWaitlisted;
      if (statusFilter === "passed") return isSkipped || autoPassed;
      if (statusFilter === "hosted") return isHosted;

      return false;
    });
  };

  const allPlans = useMemo(() => filterByStatus('all'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const joinedPlans = useMemo(() => filterByStatus('JOINED'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const waitlistedPlans = useMemo(() => filterByStatus('WAITLISTED'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const passedPlans = useMemo(() => filterByStatus('passed'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);
  const hostedPlans = useMemo(() => filterByStatus('hosted'), [involvedPlans, circles, searchQuery, dbPlanParticipants, userUuid, userProfile?.name, activeUserId, passedByPlanId]);

  const joinedCount = joinedPlans.length;
  const waitlistedCount = waitlistedPlans.length;
  const passedCount = passedPlans.length;
  const hostedCount = hostedPlans.length;

  // Status badge config per filter
  const getStatusBadge = (key: string) => {
    switch (key) {
      case "JOINED":
        return {
          label: "Joined ✓",
          cls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
        };
      case "WAITLISTED":
        return {
          label: "Waitlisted",
          cls: "bg-amber-500/20 border-amber-500/40 text-amber-300",
        };
      case "passed":
        return {
          label: "Skipped",
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

  const getPlanTimeLabel = (plan: Plan, section: 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'past'): string => {
    return formatPlanDate(plan.datetime || plan.createdAt);
  };
  const getPlanBucketLabel = (p: Plan) => {
    if (p.status === "CANCELLED") return "Cancelled";
    const myParticipant = dbPlanParticipants.find(
      (pp) => pp.plan_id === p.id && pp.user_id === userUuid
    );
    const myStatus = normalizeStatus(myParticipant?.rsvp_status);
    const isSkipped = myStatus === "SKIPPED";
    const isJoined = myStatus === "JOINED";
    const isWaitlisted = myStatus === "WAITLISTED";
    const isHosted = p.hostId === userUuid || p.hostId === activeUserId;
    const autoPassed = (passedByPlanId[p.id] || []).includes(userProfile?.name || "");

    if (isHosted) return "Hosted";
    if (isJoined && !p.isHappened && !autoPassed && !isSkipped) return "Joined";
    if (isWaitlisted && !p.isHappened && !isSkipped) return "Waitlisted";
    if (isSkipped || autoPassed) return "Skipped";
    return "";
  };

  const renderPlanRow = (plan: Plan, section: 'today' | 'tomorrow' | 'thisWeek' | 'later' | 'past') => {
    const timeLabel = getPlanTimeLabel(plan, section);
    const bucketLabel = getPlanBucketLabel(plan);
    const isSearching = searchQuery.trim() !== "";

    return (
      <motion.div
        key={plan.id}
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => setSelectedPlanId(plan.id)}
        className="w-full bg-white/[0.02] hover:bg-white/[0.04] active:bg-white/[0.06] border border-white/5 rounded-2xl py-2.5 px-4 transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-[0.99] select-none text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Thumbnail circle avatar */}
          <div className="w-[44px] h-[44px] rounded-full overflow-hidden border border-white/[0.06] shadow-md flex-shrink-0 relative bg-zinc-955">
            <div className="absolute inset-0 bg-black/40 z-10" />
            <DiscoveryImages
              src={plan.coverImage || getPlanCover(plan.category, (plan as any).subcategory)}
              category={plan.category}
              alt={plan.title}
              className="w-full h-full object-cover relative z-0 scale-100 group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* Content details side-by-side */}
          <div className="min-w-0 flex-1 flex flex-col gap-0.5">
            <h3 className="font-sans font-semibold text-[14px] text-white tracking-wide truncate">
              {plan.title}
            </h3>
            <span className="text-[11px] text-[#8E8E93] font-sans font-medium">
              {isSearching && bucketLabel ? bucketLabel : timeLabel}
            </span>
          </div>
        </div>

        {/* Chevron on the right */}
        <div className="flex items-center flex-shrink-0 ml-3">
          <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </motion.div>
    );
  };

  const renderGroupedPlans = (plansList: Plan[]) => {
    const groups = groupPlansByDate(plansList);

    const sectionsToRender = [
      { id: 'today' as const, label: 'TODAY', plans: groups.today },
      { id: 'tomorrow' as const, label: 'TOMORROW', plans: groups.tomorrow },
      { id: 'thisWeek' as const, label: 'THIS WEEK', plans: groups.thisWeek },
      { id: 'later' as const, label: 'LATER', plans: groups.later },
      { id: 'past' as const, label: 'PAST', plans: groups.past },
    ];

    const activeSections = sectionsToRender.filter(s => s.plans.length > 0);

    if (activeSections.length === 0) {
      return (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-zinc-600 stroke-[1.5]" />}
          description="No plans to show"
          py="py-28"
        />
      );
    }

    return (
      <div className="space-y-6">
        {activeSections.map((sec) => (
          <div key={sec.id} className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center gap-3 w-full mt-5 mb-2 select-none">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-[#8E8E93] font-bold">
                  {sec.label}
                </span>
              </div>
              <div className="flex-1 h-[0.5px] bg-[#1C1C1E]"></div>
              <span className="text-[10px] font-mono text-[#8E8E93]">
                {sec.plans.length} {sec.plans.length === 1 ? 'plan' : 'plans'}
              </span>
            </div>

            {/* Cards List */}
            <div className="space-y-3">
              {sec.plans.map((plan) => renderPlanRow(plan, sec.id))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim() === "") {
      setPlansFilter('JOINED');
    }
  };

  const isSearching = searchQuery.trim() !== "";

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
          onChange={handleSearchChange}
          placeholder="Search your plans"
          pulseIcon={true}
        />

        {/* Segmented Control */}
        <div className="grid grid-cols-4 bg-[#0A0A0C] border border-[#1A1A1A] rounded-[24px] p-1 mb-6 relative">
          {[
            { id: 'JOINED' as const, label: 'Joined', count: joinedCount, activeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
            { id: 'WAITLISTED' as const, label: 'Waitlisted', count: waitlistedCount, activeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
            { id: 'passed' as const, label: 'Skipped', count: passedCount, activeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
            { id: 'hosted' as const, label: 'Hosted', count: hostedCount, activeColor: 'text-white border-white/10 bg-white/[0.04]' }
          ].map((tab) => {
            const isActive = plansFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setPlansFilter(tab.id);
                }}
                className={`relative py-2.5 rounded-[18px] text-[10px] font-sans font-bold tracking-wide transition-all duration-300 focus:outline-none flex flex-col items-center justify-center cursor-pointer ${isActive
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
          {isSearching ? (
            renderGroupedPlans(allPlans)
          ) : (
            <>
              {plansFilter === 'JOINED' && renderGroupedPlans(joinedPlans)}

              {plansFilter === 'WAITLISTED' && renderGroupedPlans(waitlistedPlans)}

              {plansFilter === 'passed' && renderGroupedPlans(passedPlans)}

              {plansFilter === 'hosted' && renderGroupedPlans(hostedPlans)}
            </>
          )}
        </div>

      </div>
    </div>
  );
});
