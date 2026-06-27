import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Trophy, Award, Calendar, Flame, TrendingUp, Sparkles, Settings, ArrowLeft, Download, Share2, Star } from "lucide-react";
import { Circle, Plan, DbPlanOutcome, User } from "../../../core/types";
import { usePlansStore } from "../../../features/plans/state/PlansContext";
import { useProfileStore } from "../../../features/profile/state/ProfileContext";
import { UserAvatar } from "../../../shared/components/UserAvatar";

interface CircleHubScreenProps {
  circle: Circle;
  onBack: () => void;
  onHeaderClick: () => void;
  plans: Plan[];
}

export const CircleHubScreen: React.FC<CircleHubScreenProps> = ({ circle, onBack, onHeaderClick, plans }) => {
  const { dbMemories, dbMemoryResults, dbPlanOutcomes } = usePlansStore();
  const { activeUserId, dbUsers } = useProfileStore();

  const circleUuid = circle.dbUuid || circle.id;

  // Filter completed plans for this Circle
  const completedPlans = useMemo(() => {
    return plans.filter(p => 
      (p.circleId === circleUuid || p.circleId === circle.id) &&
      (p.status === "completed" || p.isHappened)
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

        <div onClick={onHeaderClick} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
          <h2 className="font-sans font-black text-sm tracking-widest uppercase text-white leading-tight">
            {circle.name}
          </h2>
          <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest mt-0.5 block">
            {circle.membersList?.length || 0} Members
          </span>
        </div>

        <button onClick={onHeaderClick} className="p-1.5 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>

      {completedPlans.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 my-auto select-none">
          <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-3xl">
            ✨
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-white">No memories yet</h4>
            <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">
              Complete plans to build your Circle history, stats, and achievements.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-8 text-left">
          {/* Season Stats */}
          <div className="space-y-3.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
              📊 Season Stats
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4.5 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Total Plans</span>
                <span className="text-2xl font-black font-mono text-white">{stats.totalPlans}</span>
              </div>
              <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4.5 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Average Attend</span>
                <span className="text-2xl font-black font-mono text-white">{stats.averageAttendance}</span>
              </div>
              <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4.5 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Current Streak</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black font-mono text-white">{stats.currentStreak}</span>
                  <Flame className="w-5 h-5 text-orange-500 fill-current animate-pulse" />
                </div>
              </div>
              <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4.5 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block">Most Active</span>
                <span className="text-xs font-bold text-[#ff8b66] block truncate pt-1.5">{stats.mostActiveMemberName}</span>
              </div>
            </div>
          </div>

          {/* Leaderboards */}
          <div className="space-y-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
              🏆 Leaderboards
            </span>

            <div className="bg-[#0b0b0d] border border-white/5 rounded-3xl p-5 space-y-5">
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Football MVP Awards</span>
                {leaderboards.footballMvp.length === 0 ? (
                  <div className="text-[11px] font-mono text-zinc-600">No MVPs awarded yet</div>
                ) : (
                  <div className="space-y-2">
                    {leaderboards.footballMvp.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                          <UserAvatar src={item.avatar} alt={item.name} size="w-7 h-7" />
                          <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#ff8b66]">{item.count} MVPs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-white/[0.04]" />

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Badminton MVP Awards</span>
                {leaderboards.badmintonMvp.length === 0 ? (
                  <div className="text-[11px] font-mono text-zinc-600">No MVPs awarded yet</div>
                ) : (
                  <div className="space-y-2">
                    {leaderboards.badmintonMvp.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                          <UserAvatar src={item.avatar} alt={item.name} size="w-7 h-7" />
                          <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#ff8b66]">{item.count} MVPs</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-white/[0.04]" />

              <div className="space-y-3">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">Total Attendances</span>
                <div className="space-y-2">
                  {leaderboards.attendance.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}</span>
                        <UserAvatar src={item.avatar} alt={item.name} size="w-7 h-7" />
                        <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-zinc-400">{item.count} Plans</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3.5">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
              ⚡ Recent Activity
            </span>
            <div className="bg-[#0b0b0d] border border-white/5 rounded-3xl p-5 space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex justify-between items-start gap-4 text-xs">
                  <span className="text-zinc-200 font-medium leading-relaxed">{act.text}</span>
                  <span className="text-[9px] font-mono text-zinc-650 uppercase shrink-0 pt-0.5">{act.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stories */}
          <div className="space-y-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 font-bold block">
              📸 Shareable Stories
            </span>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-6 px-6">
              {completedPlans.map((plan) => {
                const planUuid = plan.dbUuid || plan.id;
                const titleLower = plan.title.toLowerCase();

                const isBadminton = plan.sports_type === "Badminton" || titleLower.includes("badminton");
                const isFootball = (plan.sports_type === "Football" || titleLower.includes("football") || plan.category === "sports" && !titleLower.includes("badminton")) && !isBadminton;
                const isMovie = plan.category === "movies";
                const isDinner = plan.category === "restaurants" || plan.category === "dining";

                const photoOutcome = dbPlanOutcomes.find(o => o.plan_id === planUuid && o.outcome_type === "photos");

                return (
                  <div key={plan.id} className="w-[280px] shrink-0 bg-gradient-to-b from-[#121216] to-[#0A0A0C] border border-white/[0.08] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono text-[#ff8b66] uppercase tracking-wider font-bold">
                        {isFootball ? "⚽ FOOTBALL" : isBadminton ? "🏸 BADMINTON" : isMovie ? "🎬 MOVIE" : isDinner ? "🍝 DINNER" : "⚡ EVENT"}
                      </span>
                      <span className="text-[9px] text-zinc-650 font-mono">{plan.date}</span>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-black text-white leading-tight">{plan.title}</h5>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                        {circle.name}
                      </span>
                    </div>


                    <div className="space-y-2 border-t border-white/[0.04] pt-3 text-xs">
                      {(() => {
                        const memory = dbMemories.find(m => m.plan_id === planUuid);
                        if (!memory) return null;
                        const result = dbMemoryResults.find(r => r.memory_id === memory.id);
                        if (!result) return null;

                        if (memory.memory_type === "football") {
                          const mvpName = result.mvp_user_id 
                            ? userMap.get(result.mvp_user_id)?.full_name || "Sarah"
                            : "Sarah";
                          return (
                            <>
                              {result.score_home !== null && result.score_home !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-500 font-mono text-[9px]">FINAL SCORE</span>
                                  <span className="font-mono font-black text-white">{result.score_home} – {result.score_away}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-mono text-[9px]">🏆 MVP</span>
                                <span className="font-bold text-white">{mvpName}</span>
                              </div>
                            </>
                          );
                        }

                        if (memory.memory_type === "badminton") {
                          const mvpName = result.mvp_user_id 
                            ? userMap.get(result.mvp_user_id)?.full_name || "Sarah"
                            : "Sarah";
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-mono text-[9px]">🏆 MVP</span>
                                <span className="font-bold text-white">{mvpName}</span>
                              </div>
                            </>
                          );
                        }

                        if (memory.memory_type === "movies" || memory.memory_type === "dining") {
                          const ratingVal = result.average_rating || 5;
                          return (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-500 font-mono text-[9px]">RATING</span>
                                <span className="font-mono font-black text-[#ff8b66]">⭐ {ratingVal} / 5</span>
                              </div>
                              {result.review && (
                                <div className="flex justify-between items-center">
                                  <span className="text-zinc-500 font-mono text-[9px]">REVIEW</span>
                                  <span className="text-zinc-300 italic truncate max-w-[150px]">"{result.review}"</span>
                                </div>
                              )}
                            </>
                          );
                        }

                        return null;
                      })()}

                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-mono text-[9px]">ATTENDED</span>
                        <span className="font-mono text-zinc-300">{plan.members.filter(m => m.joinState === "going").length} Friends</span>
                      </div>
                    </div>

                    <div className="flex justify-between border-t border-white/[0.04] pt-3.5">
                      <button className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-400 hover:text-white uppercase transition-colors cursor-pointer">
                        <Share2 className="w-3.5 h-3.5 text-[#ff8b66]" /> Share
                      </button>
                      <button className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-400 hover:text-white uppercase transition-colors cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CircleHubScreen;
