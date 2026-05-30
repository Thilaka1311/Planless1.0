import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Send, CheckCircle, Smartphone, Share2, Film, Trophy, Utensils, Sparkles, ChevronRight, Check } from "lucide-react";
import { UserProfile, Plan, Transaction, NotificationItem } from "../../../core/types";
import { SportsIcon, MoviesIcon, FoodIcon } from "../../../shared/components/Icons";
import { getInitialsAvatar } from "../../../demo/seedData";

interface PlanReelCardProps {
  key?: any;
  plan: Plan;
  userProfile: UserProfile;
  interestedPlanIds: string[];
  setSelectedPlan: (plan: Plan | null) => void;
  setPaymentConfirmationPlan: (plan: Plan | null) => void;
  walletBalance: number;
  handleToggleJoin: (plan: Plan) => void;
  setShowPaymentSuccess: (plan: Plan | null) => void;
  setShowWaitlistSuccess?: (plan: Plan | null) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  triggerToast: (msg: string) => void;
  activeCardId: string | null;
  onSelectCard: (planId: string) => void;
  handleSnoozePlan: (planId: string) => void;
  waitlistPlan?: (planId: string, userProfile: any) => void;
}

const PlanReelCard = ({
  plan,
  userProfile,
  interestedPlanIds,
  setSelectedPlan,
  setPaymentConfirmationPlan,
  walletBalance,
  handleToggleJoin,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  setNotifications,
  triggerToast,
  activeCardId,
  onSelectCard,
  handleSnoozePlan,
  waitlistPlan
}: PlanReelCardProps) => {
  const HOLD_DURATION = 1400; // ms
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMode, setSuccessMode] = useState<"join" | "waitlist">("join");
  const [isExpanded, setIsExpanded] = useState(false);

  // Touch / Pointer gesture variables for vertical drag-down (Snooze = Revisit later)
  const startYRef = useRef<number>(0);
  const [dragY, setDragY] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // Dynamic layout metrics that auto-scale font-size and spacing based on title length
  const getDynamicTitleStyle = (text: string) => {
    const len = text.length;
    let fontSize = "clamp(2rem, 9.5vw, 3rem)";
    let letterSpacing = "-0.02em";
    let lineHeight = "0.95";

    if (len <= 6) {
      fontSize = "clamp(2.25rem, 10vw, 3rem)";
      letterSpacing = "-0.03em";
      lineHeight = "0.95";
    } else if (len <= 10) {
      fontSize = "clamp(1.95rem, 8.5vw, 2.6rem)";
      letterSpacing = "-0.025em";
      lineHeight = "0.95";
    } else if (len <= 14) {
      fontSize = "clamp(1.65rem, 7.5vw, 2.2rem)";
      letterSpacing = "-0.02em";
      lineHeight = "0.95";
    } else if (len <= 18) {
      fontSize = "clamp(1.45rem, 6.5vw, 1.9rem)";
      letterSpacing = "-0.015em";
      lineHeight = "1.0";
    } else {
      fontSize = "clamp(1.25rem, 5.5vw, 1.6rem)";
      letterSpacing = "-0.01em";
      lineHeight = "1.05";
    }

    return {
      fontSize,
      letterSpacing,
      lineHeight,
    };
  };

  const holdStartTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isHoldTriggeredRef = useRef<boolean>(false);

  // References to support clean separation of tap vs. hold-to-join with a delay threshold
  const holdDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const hasHoldStartedRef = useRef<boolean>(false);

  const isJoined = plan.joinedUsers.some(u => {
    if (u.joinState !== "going" && u.joinState !== undefined && u.joinState !== null) return false;
    const cleanU = u.name.toLowerCase().replace(/[^a-z]/g, "");
    const cleanProfile = userProfile.name.toLowerCase().replace(/[^a-z]/g, "");
    return cleanU.includes(cleanProfile) || cleanProfile.includes(cleanU);
  });

  const isWaitlisted = plan.joinedUsers.some(u => {
    if (u.joinState !== "waitlist") return false;
    const cleanU = u.name.toLowerCase().replace(/[^a-z]/g, "");
    const cleanProfile = userProfile.name.toLowerCase().replace(/[^a-z]/g, "");
    return cleanU.includes(cleanProfile) || cleanProfile.includes(cleanU);
  });

  // Consistently format date and times in "SAT, 25 MAY • 8:00" style
  const getFormattedDateAndTime = () => {
    const rawDate = (plan.date || "TODAY").trim().toUpperCase();
    const rawTime = (plan.time || "8:30 PM").trim().toUpperCase();

    // Remove any redundant characters/prefixes
    let cleanTime = rawTime.replace(/⏰/g, "").replace(/TODAY\s*•\s*/g, "").trim();

    if (rawDate === "TODAY") {
      return `TUE, 26 MAY • ${cleanTime}`;
    }
    if (rawDate === "TOMORROW") {
      return `WED, 27 MAY • ${cleanTime}`;
    }
    if (rawDate === "FRI" || rawDate === "FRIDAY") {
      return `FRI, 29 MAY • ${cleanTime}`;
    }
    if (rawDate === "SAT" || rawDate === "SATURDAY") {
      return `SAT, 30 MAY • ${cleanTime}`;
    }
    if (rawDate === "SUN" || rawDate === "SUNDAY") {
      return `SUN, 31 MAY • ${cleanTime}`;
    }
    if (rawDate === "THU" || rawDate === "THURSDAY") {
      return `THU, 28 MAY • ${cleanTime}`;
    }

    // Handle existing formats such as "Sat, 25 May" -> uppercase and keep it
    if (rawDate.includes(",")) {
      return `${rawDate} • ${cleanTime}`;
    }

    return `${rawDate} • ${cleanTime}`;
  };

  // Dynamic presence list groups for live momentum synchronization
  // Refined participant state system for cinematic social alignment
  const getParticipantStatusList = () => {
    const host = {
      userId: plan.creatorId,
      name: plan.creatorName || "Raghavan",
      avatar: plan.creatorAvatar || getInitialsAvatar(plan.creatorName || "Raghavan"),
      status: "Going",
      isHost: true
    };

    const allGoing = [
      host,
      ...plan.joinedUsers
        .filter(u => u.userId !== host.userId)
        .map(u => ({
          userId: u.userId,
          name: u.name,
          avatar: u.avatar || getInitialsAvatar(u.name),
          status: "Going",
          isHost: false
        }))
    ];

    if (allGoing.length === 1) {
      allGoing.push(
        { userId: "U003", name: "Medhaj", avatar: getInitialsAvatar("Medhaj"), status: "Going", isHost: false },
        { userId: "U005", name: "Rahul", avatar: getInitialsAvatar("Rahul"), status: "Going", isHost: false }
      );
    }

    const going = allGoing.slice(0, maxSpots);
    const overflowToWaitlist = allGoing.slice(maxSpots).map(u => ({
      name: u.name,
      avatar: u.avatar,
      status: "Waitlist"
    }));

    const waitlist = [
      ...overflowToWaitlist,
      ...(plan.waitlistUsers || []),
      ...(plan.interestedUsers || [])
    ].map(u => ({
      name: u.name,
      avatar: u.avatar || getInitialsAvatar(u.name),
      status: "Waitlist"
    }));

    if (waitlist.length === 0 && (plan.category === "sports" || plan.title.toLowerCase().includes("football"))) {
      if (going.length >= maxSpots) {
        waitlist.push({
          name: "Raghavan",
          avatar: getInitialsAvatar("Raghavan"),
          status: "Waitlist"
        });
      }
    }

    const deliveredNames = ["Sudeshna", "Ravi"].filter(
      n => n !== host.name && !going.some(g => g.name === n) && !waitlist.some(w => w.name === n)
    );
    const delivered = deliveredNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Delivered"
    }));

    const seenNames = ["Guhan", "Neelesh"].filter(
      n => n !== host.name && !going.some(g => g.name === n) && !waitlist.some(w => w.name === n)
    );
    const seen = seenNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Seen"
    }));

    const skippedNames = ["Pratyush", "Renjith"].filter(
      n => n !== host.name &&
        !going.some(g => g.name === n) &&
        !waitlist.some(w => w.name === n) &&
        !deliveredNames.includes(n) &&
        !seenNames.includes(n)
    );
    const skipped = skippedNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Skipped"
    }));

    return { going, waitlist, delivered, seen, skipped };
  };

  // Map titles to direct bold display activity names exactly matching Figma layout
  let displayActivityName = plan.title;
  if (plan.title.toLowerCase().includes("football") || plan.title.toLowerCase().includes("turf") || plan.title.toLowerCase().includes("matchday")) {
    displayActivityName = "Football Tonight";
  } else if (plan.title.toLowerCase().includes("drive") || plan.title.toLowerCase().includes("sunset")) {
    displayActivityName = "Sunset Drive";
  } else if (plan.title.toLowerCase().includes("waffles") || plan.title.toLowerCase().includes("cafe")) {
    displayActivityName = "Waffle Time";
  } else if (plan.title.toLowerCase().includes("movie") || plan.title.toLowerCase().includes("screening")) {
    displayActivityName = "Luxe IMAX";
  } else {
    displayActivityName = plan.title.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  }

  // Cast category to string to avoid compile time union mismatch on custom string properties
  const categoryStr = plan.category as string;

  // Establish Figma category tags (e.g., MATCHDAY, BREEZE, RESTAURANT)
  let categoryTag = "COFFEE NIGHT";
  if (categoryStr === "sports" || plan.id === "P001") {
    categoryTag = "MATCHDAY";
  } else if (categoryStr === "sunset") {
    categoryTag = "SPONTY RUN";
  } else if (categoryStr === "movies") {
    categoryTag = "BLOCKBUSTER";
  } else if (categoryStr === "brunch" || categoryStr === "restaurants") {
    categoryTag = "CAFE VENTURES";
  }

  // Glowing activity icon setup & soft-glow aesthetic matching requested categories
  let iconToRender = <SportsIcon />;
  let glowStyle = "from-emerald-500/15 to-emerald-600/5 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
  if (categoryStr === "sunset" || categoryStr === "brunch" || categoryStr === "restaurants" || categoryStr === "cafe") {
    iconToRender = <FoodIcon />;
    glowStyle = "from-rose-500/15 to-pink-500/5 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]";
  } else if (categoryStr === "movies") {
    iconToRender = <MoviesIcon />;
    glowStyle = "from-sky-500/15 to-blue-600/5 text-sky-300 border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.25)]";
  } else if (categoryStr === "sports") {
    iconToRender = <SportsIcon />;
    glowStyle = "from-emerald-500/15 to-emerald-600/5 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
  }

  // Setup specific sunset football buddies pictures if P001/Football to align with prompt image
  const coverToUse = (plan.id === "P001" || plan.category === "sports" || plan.title.toLowerCase().includes("football") || plan.title.toLowerCase().includes("turf"))
    ? "/navkis_matchday.png"
    : plan.coverImage;

  const maxSpots = plan.maxSpots || (plan.category === "movies" ? 10 : plan.category === "sports" ? 14 : 8);
  const currentCount = plan.joinedUsers ? plan.joinedUsers.filter(u => u.joinState !== "waitlist").length : (plan.confirmedCount || 0);
  const isFull = currentCount >= maxSpots;

  let barGradient = "from-[#ff8b66] to-[#fc5c42]";
  let glowShadowColor = "rgba(255,139,102,0.35)";
  let categoryColorDot = "bg-[#ff8b66]";

  if (categoryStr === "sunset" || categoryStr === "brunch" || categoryStr === "restaurants" || categoryStr === "cafe") {
    barGradient = "from-rose-400 to-pink-500";
    glowShadowColor = "rgba(244,63,94,0.35)";
    categoryColorDot = "bg-rose-400";
  } else if (categoryStr === "movies") {
    barGradient = "from-sky-400 to-blue-500";
    glowShadowColor = "rgba(14,165,233,0.35)";
    categoryColorDot = "bg-sky-450";
  }

  let groupName = "Midnight Masala";
  let groupColor = "text-[#ff8b66]";

  if (categoryStr === "sports" || plan.title.toLowerCase().includes("football") || plan.title.toLowerCase().includes("turf")) {
    groupName = "Navkis Matchday";
    groupColor = "text-emerald-400";
  } else if (categoryStr === "movies" || plan.title.toLowerCase().includes("movie")) {
    groupName = "Jobis";
    groupColor = "text-sky-400";
  } else if (categoryStr === "sunset" || categoryStr === "brunch" || categoryStr === "restaurants" || categoryStr === "cafe" || plan.title.toLowerCase().includes("waffles") || plan.title.toLowerCase().includes("spice")) {
    groupName = "Midnight Masala";
    groupColor = "text-rose-400";
  }

  const startHolding = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    // Clear any previous hold delay timeouts
    if (holdDelayTimeoutRef.current) {
      clearTimeout(holdDelayTimeoutRef.current);
      holdDelayTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) { }

    pointerDownTimeRef.current = performance.now();
    hasHoldStartedRef.current = false;
    isHoldTriggeredRef.current = false;
    startYRef.current = e.clientY;
    isDraggingRef.current = false;
    setDragY(0);

    // Setup hold delay threshold of 400ms before starting deliberate join scale/animation
    holdDelayTimeoutRef.current = setTimeout(() => {
      hasHoldStartedRef.current = true;
      setIsHolding(true);
      setHoldProgress(0);
      progressRef.current = 0;

      const startTime = performance.now();
      holdStartTimeRef.current = startTime;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / HOLD_DURATION, 1);
        setHoldProgress(progress * 100);
        progressRef.current = progress;

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick);
        } else {
          setIsHolding(false);
          isHoldTriggeredRef.current = true;

          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }

          if (isJoined) {
            if (typeof triggerToast === "function") {
              triggerToast("You're already in this plan! Head over to Circles tab to chat.");
            }
          } else if (isWaitlisted) {
            if (typeof triggerToast === "function") {
              triggerToast("You're already on the waitlist for this plan!");
            }
          } else if (isFull) {
            if (waitlistPlan) {
              waitlistPlan(plan.id, userProfile);
              if (typeof triggerToast === "function") {
                triggerToast("Added to Waitlist");
              }
              const waitlistNotification = {
                id: `n_waitlist_${Date.now()}`,
                type: "general" as const,
                title: `⏳ Added to waitlist for "${plan.title}"`,
                relativeTime: "Just Now",
                settled: true,
                planIdForAction: plan.id
              };
              setNotifications(prev => [waitlistNotification, ...prev]);
              if (setShowWaitlistSuccess) {
                setShowWaitlistSuccess(plan);
              }
            }
          } else {
            setSuccessMode("join");
            handleToggleJoin(plan);

            const newNotification = {
              id: `n_pay_${Date.now()}`,
              type: "payments" as const,
              title: "Split Coordinated Payment Cleared",
              message: `Transferred ₹${plan.cost} split fee for ${plan.title} turf.`,
              relativeTime: "Just Now",
              settled: true,
              planIdForAction: plan.id
            };

            const joinedNotification = {
              id: `n_join_group_${Date.now()}`,
              type: "general" as const,
              title: `👋 You joined ${plan.creatorName || "host"}'s plan "${plan.title}"`,
              relativeTime: "Just Now",
              settled: true,
              planIdForAction: plan.id
            };

            setNotifications(prev => [newNotification, joinedNotification, ...prev]);
            setShowPaymentSuccess(plan);
          }

          setTimeout(() => {
            setHoldProgress(0);
            progressRef.current = 0;
          }, 400);
        }
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    }, 400);
  };

  const stopHolding = (e: React.PointerEvent) => {
    if (holdDelayTimeoutRef.current) {
      clearTimeout(holdDelayTimeoutRef.current);
      holdDelayTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) { }

    const currentDragY = dragY;
    startYRef.current = 0;
    setDragY(0);

    if (isDraggingRef.current) {
      if (currentDragY > 120) {
        handleSnoozePlan(plan.id);
      }
      return;
    }

    // If released before hold threshold activated, treat as standard quick tap
    if (!hasHoldStartedRef.current) {
      setIsHolding(false);
      setHoldProgress(0);
      progressRef.current = 0;
      if (typeof onSelectCard === "function") {
        onSelectCard(activeCardId === plan.id ? null : plan.id);
      }
      return;
    }

    setIsHolding(false);

    if (progressRef.current < 1) {
      const startProgress = progressRef.current;
      const startReleaseTime = performance.now();
      const DECREASE_DURATION = 350; // ms

      const releaseTick = (now: number) => {
        const elapsedRelease = now - startReleaseTime;
        const relProgress = Math.min(elapsedRelease / DECREASE_DURATION, 1);
        const newProgress = startProgress * (1 - relProgress);
        setHoldProgress(newProgress * 100);
        progressRef.current = newProgress;

        if (relProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(releaseTick);
        } else {
          setHoldProgress(0);
          progressRef.current = 0;
        }
      };

      animationFrameRef.current = requestAnimationFrame(releaseTick);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current === 0) return;
    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 10) {
      isDraggingRef.current = true;
      if (holdDelayTimeoutRef.current) {
        clearTimeout(holdDelayTimeoutRef.current);
        holdDelayTimeoutRef.current = null;
      }
      if (isHolding) {
        setIsHolding(false);
      }
    }
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  // Dedicate cancelHolding for PointerLeave so moving off card cancels the join cleanly without triggering a tap
  const cancelHolding = (e: React.PointerEvent) => {
    if (holdDelayTimeoutRef.current) {
      clearTimeout(holdDelayTimeoutRef.current);
      holdDelayTimeoutRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) { }

    const currentDragY = dragY;
    startYRef.current = 0;
    setDragY(0);

    if (isDraggingRef.current) {
      if (currentDragY > 120) {
        handleSnoozePlan(plan.id);
      }
      return;
    }

    setIsHolding(false);

    if (hasHoldStartedRef.current && progressRef.current < 1) {
      const startProgress = progressRef.current;
      const startReleaseTime = performance.now();
      const DECREASE_DURATION = 350; // ms

      const releaseTick = (now: number) => {
        const elapsedRelease = now - startReleaseTime;
        const relProgress = Math.min(elapsedRelease / DECREASE_DURATION, 1);
        const newProgress = startProgress * (1 - relProgress);
        setHoldProgress(newProgress * 100);
        progressRef.current = newProgress;

        if (relProgress < 1) {
          animationFrameRef.current = requestAnimationFrame(releaseTick);
        } else {
          setHoldProgress(0);
          progressRef.current = 0;
        }
      };

      animationFrameRef.current = requestAnimationFrame(releaseTick);
    } else {
      setHoldProgress(0);
      progressRef.current = 0;
    }
  };

  // Progressive layout reveal calculations based on holdProgress
  const costOpacity = Math.max(0, Math.min(1, (holdProgress - 15) / 25));
  const costY = 16 * (1 - costOpacity);

  const timeOpacity = Math.max(0, Math.min(1, (holdProgress - 40) / 25));
  const timeY = 16 * (1 - timeOpacity);

  const locOpacity = Math.max(0, Math.min(1, (holdProgress - 65) / 25));
  const locY = 16 * (1 - locOpacity);

  return (
    <div
      className="w-full h-full snap-start shrink-0 relative flex flex-col justify-end p-6 select-none overflow-hidden cursor-pointer touch-none"
      style={{
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        height: '100%',
        boxShadow: isHolding
          ? `0 0 ${15 + (holdProgress / 100) * 35}px rgba(255, 139, 102, ${0.15 + (holdProgress / 100) * 0.45})`
          : 'none',
        transform: isHolding ? `scale(${1 - (holdProgress / 100) * 0.035})` : 'scale(1)',
        transition: isHolding ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease'
      }}
      onPointerDown={startHolding}
      onPointerMove={handlePointerMove}
      onPointerUp={stopHolding}
      onPointerLeave={cancelHolding}
    >
      {/* FULL-SCREEN BACKGROUND IMAGE */}
      <img
        src={coverToUse}
        alt={plan.title}
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        referrerPolicy="no-referrer"
      />

      {/* Overlay: soft dark gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* Top: category chip & status */}
      <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-10 pointer-events-none">
        <span className={`bg-[#0c0c0e]/90 backdrop-blur-md text-[10px] font-sans uppercase tracking-[0.14em] font-extrabold px-4 py-2 rounded-full border border-white/10 shadow-lg ${groupColor}`}>
          {groupName.toUpperCase()}
        </span>

        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${glowStyle} border flex items-center justify-center shadow-lg`}>
          {iconToRender}
        </div>
      </div>

      {/* Center/Lower Area & Bottom overlay */}
      <div className="z-10 space-y-4 w-full pointer-events-none">
        <div className="space-y-2">
          <h2
            style={getDynamicTitleStyle(displayActivityName)}
            className="font-sans font-extrabold text-white drop-shadow-md max-w-full pr-1 tracking-tight leading-tight"
          >
            {displayActivityName}
          </h2>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-stone-100 drop-shadow-sm font-semibold text-[11px] uppercase tracking-wider font-mono">
              <span className="text-amber-400">📅</span>
              <span>{getFormattedDateAndTime()}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-200 drop-shadow-sm font-sans text-[11px] tracking-wide">
              <span className="text-brand-peach">📍</span>
              <span className="truncate max-w-[85%]">{plan.location}</span>
            </div>

            {/* Split billing details naturally integrated with subtle premium green accent */}
            <div className="flex items-center gap-2 text-emerald-400 drop-shadow-md font-sans text-xs font-black uppercase tracking-wider pt-0.5">
              <span className="text-xs">💵</span>
              <span>{plan.cost > 0 ? `₹${plan.cost}` : "🍿 FREE"}</span>
            </div>
          </div>
        </div>
        {/* White line divider conforming to Figma spec */}
        <div className="border-t border-white/10 w-full" />

        {/* Momentum Progress Bar Section with Premium Smooth Coral Glow & Expandable Participant Sync */}
        <div
          className="space-y-3 w-full text-left pointer-events-auto cursor-pointer group/momentum bg-white/[0.015] hover:bg-white/[0.045] active:bg-white/[0.065] px-4 py-3.5 rounded-2xl border border-white/[0.035] hover:border-white/[0.065] transition-all duration-300 shadow-md"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <div className="flex justify-between items-center text-[10.5px] font-sans font-medium select-none">
            <span className="flex items-center gap-1.5 tracking-wide">
              <span className={`w-1.5 h-1.5 rounded-full ${isFull ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]" : "bg-[#ff6b4a] shadow-[0_0_8px_rgba(255,107,74,0.85)]"} animate-pulse`} />
              <span className="text-zinc-300 group-hover/momentum:text-white transition-colors flex items-center gap-1">
                Host: {plan.creatorName || "Raghavan"}
                <span className="w-2.5 h-2.5 flex items-center justify-center shrink-0">
                  {isExpanded ? (
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] text-zinc-400" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-[10px] h-[10px] text-zinc-400" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </span>
              </span>
            </span>
            {(() => {
              const isHost = plan.hostId === "u_self" || plan.creatorId === "u_self" || plan.creatorName === userProfile.name;
              return isHost ? (
                <span className="text-zinc-400 select-none">
                  Joined: <strong className="text-white font-extrabold">{currentCount}</strong> | Waitlist: <strong className="text-amber-400 font-extrabold">{plan.waitlistUsers ? plan.waitlistUsers.length : 0}</strong>
                </span>
              ) : isFull ? (
                <span className="text-amber-400 font-extrabold tracking-wide uppercase text-[10px] select-none">
                  Waitlist Open
                </span>
              ) : (
                <span className="text-zinc-400 select-none">
                  <strong className="text-white font-extrabold">{currentCount} / {maxSpots}</strong> joined
                </span>
              );
            })()}
          </div>

          <div className="h-[3px] w-full bg-black/80 rounded-full overflow-hidden relative border border-white/[0.02]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#ff593c] via-[#ff7c55] to-[#fdb933] transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, (currentCount / maxSpots) * 100)}%`,
                boxShadow: "0 0 6px rgba(255, 91, 63, 0.25)"
              }}
            />
          </div>

          {/* Expandable Live Participant Sync Drawer */}
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 10 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-white/[0.05] pt-2"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
              >
                <div className="space-y-2 max-h-[160px] overflow-y-auto no-scrollbar pt-1 pr-0.5 mt-0.5 pointer-events-auto">
                  {(() => {
                    const { going, waitlist, delivered, seen, skipped } = getParticipantStatusList();
                    return (
                      <div className="space-y-1.5 pt-0.5">
                        {/* Going State */}
                        {going.map((user, idx) => (
                          <div key={`going-${idx}`} className="flex items-center justify-between py-1 border-b border-white/[0.01]">
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-emerald-500/25 shrink-0" referrerPolicy="no-referrer" />
                              <span className="text-[10.5px] font-bold text-zinc-100">
                                {user.name}
                                {user.isHost && <span className="text-[9px] text-zinc-500 font-normal ml-1">(Host)</span>}
                              </span>
                            </div>
                            <span className="text-[7.5px] font-mono text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{user.status}</span>
                          </div>
                        ))}

                        {/* Waitlist State */}
                        {waitlist.map((user, idx) => (
                          <div key={`waitlist-${idx}`} className="flex items-center justify-between py-1 border-b border-white/[0.01]">
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-5.5 h-5.5 rounded-full object-cover ring-1 ring-amber-500/25 shrink-0" referrerPolicy="no-referrer" />
                              <span className="text-[10.5px] font-bold text-zinc-100">{user.name}</span>
                            </div>
                            <span className="text-[7.5px] font-mono text-amber-400 font-bold uppercase tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{user.status}</span>
                          </div>
                        ))}

                        {/* Delivered State */}
                        {delivered.map((user, idx) => (
                          <div key={`delivered-${idx}`} className="flex items-center justify-between py-1 border-b border-white/[0.01] opacity-75">
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-5 h-5 rounded-full object-cover ring-1 ring-zinc-500/20 shrink-0" referrerPolicy="no-referrer" />
                              <span className="text-[10px] text-zinc-400">{user.name}</span>
                            </div>
                            <span className="text-[7.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider bg-zinc-800/40 px-1.5 py-0.5 rounded border border-zinc-700/30">{user.status}</span>
                          </div>
                        ))}

                        {/* Seen State */}
                        {seen.map((user, idx) => (
                          <div key={`seen-${idx}`} className="flex items-center justify-between py-1 border-b border-white/[0.01]">
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10 shrink-0" referrerPolicy="no-referrer" />
                              <span className="text-[10px] text-zinc-200 font-medium">{user.name}</span>
                            </div>
                            <span className="text-[7.5px] font-mono text-zinc-100 font-extrabold uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded border border-white/15">{user.status}</span>
                          </div>
                        ))}

                        {/* Skipped State */}
                        {skipped.map((user, idx) => (
                          <div key={`skipped-${idx}`} className="flex items-center justify-between py-1 opacity-60">
                            <div className="flex items-center gap-2">
                              <img src={user.avatar} className="w-5 h-5 rounded-full object-cover ring-1 ring-rose-500/20 shrink-0" referrerPolicy="no-referrer" />
                              <span className="text-[10px] text-zinc-350">{user.name}</span>
                            </div>
                            <span className="text-[7.5px] font-mono text-rose-400 font-bold uppercase tracking-wider bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">{user.status}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>

      {/* HOLD-TO-JOIN TACTILE FEEDBACK OVERLAYS */}
      <AnimatePresence>
        {isHolding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col justify-between p-8 pointer-events-none"
            style={{
              backgroundColor: `rgba(4, 4, 6, ${0.4 + (holdProgress / 100) * 0.45})`,
              backdropFilter: `blur(${(holdProgress / 100) * 8}px)`,
              WebkitBackdropFilter: `blur(${(holdProgress / 100) * 8}px)`,
            }}
          >
            {/* Elegant Minimal Spacing */}
            <div className="h-6" />

            {/* Immersive Progressive Content (Center) */}
            <div className="flex-1 flex flex-col justify-center space-y-7 my-auto pt-6">
              {/* Cost Row */}
              <div
                style={{
                  opacity: costOpacity,
                  transform: `translateY(${costY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                }}
                className="space-y-1"
              >
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">Split Requirement</span>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                  <span>{plan.cost > 0 ? `₹${plan.cost}` : "Free Entry"}</span>
                  <span className="text-zinc-500 text-xs font-normal lowercase">per person split</span>
                </div>
              </div>

              {/* Time Row */}
              <div
                style={{
                  opacity: timeOpacity,
                  transform: `translateY(${timeY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                }}
                className="space-y-1"
              >
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-medium">Scheduled Hour</span>
                <div className="text-xl font-bold text-white uppercase tracking-tight">
                  {getFormattedDateAndTime()}
                </div>
              </div>

              {/* Location Row */}
              <div
                style={{
                  opacity: locOpacity,
                  transform: `translateY(${locY}px)`,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                }}
                className="space-y-1"
              >
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block font-medium">Coordinated Venue</span>
                <div className="text-base font-medium text-zinc-200 leading-snug tracking-wide">
                  {plan.location}
                </div>
              </div>
            </div>

            {/* Bottom circular progress and status */}
            <div className="flex flex-col items-center justify-center space-y-4 w-full pb-2">
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Outer glowing progress path */}
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    className="stroke-zinc-900"
                    strokeWidth="3.5"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    className={isFull ? "stroke-amber-400" : "stroke-[#ff8b66]"}
                    strokeWidth="3.5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - holdProgress / 100)}
                    strokeLinecap="round"
                    style={{
                      filter: isFull ? 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.4))' : 'drop-shadow(0 0 6px rgba(255, 139, 102, 0.4))'
                    }}
                  />
                </svg>
                <span className="absolute text-[11px] font-mono text-white font-black">{Math.round(holdProgress)}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="absolute inset-0 bg-[#0e0e11]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center pointer-events-none"
          >
            {successMode === "waitlist" ? (
              <>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.25)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <span className="text-base font-sans font-black tracking-[0.2em] text-amber-400 mt-6 uppercase">WAITLISTED</span>
                <span className="text-xs font-sans text-zinc-400 mt-2">Added to Waitlist</span>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <span className="text-base font-sans font-black tracking-[0.2em] text-emerald-400 mt-6 uppercase">JOINED</span>
                <span className="text-xs font-sans text-zinc-400 mt-2">Opening wallet split payment popup...</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Premium, interactive participation progress bar with WhatsApp-style seen & delivered social states
export const CinematicProgressBar = ({
  plan,
  isPopupOpen,
  onTogglePopup,
  titleText = "MOMENTUM",
  colorTheme = "orange",
  userProfile,
  planMessages,
  setPlanMessages,
}: {
  plan: Plan;
  isPopupOpen: boolean;
  onTogglePopup: () => void;
  titleText?: string;
  colorTheme?: "orange" | "green";
  userProfile?: UserProfile;
  planMessages?: Record<string, { sender: string, avatar: string, text: string, time: string }[]>;
  setPlanMessages?: React.Dispatch<React.SetStateAction<Record<string, { sender: string, avatar: string, text: string, time: string }[]>>>;
}) => {
  const [localMsg, setLocalMsg] = useState("");
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const maxSpots = plan.maxSpots || (plan.category === "movies" ? 10 : plan.category === "sports" ? 14 : 8);
  const currentCount = plan.confirmedCount || plan.joinedUsers.length;
  const ratio = Math.min(currentCount / maxSpots, 1.0);

  const getMicrocopy = () => {
    if (ratio >= 1.0) return "Squad fully locked • Let's go!";
    if (ratio >= 0.75) return "Almost confirmed • Firing on all cylinders";
    if (ratio >= 0.4) return "Gathering momentum • Ready to launch!";
    return "Building the squad • Waiting for more players";
  };

  const getParticipantStates = () => {
    const host = {
      userId: plan.creatorId,
      name: plan.creatorName || "Raghavan",
      avatar: plan.creatorAvatar || getInitialsAvatar(plan.creatorName || "Raghavan"),
      status: "Going",
      isHost: true
    };

    const going = [
      host,
      ...plan.joinedUsers
        .filter(u => u.userId !== host.userId)
        .map(u => ({
          userId: u.userId,
          name: u.name,
          avatar: u.avatar || getInitialsAvatar(u.name),
          status: "Going",
          isHost: false
        }))
    ];

    if (going.length === 1) {
      going.push(
        { userId: "U901", name: "Medhaj", avatar: getInitialsAvatar("Medhaj"), status: "Going", isHost: false },
        { userId: "U902", name: "Rahul", avatar: getInitialsAvatar("Rahul"), status: "Going", isHost: false }
      );
    }

    const waitlist = [
      ...(plan.waitlistUsers || []),
      ...(plan.interestedUsers || [])
    ].map(u => ({
      name: u.name,
      avatar: u.avatar || getInitialsAvatar(u.name),
      status: "Waitlist"
    }));

    if (waitlist.length === 0 && (plan.category === "sports" || plan.title.toLowerCase().includes("football"))) {
      waitlist.push({
        name: "Raghavan",
        avatar: getInitialsAvatar("Raghavan"),
        status: "Waitlist"
      });
    }

    const deliveredNames = ["Sudeshna", "Ravi"].filter(
      n => n !== host.name && !going.some(g => g.name === n) && !waitlist.some(w => w.name === n)
    );
    const delivered = deliveredNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Delivered"
    }));

    const seenNames = ["Guhan", "Neelesh"].filter(
      n => n !== host.name && !going.some(g => g.name === n) && !waitlist.some(w => w.name === n)
    );
    const seen = seenNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Seen"
    }));

    const skippedNames = ["Pratyush", "Renjith"].filter(
      n => n !== host.name &&
        !going.some(g => g.name === n) &&
        !waitlist.some(w => w.name === n) &&
        !deliveredNames.includes(n) &&
        !seenNames.includes(n)
    );
    const skipped = skippedNames.map(name => ({
      name,
      avatar: getInitialsAvatar(name),
      status: "Skipped"
    }));

    return { going, waitlist, delivered, seen, skipped };
  };

  const { going, waitlist, delivered, seen, skipped } = getParticipantStates();

  const isGreen = colorTheme === "green" || plan.category === "sports";
  const primaryColor = isGreen ? "text-emerald-400" : "text-[#ff8b66]";
  const gradientFill = isGreen
    ? "from-emerald-500 via-teal-400 to-[#ff8b66]"
    : "from-[#ff8b66] via-[#ff6a4a] to-[#ff5d41]";
  const glowShadow = isGreen
    ? "shadow-[0_0_14px_rgba(16,185,129,0.45)]"
    : "shadow-[0_0_14px_rgba(255,139,102,0.45)]";

  const acceptedList = plan.joinedUsers.filter(u => u.userId !== plan.creatorId);

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 95, damping: 16 }}
      className={`pt-4 border-t border-white/10 space-y-4 text-left ${isPopupOpen ? "pb-2" : ""}`}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onPointerLeave={(e) => e.stopPropagation()}
    >
      <div className="group select-none">
        <div className="flex justify-between items-center text-[10px] font-mono mb-2.5">
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isGreen ? "bg-emerald-400/60" : "bg-[#ff8b66]/60"}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isGreen ? "bg-emerald-400" : "bg-[#ff8b66]"}`}></span>
            </span>
            <span className="text-zinc-400 font-extrabold tracking-wider uppercase">
              {titleText}
            </span>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onTogglePopup();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 bg-black/60 hover:bg-black/90 px-3 py-1 rounded-full border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          >
            <span className={`${primaryColor} font-black tracking-widest text-[10px] font-mono`}>
              {currentCount} / {maxSpots} JOINED
            </span>
            <span className="text-zinc-400 font-bold text-[8px] tracking-widest ml-0.5 leading-none">
              {isPopupOpen ? "▲" : "▼"}
            </span>
          </div>
        </div>

        {/* Cinematic Progress Bar with Morphing Height */}
        <motion.div
          layout="position"
          animate={{ height: isPopupOpen ? 24 : 18 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          className="relative w-full bg-black/60 backdrop-blur-md rounded-full overflow-hidden p-[2px] border border-zinc-900 transition-all duration-300 hover:border-zinc-800 shadow-[inset_0_1.5px_6px_rgba(0,0,0,0.85)]"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className={`relative h-full rounded-full bg-gradient-to-r ${gradientFill} ${glowShadow}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-pulse rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isPopupOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden space-y-6 pt-3"
          >
            {/* Breathable vertical scroll-free container for custom-scrollbar feel */}
            <div className="space-y-6 max-h-[280px] overflow-y-auto no-scrollbar pr-0.5">

              {/* 1. Going Group */}
              {going.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-zinc-900/40 pb-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-emerald-400 font-extrabold">
                      Going · {going.length} confirmed
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.85)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5">
                    {going.map((user, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-4">
                          <img
                            src={user.avatar}
                            className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            alt={user.name}
                            referrerPolicy="no-referrer"
                          />
                          <div className="leading-tight text-left">
                            <span className="text-sm font-bold text-zinc-200 block">
                              {user.name}
                              {user.isHost && <span className="text-zinc-500 text-xs font-normal ml-1">(Host)</span>}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-extrabold mt-0.5 block">
                              Going
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Waitlist Group */}
              {waitlist.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-zinc-900/40 pb-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-amber-400 font-extrabold">
                      Waitlist · {waitlist.length} benched
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.85)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5">
                    {waitlist.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-1">
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          alt={user.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="leading-tight text-left">
                          <span className="text-sm font-bold text-zinc-200 block">{user.name}</span>
                          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-extrabold mt-0.5 block">
                            Waitlist
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Delivered Group */}
              {delivered.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-zinc-900/40 pb-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-zinc-400 font-extrabold">
                      Delivered · {delivered.length} pending
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(115,115,115,0.3)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5">
                    {delivered.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-1 opacity-75">
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800/40"
                          alt={user.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="leading-tight text-left">
                          <span className="text-sm font-semibold text-zinc-400 block">{user.name}</span>
                          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider font-extrabold bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-700/30 mt-1 inline-block">
                            Delivered
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Seen Group */}
              {seen.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-zinc-900/40 pb-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-zinc-300 font-extrabold">
                      Seen · {seen.length} pending
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5">
                    {seen.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-1">
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                          alt={user.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="leading-tight text-left">
                          <span className="text-sm font-semibold text-zinc-200 block">{user.name}</span>
                          <span className="text-[9px] font-mono text-zinc-100 uppercase tracking-wider font-extrabold bg-white/10 px-2 py-0.5 rounded border border-white/15 mt-1 inline-block">
                            Seen
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Skipped Group */}
              {skipped.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 border-b border-zinc-900/40 pb-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-rose-400 font-extrabold">
                      Skipped · {skipped.length} unavailable
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.3)]" />
                  </div>
                  <div className="grid grid-cols-1 gap-3.5">
                    {skipped.map((user, idx) => (
                      <div key={idx} className="flex items-center gap-4 py-1 opacity-60">
                        <img
                          src={user.avatar}
                          className="w-12 h-12 rounded-full object-cover border-2 border-rose-500/20"
                          alt={user.name}
                          referrerPolicy="no-referrer"
                        />
                        <div className="leading-tight text-left">
                          <span className="text-sm font-semibold text-zinc-350 block">{user.name}</span>
                          <span className="text-[9px] font-mono text-rose-400 uppercase tracking-wider font-extrabold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 mt-1 inline-block">
                            Skipped
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 LIGHTWEIGHT SOCIAL CHAT SECTION DIRECTLY BELOW THE PROGRESS BAR */}
      <div
        className="pt-3.5 border-t border-white/5 space-y-3"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-1.5 select-none">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9.5px] font-mono uppercase tracking-[0.18em] font-extrabold ${isGreen ? "text-emerald-400" : "text-[#ff8b66]"}`}>
              💬 LIVE COORDINATION
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${isGreen ? "bg-emerald-400" : "bg-[#ff8b66]"} animate-pulse shadow-[0_0_8px_rgba(255,139,102,0.85)]`} />
          </div>
        </div>

        {/* Dynamic Voting Actions & Creation Popover if isCreatingPoll is active */}
        {isCreatingPoll && (
          <div className="bg-[#141417]/95 border border-white/5 rounded-24 p-3.5 space-y-3 shadow-[0_12px_45px_rgba(0,0,0,0.85)] relative">
            <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
              <span className={`text-[9px] font-mono uppercase tracking-[0.18em] font-extrabold ${isGreen ? "text-emerald-400" : "text-[#ff8b66]"}`}>
                📊 CREATE COHORT POLL
              </span>
              <button
                onClick={() => setIsCreatingPoll(false)}
                className="text-zinc-500 hover:text-zinc-350 text-[9px] font-mono uppercase tracking-widest cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                placeholder="Ask your community a question..."
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="w-full text-[10.5px] bg-[#1d1d23]/85 border border-white/[0.04] focus:border-white/10 rounded-lg px-2.5 py-2 text-white focus:outline-none transition-all"
              />

              <div className="space-y-1.5">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="flex-1 text-[10px] bg-[#1d1d23]/60 border border-white/[0.03] focus:border-white/10 rounded-lg px-2.5 py-1.5 text-zinc-300 focus:outline-none transition-all"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                        className="text-zinc-500 hover:text-rose-400 text-xs px-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-[9px] font-mono text-zinc-500 hover:text-white uppercase tracking-wider cursor-pointer flex items-center gap-1"
                >
                  + Add Option
                </button>

                <button
                  disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                  onClick={() => {
                    if (!setPlanMessages || !userProfile) return;
                    const cleanOptions = pollOptions.filter(o => o.trim());
                    const msg = {
                      sender: userProfile.name,
                      avatar: userProfile.avatar,
                      text: `📊 Poll: ${pollQuestion}`,
                      time: "Just Now",
                      poll: {
                        question: pollQuestion.trim(),
                        options: cleanOptions.map(o => ({ text: o.trim(), votes: 0, votedBy: [] }))
                      }
                    } as any;

                    setPlanMessages(prev => ({
                      ...prev,
                      [plan.id]: [...(prev[plan.id] || []), msg]
                    }));

                    setPollQuestion("");
                    setPollOptions(["", ""]);
                    setIsCreatingPoll(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${pollQuestion.trim() && pollOptions.filter(o => o.trim()).length >= 2
                    ? isGreen
                      ? "bg-emerald-400 text-black hover:opacity-95 shadow-[0_0_10px_rgba(52,211,153,0.3)]"
                      : "bg-[#ff8b66] text-black hover:opacity-95 shadow-[0_0_10px_rgba(255,139,102,0.3)]"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-650 cursor-not-allowed"
                    }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact floating conversation area with translucent surfaces */}
        <div className="bg-gradient-to-b from-black/55 to-black/75 backdrop-blur-xl border border-white/[0.04] rounded-24 p-3 space-y-3.5 max-h-[260px] overflow-y-auto no-scrollbar shadow-[inset_0_1px_2px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.6)]">
          {(!planMessages || !planMessages[plan.id] || planMessages[plan.id].length === 0) ? (
            <div className="flex flex-col items-center justify-center py-5 space-y-1 select-none">
              <span className="text-[13px] opacity-70">💬</span>
              <p className="text-[8.5px] text-zinc-500 font-mono tracking-widest uppercase">No spool chatter yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(planMessages[plan.id] || []).map((msg, index) => {
                const isMe = userProfile && msg.sender === userProfile.name;
                const isPoll = !!(msg as any).poll;

                const handleVote = (msgIndex: number, optIndex: number) => {
                  if (!setPlanMessages || !userProfile) return;
                  setPlanMessages(prev => {
                    const list = prev[plan.id] || [];
                    const updated = list.map((m: any, idx) => {
                      if (idx !== msgIndex || !m.poll) return m;

                      const username = userProfile.name;
                      const nextOptions = m.poll.options.map((opt: any, oIdx: number) => {
                        let votedBy = opt.votedBy || [];
                        const hasVoted = votedBy.includes(username);

                        if (oIdx === optIndex) {
                          if (hasVoted) {
                            votedBy = votedBy.filter((u: string) => u !== username);
                          } else {
                            votedBy = [...votedBy, username];
                          }
                        } else {
                          votedBy = votedBy.filter((u: string) => u !== username);
                        }

                        return {
                          ...opt,
                          votes: votedBy.length,
                          votedBy
                        };
                      });

                      return {
                        ...m,
                        poll: {
                          ...m.poll,
                          options: nextOptions
                        }
                      };
                    });

                    return {
                      ...prev,
                      [plan.id]: updated
                    };
                  });
                };

                return (
                  <div key={index} className={`flex gap-2.5 text-left items-start ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={msg.avatar || getInitialsAvatar(msg.sender)}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10 ring-offset-1 ring-offset-zinc-950 shadow-inner"
                          alt={msg.sender}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div className={`max-w-[78%] space-y-0.5 ${isMe ? "text-right" : "text-left"} ${isPoll ? "w-full" : ""}`}>
                      {!isMe && (
                        <div className="flex items-center gap-1.5 px-1 justify-normal">
                          <span className="text-[9px] font-extrabold text-zinc-350 tracking-wide">{msg.sender}</span>
                          <span className="text-[7px] font-mono text-zinc-550 lowercase font-bold">{msg.time}</span>
                        </div>
                      )}
                      <div className={`px-3 py-2.5 rounded-2xl text-[10.5px] leading-relaxed font-sans break-words shadow-md transition-all duration-300 ${isMe
                        ? isGreen
                          ? "bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/20 text-emerald-300 rounded-tr-none ml-auto shadow-[0_0_12px_rgba(16,185,129,0.06)]"
                          : "bg-gradient-to-br from-[#ff8b66]/15 via-[#ff5d41]/10 to-transparent border border-[#ff8b66]/20 text-[#ff8b66] rounded-tr-none ml-auto shadow-[0_0_12px_rgba(255,139,102,0.06)]"
                        : "bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 text-zinc-200 rounded-tl-none"
                        } ${isPoll ? "w-full" : ""}`}>
                        {isPoll ? (
                          <div className="space-y-2.5 text-left">
                            <div className="flex items-center gap-1.5 border-b border-white/[0.05] pb-1.5">
                              <span className="text-[11px] font-bold text-zinc-100">📊 {(msg as any).poll.question}</span>
                            </div>
                            <div className="space-y-1.5">
                              {(msg as any).poll.options.map((opt: any, oIdx: number) => {
                                const totalVotes = (msg as any).poll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
                                const percentage = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                                const userHasVoted = opt.votedBy?.includes(userProfile?.name || "");
                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => handleVote(index, oIdx)}
                                    className="w-full relative overflow-hidden bg-black/40 border border-white/[0.03] p-2 rounded-lg text-left transition-all hover:bg-black/60 focus:outline-none flex justify-between items-center group cursor-pointer"
                                  >
                                    <div
                                      className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-l-lg opacity-20 ${isGreen ? "bg-emerald-500" : "bg-[#ff8b66]"
                                        }`}
                                      style={{ width: `${percentage}%` }}
                                    />
                                    <span className={`relative text-[10px] font-sans text-left transition-colors z-10 flex items-center gap-1.5 ${userHasVoted ? "font-bold text-white" : "text-zinc-350"
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${userHasVoted
                                        ? isGreen ? "bg-emerald-400" : "bg-[#ff8b66]"
                                        : "bg-transparent border border-zinc-600"
                                        }`} />
                                      {opt.text}
                                    </span>
                                    <span className="relative font-mono text-[9px] text-zinc-400 z-10 font-bold shrink-0 ml-1">
                                      {percentage}% ({opt.votes || 0})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          msg.text
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Message Input Box with Clean Glass Cockpit feels and Inline Actions */}
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={localMsg}
              onChange={(e) => setLocalMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && localMsg.trim() && setPlanMessages && userProfile) {
                  const msg = {
                    sender: userProfile.name,
                    avatar: userProfile.avatar,
                    text: localMsg.trim(),
                    time: "Just Now"
                  };
                  setPlanMessages(prev => ({
                    ...prev,
                    [plan.id]: [...(prev[plan.id] || []), msg]
                  }));
                  setLocalMsg("");
                }
              }}
              className={`w-full text-[11px] bg-[#1a1a20]/75 hover:bg-[#202028]/85 focus:bg-[#0c0c10]/95 border ${isGreen
                ? "border-emerald-500/20 focus:border-emerald-500/55 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                : "border-[#ff8b66]/20 focus:border-[#ff8b66]/55 focus:shadow-[0_0_15px_rgba(255,139,102,0.25)]"
                } rounded-xl pl-4 pr-16 py-3 text-white focus:outline-none transition-all duration-300 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.8),0_4px_16px_rgba(0,0,0,0.5)]`}
            />

            {/* Embedded Action Tray */}
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {/* Poll Creation Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCreatingPoll(!isCreatingPoll)}
                className={`p-1.5 rounded-lg transition-all duration-300 ${isCreatingPoll
                  ? isGreen ? "bg-emerald-500/20 text-emerald-400" : "bg-[#ff8b66]/20 text-[#ff8b66]"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
                  } cursor-pointer`}
                title="Create Coordination Poll"
              >
                <svg viewBox="0 0 24 24" className="w-[14px] h-[14px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </button>

              {/* Compact send icon button */}
              <button
                type="button"
                disabled={!localMsg.trim()}
                onClick={() => {
                  if (localMsg.trim() && setPlanMessages && userProfile) {
                    const msg = {
                      sender: userProfile.name,
                      avatar: userProfile.avatar,
                      text: localMsg.trim(),
                      time: "Just Now"
                    };
                    setPlanMessages(prev => ({
                      ...prev,
                      [plan.id]: [...(prev[plan.id] || []), msg]
                    }));
                    setLocalMsg("");
                  }
                }}
                className={`p-1.5 rounded-lg transition-all duration-300 ${localMsg.trim()
                  ? isGreen
                    ? "text-emerald-400 hover:bg-emerald-400/10"
                    : "text-[#ff8b66] hover:bg-[#ff8b66]/10"
                  : "text-zinc-700 cursor-not-allowed"
                  } cursor-pointer`}
              >
                <Send className="w-[14.5px] h-[14.5px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


export default PlanReelCard;

