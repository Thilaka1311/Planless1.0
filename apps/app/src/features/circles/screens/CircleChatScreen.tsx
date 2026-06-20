import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, ShieldAlert, BadgeInfo, BellRing, Users, MoreVertical, LogOut, Edit, Trash, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { useProfileStore } from "../../../features/profile/state/ProfileContext";
import { useChatStore } from "../../../features/chat/state/ChatContext";
import { useLivePlan } from "../../plans/hooks/useLivePlan";
import { getInitialsAvatar } from "../../../demo/seedData";
import { getPlanCover } from "../../plans/config/planCoverImages";
import { formatPlanDate } from "../../../lib/mappers";

interface CircleChatScreenProps {
  circle: any;
  chatType: 'general' | 'plan';
  planId?: string;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  onLeavePlan?: () => void;
  onEditPlan?: (planId: string) => void;
  onEndPlan?: (planId: string) => void;
  planTeams?: Record<string, { teamA: string[]; teamB: string[]; locked: boolean }>;
  onUpdateTeams?: (planId: string, teamA: string[], teamB: string[], locked: boolean) => void;
}

const getPlanActivityIcon = (plan: any) => {
  const category = (plan.category || 'sports').toLowerCase();
  const subcategory = (plan.sports_type || plan.subcategory || plan.activity_type || plan.activityType || '').toLowerCase();

  if (category === 'sports' || category === 'football' || category === 'badminton' || subcategory) {
    if (subcategory.includes('badminton') || subcategory.includes('shuttle')) return '🏸';
    if (subcategory.includes('football') || subcategory.includes('soccer')) return '⚽';
    if (subcategory.includes('basketball')) return '🏀';
    if (subcategory.includes('tennis')) return '🎾';
    if (subcategory.includes('volleyball')) return '🏐';
    if (subcategory.includes('cricket')) return '🏏';
    if (category === 'badminton') return '🏸';
    if (category === 'football') return '⚽';
    return '⚽';
  }
  if (category.includes('movies') || category.includes('cinema')) return '🎬';
  if (category.includes('dining') || category.includes('restaurant') || category.includes('cafe')) return '🍽️';
  return '⚡';
};

