import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Trophy, Award, Calendar, Flame, TrendingUp, Sparkles, Settings, ArrowLeft, Download, Share2, Star, ChevronRight, Hash } from "lucide-react";
import { Circle, Plan, DbPlanOutcome, User } from "../../../core/types";
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { useProfileStore } from "../../../features/profile/state/ProfileContext";
import { UserAvatar } from "../../../shared/components/UserAvatar";

interface CircleHubScreenProps {
  circle: Circle;
  onBack: () => void;
  onHeaderClick: () => void;
  plans: Plan[];
  onGeneralChatClick: () => void;
  onActivePlansClick: (planId: string) => void;
  onArchivedChatsClick: (planId: string) => void;
  onMembersClick: () => void;
}

export const CircleHubScreen: React.FC<CircleHubScreenProps> = ({ 
  circle, 
  onBack, 
  onHeaderClick, 
  plans,
  onGeneralChatClick,
  onActivePlansClick,
  onArchivedChatsClick,
  onMembersClick
}) => {
  const { dbMemories, dbMemoryResults, dbPlanOutcomes } = usePlansStore();
  const { activeUserId, dbUsers } = useProfileStore();

  const circleUuid = circle.dbUuid || circle.id;

  const activePlans = useMemo(() => {
    return plans.filter(p => 
      (p.circleId === circleUuid || p.circleId === circle.id) &&
      p.status !== "COMPLETED" && p.status !== "CANCELLED" && !p.isHappened
    );
  }, [plans, circleUuid, circle.id]);

  // Filter completed plans for this Circle
  const completedPlans = useMemo(() => {
    return plans.filter(p => 
      (p.circleId === circleUuid || p.circleId === circle.id) &&
      (p.status === "COMPLETED" || p.isHappened)
    );
  }, [plans, circleUuid, circle.id]);

  // Resolve user profile map
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    (dbUsers || []).forEach(u => {
      if (u.id) map.set(u.id, u);
      if (u.user_id) map.set(u.user_id, u);
    });
    return map;
  }, [dbUsers]);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const totalPlans = completedPlans.length;
    let totalAttendances = 0;
    const memberAttendanceCounts: Record<string, number> = {};
    const memberHostingCounts: Record<string, number> = {};
    const currentMonth = new Date().getMonth();
    let plansThisMonth = 0;

    completedPlans.forEach(plan => {
      // Host count
      if (plan.hostId) {
        memberHostingCounts[plan.hostId] = (memberHostingCounts[plan.hostId] || 0) + 1;
      }

      // Attendees count
      const attendees = plan.members.filter(m => m.joinState === "going");
      totalAttendances += attendees.length;

      attendees.forEach(m => {
        const uId = m.userId;
        memberAttendanceCounts[uId] = (memberAttendanceCounts[uId] || 0) + 1;
      });

      // Date check
      try {
        const planDate = new Date(plan.datetime || plan.createdAt);
        if (planDate.getMonth() === currentMonth) {
          plansThisMonth++;
        }
      } catch (e) {}
    });

    const averageAttendance = totalPlans > 0 ? Math.round(totalAttendances / totalPlans) : 0;

    // Find most active member
    let mostActiveMemberUuid = "N/A";
    let maxAttendances = 0;
    Object.entries(memberAttendanceCounts).forEach(([uuid, count]) => {
      if (count > maxAttendances) {
        maxAttendances = count;
        mostActiveMemberUuid = uuid;
      }
    });

    const activeUser = userMap.get(mostActiveMemberUuid);
    const mostActiveMemberName = activeUser?.full_name || mostActiveMemberUuid;

    // Calculate current user's attendance streak
    let currentStreak = 0;
    const sortedCompletedPlans = [...completedPlans].sort((a, b) => 
      new Date(b.datetime || b.createdAt).getTime() - new Date(a.datetime || a.createdAt).getTime()
    );

    for (const plan of sortedCompletedPlans) {
      const isAttended = plan.members.some(m => m.userId === activeUserId && m.joinState === "going");
      if (isAttended) {
        currentStreak++;
      } else {
        break; // Streak broken
      }
    }

    return {
      totalPlans,
      totalAttendances,
      averageAttendance,
      plansThisMonth,
      mostActiveMemberName,
      currentStreak,
      memberAttendanceCounts,
      memberHostingCounts
    };
  }, [completedPlans, activeUserId, userMap]);

  // Leaderboard Calculation
  const leaderboards = useMemo(() => {
    // 1. MVP Leaderboard (Football and Badminton separate)
    const footballMvpVoteCounts: Record<string, number> = {};
    const badmintonMvpVoteCounts: Record<string, number> = {};
    completedPlans.forEach(p => {
      const planUuid = p.dbUuid || p.id;
      const memory = dbMemories.find(m => m.plan_id === planUuid);
      if (memory) {
        const result = dbMemoryResults.find(r => r.memory_id === memory.id);
        if (result?.mvp_user_id) {
          if (memory.memory_type === "football") {
            footballMvpVoteCounts[result.mvp_user_id] = (footballMvpVoteCounts[result.mvp_user_id] || 0) + 1;
          } else if (memory.memory_type === "badminton") {
            badmintonMvpVoteCounts[result.mvp_user_id] = (badmintonMvpVoteCounts[result.mvp_user_id] || 0) + 1;
          }
        }
      }
    });

    const footballMvpLeaderboard = Object.entries(footballMvpVoteCounts)
      .map(([uuid, count]) => {
        const u = userMap.get(uuid);
        return { name: u?.full_name || "Member", count: count as number, avatar: u?.profile_photo };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const badmintonMvpLeaderboard = Object.entries(badmintonMvpVoteCounts)
      .map(([uuid, count]) => {
        const u = userMap.get(uuid);
        return { name: u?.full_name || "Member", count: count as number, avatar: u?.profile_photo };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 2. Attendance Leaderboard (All categories)
    const attendanceLeaderboard = Object.entries(stats.memberAttendanceCounts)
      .map(([uuid, count]) => {
        const u = userMap.get(uuid);
        return { name: u?.full_name || "Member", count: count as number, avatar: u?.profile_photo };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 3. Hosting Leaderboard
    const hostingLeaderboard = Object.entries(stats.memberHostingCounts)
      .map(([uuid, count]) => {
        const u = userMap.get(uuid);
        return { name: u?.full_name || "Member", count: count as number, avatar: u?.profile_photo };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      footballMvp: footballMvpLeaderboard,
      badmintonMvp: badmintonMvpLeaderboard,
      attendance: attendanceLeaderboard,
      hosting: hostingLeaderboard
    };
  }, [completedPlans, dbMemories, dbMemoryResults, stats, userMap]);

  // Recent Activity Feed Generation (Strict system-generated activities)
  const recentActivities = useMemo(() => {
    const list: { id: string; text: string; date: string; type: string }[] = [];

    completedPlans.forEach(plan => {
      const planUuid = plan.dbUuid || plan.id;
      const planDateStr = plan.date;

      const memory = dbMemories.find(m => m.plan_id === planUuid);
      if (!memory) return;

      const result = dbMemoryResults.find(r => r.memory_id === memory.id);
      if (!result) return;

      if (memory.memory_type === "football") {
        if (result.score_home !== null && result.score_home !== undefined) {
          list.push({
            id: `${planUuid}-score`,
            text: `⚽ ${plan.title} ended ${result.score_home}–${result.score_away}`,
            date: planDateStr,
            type: "stats"
          });
        }
        if (result.mvp_user_id) {
          const u = userMap.get(result.mvp_user_id);
          list.push({
            id: `${planUuid}-mvp`,
            text: `🏆 ${u?.full_name || "Sarah"} won MVP in ${plan.title}`,
            date: planDateStr,
            type: "mvp"
          });
        }
      } else if (memory.memory_type === "badminton") {
        if (result.mvp_user_id) {
          const u = userMap.get(result.mvp_user_id);
          list.push({
            id: `${planUuid}-badminton-mvp`,
            text: `🏆 ${u?.full_name || "Sarah"} won MVP in ${plan.title}`,
            date: planDateStr,
            type: "mvp"
          });
        }
      } else if (memory.memory_type === "movies" || memory.memory_type === "dining") {
        if (result.average_rating !== null && result.average_rating !== undefined) {
          const prefix = memory.memory_type === "movies" ? "🎬" : "🍝";
          list.push({
            id: `${planUuid}-review`,
            text: `${prefix} ${plan.title} received ${result.average_rating} stars`,
            date: planDateStr,
            type: "review"
          });
        }
      }

    });

    // Milestone: Streak logic
    Object.entries(stats.memberAttendanceCounts).forEach(([uuid, count]) => {
      if ((count as number) >= 10) {
        const u = userMap.get(uuid);
        list.push({
          id: `streak-milestone-${uuid}`,
          text: `🔥 ${u?.full_name || "Sarah"} reached a 10-plan streak!`,
          date: "Milestone",
          type: "milestone"
        });
      }
    });

    return list.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 15);
  }, [completedPlans, dbMemories, dbMemoryResults, dbPlanOutcomes, stats, userMap]);
  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-zinc-100 overflow-y-auto no-scrollbar pb-24">
      {/* Header bar */}
      <div className="sticky top-0 z-30 flex justify-between items-center px-6 py-4 bg-[#050505]/95 backdrop-blur-md border-b border-white/[0.02] select-none">
        <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div onClick={onMembersClick} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
          <h2 className="font-sans font-black text-sm tracking-widest uppercase text-white leading-tight">
            {circle.name}
          </h2>
          <span className="text-[9px] font-mono text-[#ff8b66] uppercase tracking-widest mt-0.5 block hover:underline">
            {circle.membersList?.length || 0} Members
          </span>
        </div>

        <button onClick={onHeaderClick} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 px-4 py-5 space-y-6">
        {/* Category: General (Permanent Channels) */}
        <div className="space-y-1.5">
          <button 
            onClick={onGeneralChatClick} 
            className="w-full flex items-center justify-between px-3 py-3 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 hover:from-zinc-850 hover:to-zinc-900 border border-white/[0.04] text-left transition-all duration-200 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-mono font-bold text-sm">
                #
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block">general-chat</span>
                <span className="text-[9px] text-zinc-550 block truncate">Permanent chat room for the circle</span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-650 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Category: Active Plans (Temporary Channels) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-[9px] font-bold text-zinc-500 tracking-[0.15em] uppercase select-none">
            <span>Active Plans ({activePlans.length})</span>
          </div>

          <div className="space-y-1">
            {activePlans.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-2xl bg-zinc-900/10 border border-dashed border-zinc-850/50">
                <Calendar className="w-5 h-5 text-zinc-700 mx-auto mb-1.5" />
                <span className="text-[10px] text-zinc-550 block font-sans">No active activities currently</span>
              </div>
            ) : (
              activePlans.map(plan => {
                const titleLower = plan.title.toLowerCase();
                const isFootball = titleLower.includes("football");
                const isBadminton = titleLower.includes("badminton");
                const channelIcon = isFootball ? "⚽" : (isBadminton ? "🏸" : "💬");

                return (
                  <button 
                    key={plan.id}
                    onClick={() => onActivePlansClick(plan.id)}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl bg-zinc-900/20 hover:bg-zinc-900/50 border border-transparent hover:border-white/[0.03] text-left transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#ff8b66]/10 flex items-center justify-center text-xs">
                        {channelIcon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors block truncate">
                          {plan.title.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                        <span className="text-[9px] text-zinc-500 block truncate">{plan.location || "Spontaneous"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] font-mono text-zinc-550">{plan.date}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-650 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Category: Archived Plan Chats (Read-only past activities) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 text-[9px] font-bold text-zinc-500 tracking-[0.15em] uppercase select-none">
            <span>Archived Plan Chats ({completedPlans.length})</span>
          </div>

          <div className="space-y-1">
            {completedPlans.length === 0 ? (
              <div className="px-3 py-4 text-center rounded-2xl bg-zinc-900/10 border border-dashed border-zinc-850/50">
                <Trophy className="w-5 h-5 text-zinc-700 mx-auto mb-1.5" />
                <span className="text-[10px] text-zinc-550 block font-sans">No completed plans archived yet</span>
              </div>
            ) : (
              completedPlans.map(plan => {
                const titleLower = plan.title.toLowerCase();
                const isFootball = titleLower.includes("football");
                const isBadminton = titleLower.includes("badminton");
                const channelIcon = isFootball ? "⚽" : (isBadminton ? "🏸" : "💬");

                return (
                  <button 
                    key={plan.id}
                    onClick={() => onArchivedChatsClick(plan.id)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-zinc-950/40 hover:bg-zinc-900/30 text-left transition-all duration-200 cursor-pointer group opacity-65 hover:opacity-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center text-xs opacity-75">
                        {channelIcon}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors block truncate">
                          {plan.title.toLowerCase().replace(/\s+/g, '-')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-zinc-600">{plan.date}</span>
                      <span className="text-[8px] font-mono uppercase bg-zinc-900/60 border border-white/[0.02] text-zinc-550 px-1.5 py-0.5 rounded-md">Archived</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CircleHubScreen;