export const CircleChatScreen: React.FC<CircleChatScreenProps> = ({
  circle,
  chatType,
  planId,
  onBack,
  onNavigate,
  onLeavePlan,
  onEditPlan,
  onEndPlan,
  planTeams,
  onUpdateTeams,
}) => {
  const { plans, refreshPlans, dbPlanTeamAssignments, assignTeam, unassignTeam, leavePlan } = usePlansStore();
  const plan = useLivePlan(planId);

  useEffect(() => {
    console.log('[PLAN_DEBUG] CircleChatScreen', { planId, livePlan: plan?.id ?? null, chatType });
  }, [planId, plan, chatType]);

  const { activeUserUuid } = useProfileStore();
  const resolvedUuid = activeUserUuid || circle.activeUserId;
  const circleUuid = circle.dbUuid || circle.id;

  const {
    messages,
    isLoading: isChatLoading,
    connectionStatus,
    setActiveRoom,
    sendMessage,
    unreadCounts,
    markThreadRead
  } = useChatStore();

  const [typedMessage, setTypedMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync active room in ChatContext with activeThread state
  useEffect(() => {
    const pId = chatType === "plan" && plan ? plan.dbUuid || plan.id : null;
    setActiveRoom(circleUuid, pId);
  }, [chatType, plan, circleUuid, setActiveRoom]);

  // Mark thread as read when entering the thread view
  useEffect(() => {
    const pId = chatType === "plan" && plan ? plan.dbUuid || plan.id : null;
    markThreadRead(circleUuid, pId);
  }, [chatType, plan, circleUuid, markThreadRead]);

  // Auto-scroll to the bottom on message update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!typedMessage.trim()) return;
    try {
      await sendMessage(typedMessage.trim());
      setTypedMessage('');
    } catch (err) {
      console.error("[CircleChatScreen] Failed to send message:", err);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 100);
  };

  // Filter local messages for thread isolation rendering
  const filteredMessages = messages.filter((msg) => {
    if (chatType === "general") {
      return !msg.planId;
    } else if (chatType === "plan" && plan) {
      const pId = plan.dbUuid || plan.id;
      return msg.planId === pId;
    }
    return false;
  });

  const getComposerState = () => {
    if (chatType === "general") {
      return { canSend: true, banner: null };
    }
    if (!plan) return { canSend: false, banner: null };

    if (plan.status === "completed") {
      return { canSend: false, banner: "This thread is archived." };
    }
    if (plan.status === "cancelled") {
      return { canSend: false, banner: "This plan was cancelled." };
    }

    // Permissions derive exclusively from plans.host_id — creatorId grants no host powers after transfer.
    const isHost = plan.hostId === resolvedUuid;
    const myMemberObj = plan.joinedUsers?.find((u: any) => u.userId === resolvedUuid);
    const isGoing = myMemberObj?.joinState === "going";
    const isWaitlist = myMemberObj?.joinState === "waitlist";

    if (isHost || isGoing) {
      return { canSend: true, banner: null };
    }
    if (isWaitlist) {
      return {
        canSend: false,
        banner: "You are currently waitlisted. You can follow the conversation but cannot send messages."
      };
    }
    return { canSend: false, banner: "You are not participating in this plan." };
  };

  const composerState = getComposerState();

  const title = chatType === 'general' ? circle.name : (plan?.title || 'Plan Thread');
  const subtitle = chatType === 'general' ? 'General Chat' : 'Plan Thread Chat';

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "";
    try {
      const date = new Date(timeStr);
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return "";
    }
  };

  const getParticipantsForPlan = () => {
    if (!plan || !plan.joinedUsers) return [];
    return plan.joinedUsers.map((u: any) => ({
      name: u.name || "Unknown Joiner",
      avatar: u.avatar || getInitialsAvatar(u.name || "Joiner"),
      status: (u.joinState || "going").toUpperCase(),
      isHost: u.userId === plan.hostId
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden select-text"
    >
      {/* 1. GENERAL CHAT STICKY HEADER */}
      {chatType === 'general' && (
        <div 
          id="circle-chat-header" 
          className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-[#08080A]/90 backdrop-blur-md sticky top-0 z-20 flex-shrink-0 text-left"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-left min-w-0">
              <h3 className="font-sans font-black text-[16px] uppercase tracking-wide text-white truncate leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-[#FF6B2C] font-mono tracking-widest font-black uppercase mt-0.5 leading-none">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-850">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "Connected" ? "bg-emerald-500" : "bg-zinc-500"
              }`}
            />
            <span className="text-[8px] font-mono font-bold text-zinc-400">
              {connectionStatus}
            </span>
          </div>
        </div>
      )}

      {/* 2. PLAN CHAT COLLAPSIBLE HEADER OVERLAY */}
      {chatType === 'plan' && plan && (
        <div 
          id="plan-chat-header-overlay"
          className={`absolute top-0 left-0 right-0 z-35 px-6 py-4 flex items-center justify-between transition-all duration-300 ${
            isScrolled 
              ? 'bg-[#08080A]/95 backdrop-blur-md border-b border-white/[0.05] py-3 shadow-lg shadow-black/40' 
              : 'bg-transparent py-4'
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition duration-200 active:scale-95 cursor-pointer flex-shrink-0 ${
                isScrolled 
                  ? 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white' 
                  : 'bg-black/40 border border-white/10 backdrop-blur-md text-white hover:bg-black/65'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Compact Plan Title shown only when scrolled */}
            <div className={`text-left min-w-0 transition-all duration-300 ${
              isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            }`}>
              <h3 className="font-sans font-black text-[15px] uppercase tracking-wide text-white truncate leading-tight">
                {plan.title}
              </h3>
              <p className="text-[9.5px] text-[#FF6B2C] font-mono tracking-widest font-black uppercase leading-none mt-0.5">
                LIVE COORDINATION
              </p>
            </div>
          </div>

          {/* Right side ⋮ Menu Button with Dropdown Container */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition duration-200 active:scale-95 cursor-pointer flex-shrink-0 ${
                isScrolled 
                  ? 'bg-white/[0.03] border border-white/[0.06] text-zinc-400 hover:text-white' 
                  : 'bg-black/40 border border-white/10 backdrop-blur-md text-white hover:bg-black/65'
              }`}
              title="Menu Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu Overlay */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 cursor-default" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-48 bg-[#0F0F13]/98 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-1 z-50 animate-fade-in origin-top-right text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onNavigate) onNavigate('immersive_plan');
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                  >
                    <BadgeInfo className="w-4 h-4 text-[#FF6B2C]" />
                    <span>View Plan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowParticipants(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-[#FF6B2C]" />
                    <span>Participants</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      const nextMuteState = !isMuted;
                      setIsMuted(nextMuteState);
                      alert(nextMuteState ? 'Notifications muted for this thread.' : 'Notifications unmuted.');
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                  >
                    <BellRing className={`w-4 h-4 ${isMuted ? 'text-zinc-500' : 'text-[#FF6B2C]'}`} />
                    <span>{isMuted ? 'Unmute Thread' : 'Mute Thread'}</span>
                  </button>
                  {chatType === 'plan' && plan && plan.hostId !== resolvedUuid && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowLeaveConfirm(true);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Ditch Plan</span>
                    </button>
                  )}
                  <div className="h-[1px] bg-white/[0.04] my-1" />
                  {chatType === 'plan' && plan && plan.hostId === resolvedUuid && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onEditPlan && plan) onEditPlan(plan.id);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-350 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 text-[#FF6B2C]" />
                        <span>Edit Plan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowEndConfirm(true);
                        }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-350 hover:bg-red-500/10 rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Trash className="w-4 h-4 text-red-500" />
                        <span>End Plan</span>
                      </button>
                      <div className="h-[1px] bg-white/[0.04] my-1" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-zinc-455 hover:text-white hover:bg-white/[0.04] rounded-lg transition duration-150 flex items-center gap-2.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-zinc-500" />
                    <span>Report</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES VIEW CONTAINER (SCROLLABLE VIEWPORT) */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-none flex flex-col bg-[#050507]"
      >
        {/* HERO AREA FOR PLAN THREAD */}
        {chatType === 'plan' && plan && (
          <div 
            id="plan-chat-hero-container" 
            className="relative w-full h-[250px] flex flex-col justify-end overflow-hidden flex-shrink-0 text-left"
          >
            {/* Full-bleed high contrast cover page image */}
             <img 
               src={(plan.coverImage && !plan.coverImage.includes("unsplash.com") && !plan.coverImage.includes("navkis_matchday.png"))
                 ? plan.coverImage
                 : getPlanCover(plan.category, (plan as any).subcategory || (plan as any).sports_type)}
               alt={plan.title}
               className="absolute inset-0 w-full h-full object-cover filter brightness-[0.7]"
               referrerPolicy="no-referrer"
            />

            {/* Soft edge darkening filter gradations */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-black/45 to-transparent pointer-events-none z-10" />

            {/* Hero Meta Info */}
            <div className="px-6 pb-4 z-15 relative text-left">
              {/* Large Premium Title with Emoji inline prefix */}
              <h1 className="font-sans font-black text-[23px] text-white tracking-tight leading-tight mb-2">
                {getPlanActivityIcon(plan)} {plan.title}
              </h1>

              {/* Host Row */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-zinc-300 font-medium font-sans">
                  Hosted by <strong className="text-white font-semibold">{plan.creatorName || "Host"}</strong>
                </span>
              </div>

              {/* Optional Enhancement Metadata Row */}
              <div className="flex items-center gap-4 mt-2 text-[10.5px] text-zinc-400 font-sans tracking-wide">
                <span className="flex items-center gap-1.5">
                  <span className="text-[11px]">📍</span> {plan.location || 'Play Arena HSR'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px]">🕒</span> {formatPlanDate(plan.datetime || plan.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}



        {/* COLLAPSIBLE TEAMS SECTION (FOOTBALL ONLY) */}
        {chatType === 'plan' && plan && ((plan as any).sports_type || (plan as any).subcategory || '').toLowerCase().includes('football') && (() => {
          const planUuid = plan.dbUuid || plan.id;
          const resolvedUuid = activeUserUuid || circle.activeUserId;
          const isHost = plan.hostId === resolvedUuid;

          const assignments = dbPlanTeamAssignments.filter(a => a.plan_id === planUuid);
          const goingMembers = plan.joinedUsers?.filter((u: any) => u.joinState === 'going') || [];

          const teamA = goingMembers.filter((m: any) => assignments.some(a => a.user_id === m.userId && a.team === 'A'));
          const teamB = goingMembers.filter((m: any) => assignments.some(a => a.user_id === m.userId && a.team === 'B'));
          const unassigned = goingMembers.filter((m: any) => !assignments.some(a => a.user_id === m.userId && (a.team === 'A' || a.team === 'B')));

          const handleMove = async (userUuid: string, target: 'A' | 'B' | 'bench') => {
            try {
              if (target === 'bench') {
                await unassignTeam(planUuid, userUuid);
              } else {
                await assignTeam(planUuid, userUuid, target);
              }
            } catch (err) {
              console.error("[CircleChatScreen] Failed to move player:", err);
            }
          };

          const getInitials = (name: string) => {
            return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
          };

          return (
            <div className="border-b border-white/[0.04] bg-[#09090C] px-6 py-3 flex flex-col select-none">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsTeamsExpanded(!isTeamsExpanded)}
                  className="flex items-center justify-between text-left text-xs font-black tracking-wider uppercase text-zinc-400 hover:text-white transition duration-150 cursor-pointer py-1"
                >
                  <span className="font-sans flex items-center gap-1.5">
                    <span>{isTeamsExpanded ? '▲' : '▼'}</span> ⚽ Teams
                  </span>
                </button>
              </div>

              {isTeamsExpanded && (
                <div className="mt-3 pb-2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {/* TEAM A Column */}
                    <div 
                      className="rounded-xl p-3 border border-white/[0.03] bg-[#0A0D10]/50 transition-colors"
                      onDragOver={(e) => isHost && e.preventDefault()}
                      onDrop={(e) => {
                        const userUuid = e.dataTransfer.getData('text/plain');
                        if (userUuid) handleMove(userUuid, 'A');
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-sans">
                          ⚽ TEAM A
                        </span>
                        <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded-full font-bold">
                          {teamA.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 min-h-[140px]">
                        {teamA.length === 0 ? (
                          <div className="h-[140px] border border-dashed border-white/[0.02] rounded-lg flex items-center justify-center text-center p-2">
                            <span className="text-[9px] font-mono text-zinc-650">
                              {isHost ? "Drag candidates here" : "No players assigned"}
                            </span>
                          </div>
                        ) : (
                          teamA.map((player) => (
                            <div 
                              key={player.userId}
                              draggable={isHost}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', player.userId);
                              }}
                              className={`flex items-center justify-between p-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-white/[0.03] rounded-lg text-left relative group ${
                                isHost ? 'cursor-grab active:cursor-grabbing' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {player.avatar ? (
                                  <img 
                                    src={player.avatar} 
                                    className="w-5 h-5 rounded-full object-cover border border-white/10" 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[8px] font-mono font-black flex items-center justify-center">
                                    {getInitials(player.name || "Unknown")}
                                  </div>
                                )}
                                <div className="truncate leading-none">
                                  <span className="text-[11px] font-semibold text-zinc-200 block truncate">{player.name}</span>
                                </div>
                              </div>

                              {isHost && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMove(player.userId, 'bench');
                                  }}
                                  className="w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Unassign Player"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* TEAM B Column */}
                    <div 
                      className="rounded-xl p-3 border border-white/[0.03] bg-[#0A0D10]/50 transition-colors"
                      onDragOver={(e) => isHost && e.preventDefault()}
                      onDrop={(e) => {
                        const userUuid = e.dataTransfer.getData('text/plain');
                        if (userUuid) handleMove(userUuid, 'B');
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.04] pb-1.5 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 font-sans">
                          ⚽ TEAM B
                        </span>
                        <span className="text-[9px] font-mono bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded-full font-bold">
                          {teamB.length}
                        </span>
                      </div>

                      <div className="space-y-1.5 min-h-[140px]">
                        {teamB.length === 0 ? (
                          <div className="h-[140px] border border-dashed border-white/[0.02] rounded-lg flex items-center justify-center text-center p-2">
                            <span className="text-[9px] font-mono text-zinc-650">
                              {isHost ? "Drag candidates here" : "No players assigned"}
                            </span>
                          </div>
                        ) : (
                          teamB.map((player) => (
                            <div 
                              key={player.userId}
                              draggable={isHost}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', player.userId);
                              }}
                              className={`flex items-center justify-between p-1.5 bg-zinc-950/80 hover:bg-zinc-900 border border-white/[0.03] rounded-lg text-left relative group ${
                                isHost ? 'cursor-grab active:cursor-grabbing' : ''
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {player.avatar ? (
                                  <img 
                                    src={player.avatar} 
                                    className="w-5 h-5 rounded-full object-cover border border-white/10" 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-[8px] font-mono font-black flex items-center justify-center">
                                    {getInitials(player.name || "Unknown")}
                                  </div>
                                )}
                                <div className="truncate leading-none">
                                  <span className="text-[11px] font-semibold text-zinc-200 block truncate">{player.name}</span>
                                </div>
                              </div>

                              {isHost && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMove(player.userId, 'bench');
                                  }}
                                  className="w-4 h-4 rounded bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Unassign Player"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* BENCH / POOL */}
                  <div className="bg-zinc-950/40 border border-white/[0.02] rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 font-sans">
                        Available Candidates
                      </span>
                      <span className="text-[9.5px] font-mono text-zinc-655 font-bold">
                        {unassigned.length} unassigned
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-h-[44px]">
                      {unassigned.length === 0 ? (
                        <span className="text-[9.5px] font-mono text-zinc-655 py-2 block w-full text-center">
                          All players are assigned to active squads.
                        </span>
                      ) : (
                        unassigned.map(player => (
                          <div 
                            key={player.userId}
                            draggable={isHost}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', player.userId);
                            }}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 bg-[#101014] border border-white/[0.04] rounded-lg select-none hover:border-[#FF6B2C]/30 relative ${
                              isHost ? 'cursor-grab' : ''
                            }`}
                          >
                            {player.avatar ? (
                              <img 
                                src={player.avatar} 
                                className="w-4 h-4 rounded-full object-cover border border-white/10" 
                                alt="" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-400 text-[8px] font-sans font-black flex items-center justify-center">
                                {getInitials(player.name || "Unknown")}
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-zinc-350">{(player.name || "Unknown").split(' ')[0]}</span>

                            {isHost && (
                              <div className="flex items-center gap-0.5 ml-1 border-l border-white/[0.06] pl-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleMove(player.userId, 'A')}
                                  className="w-3.5 h-3.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 text-[8px] font-black rounded flex items-center justify-center transition"
                                  title="Move to Team A"
                                >
                                  A
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMove(player.userId, 'B')}
                                  className="w-3.5 h-3.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-zinc-950 text-[8px] font-black rounded flex items-center justify-center transition"
                                  title="Move to Team B"
                                >
                                  B
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {!isHost && (
                    <div className="w-full py-2 px-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                      <span className="text-[10px] font-mono text-zinc-500 leading-relaxed block select-none">
                        ⏳ Host is currently organizing matching squads...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Dynamic transition layout divider */}
        <div className="my-2 select-none flex-shrink-0" />

        {/* CHAT MESSAGES ITEMS CONTAINER */}
        <div className="flex-1 px-6 pb-2 space-y-4 flex flex-col justify-end">
          {isChatLoading ? (
            <div className="text-center py-6 text-zinc-500 text-[10px] font-mono uppercase tracking-wider select-none">
              Loading messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 select-none flex flex-col items-center">
              <span className="text-[11px] font-bold text-zinc-400">No messages yet.</span>
              <span className="text-[9.5px] text-zinc-600 mt-1 max-w-[200px]">Start the conversation.</span>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg.id} className="flex items-center justify-center gap-2 py-2 w-full px-4 select-none">
                    <div className="h-[1px] bg-zinc-800 grow"></div>
                    <span className="text-[10px] text-zinc-500 font-medium px-2 text-center">
                      {msg.content}
                    </span>
                    <div className="h-[1px] bg-zinc-800 grow"></div>
                  </div>
                );
              }

              const isMe = msg.isOwn;
              const senderName = msg.sender?.name || "Member";
              const senderAvatar = msg.sender?.avatar || getInitialsAvatar(senderName);

              return (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] items-end ${
                    isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  <img 
                    src={senderAvatar} 
                    alt={senderName} 
                    className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0 select-none"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getInitialsAvatar(senderName);
                    }}
                  />
                  <div className="flex flex-col">
                    <div className={`flex items-baseline gap-2 mb-0.5 select-none ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className="text-[10px] font-bold text-zinc-500 font-sans">{senderName}</span>
                      <span className="text-[8px] text-zinc-700 font-mono">{formatTime(msg.createdAt)}</span>
                    </div>
                    <div
                      className={`rounded-[18px] py-2.5 px-4 text-[13px] leading-relaxed break-words font-sans text-left ${
                        isMe 
                          ? 'bg-[#FF6B2C] text-white rounded-br-none font-semibold' 
                          : 'bg-white/[0.03] text-zinc-200 border border-white/[0.04] rounded-bl-none font-medium'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* CHAT INPUT AREA */}
      <div className="p-4 border-t border-white/[0.04] bg-[#0C0C0E] flex items-center gap-3">
        <input
          type="text"
          disabled={!composerState.canSend}
          value={typedMessage}
          onChange={(e) => setTypedMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder={
            composerState.canSend
              ? chatType === 'general'
                ? "Drop a message..."
                : "Coordinate active plan..."
              : "Messaging disabled"
          }
          className={`flex-1 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.04] focus:border-white/10 rounded-full px-5 py-3 text-[13px] text-white placeholder-zinc-655 outline-none ${
            !composerState.canSend ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!composerState.canSend || !typedMessage.trim()}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0 ${
            composerState.canSend && typedMessage.trim()
              ? 'bg-[#FF6B2C] hover:bg-[#FF854C] text-white shadow-[#FF6B2C]/15'
              : 'bg-zinc-900 text-zinc-600 border border-white/[0.02] cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      {/* VIEW PARTICIPANTS OVERLAY MODAL */}
      {showParticipants && plan && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in"
        >
          <div className="bg-[#0D0D10]/95 border border-white/[0.08] rounded-2.5xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-black/45">
              <h3 className="text-xs font-black font-sans uppercase text-white tracking-widest">
                COORDINATION JOINERS ({getParticipantsForPlan().length})
              </h3>
              <button 
                type="button"
                onClick={() => setShowParticipants(false)}
                className="text-zinc-500 hover:text-white transition duration-150 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {getParticipantsForPlan().map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-left">
                  <div className="flex items-center gap-3">
                    <img 
                      src={p.avatar} 
                      alt={p.name} 
                      className="w-8 h-8 rounded-full object-cover" 
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getInitialsAvatar(p.name);
                      }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                      {p.isHost && (
                        <span className="text-[9px] text-[#FF6B2C] font-mono uppercase tracking-wider font-bold">HOST</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    p.status === 'GOING' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
 
      {/* LEAVE PLAN CONFIRMATION DIALOG */}
      {showLeaveConfirm && plan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in text-center">
          <div className="bg-[#0D0D10]/95 border border-white/[0.08] p-5 rounded-2xl w-full max-w-xs text-center shadow-2xl space-y-4">
            <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Ditch this plan?</h3>
              <p className="text-xs text-zinc-555 leading-relaxed font-sans">
                You will lose your confirmed spot.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  setShowLeaveConfirm(false);
                  try {
                    await leavePlan(plan.dbUuid || plan.id, resolvedUuid);
                    if (onLeavePlan) onLeavePlan();
                  } catch (err) {
                    console.error("[CircleChatScreen] Failed to ditch plan:", err);
                  }
                }}
                className="flex-1 bg-red-550 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ditch Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#0D0D10]/95 border border-white/[0.08] p-5 rounded-2xl w-full max-w-xs text-left shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Report Thread</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting this thread..."
              className="w-full h-24 bg-zinc-950 text-xs text-zinc-200 placeholder-zinc-600 p-3 rounded-xl border border-white/[0.05] focus:outline-none focus:border-[#FF6B2C]/40"
            />
            <div className="flex gap-2.5">
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  alert('Thank you for reporting. Our moderation team will inspect this thread.');
                }}
                className="flex-1 bg-[#FF6B2C] hover:bg-[#FF854C] text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* END PLAN CONFIRMATION DIALOG */}
      {showEndConfirm && plan && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5 animate-fade-in text-center">
          <div className="bg-[#0D0D10]/95 border border-white/[0.08] p-5 rounded-2xl w-full max-w-xs text-center shadow-2xl space-y-4">
            <Trash className="w-10 h-10 text-red-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">End Plan?</h3>
              <p className="text-xs text-zinc-550 leading-relaxed font-sans">
                Are you sure you want to end this plan? This will archive the thread for all participants.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowEndConfirm(false);
                  if (onEndPlan) onEndPlan(plan.id);
                }}
                className="flex-1 bg-red-550 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                End Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
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
