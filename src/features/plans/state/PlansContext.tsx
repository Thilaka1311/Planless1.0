import React, { createContext, useContext, useState, ReactNode } from "react";
import { Plan, PlanMember, DbPlan, DbPlanParticipant, DbMemory, User } from "../../../core/types";
import { mapPlansToLegacyPlans } from "../../../lib/mappers";

interface PlansState {
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  dbPlans: DbPlan[];
  setDbPlans: React.Dispatch<React.SetStateAction<DbPlan[]>>;
  dbPlanParticipants: DbPlanParticipant[];
  setDbPlanParticipants: React.Dispatch<React.SetStateAction<DbPlanParticipant[]>>;
  dbMemories: DbMemory[];
  setDbMemories: React.Dispatch<React.SetStateAction<DbMemory[]>>;
  joinPlan: (planId: string, userProfile: any) => void;
  leavePlan: (planId: string, userId: string) => void;
  passPlan: (planId: string, userId: string) => void;
  waitlistPlan: (planId: string, userProfile: any) => void;
  sendReminder: (planId: string, userId: string) => void;
  ignoreReminder: (planId: string, userId: string) => void;
  getHomeFeedPlans: (userId: string) => Plan[];
  getHubPlans: (userId: string) => Plan[];
}

const PlansContext = createContext<PlansState | undefined>(undefined);

export const PlansProvider = ({ children, userId = "" }: React.PropsWithChildren<{ userId?: string }>) => {
  const [dbPlans, setDbPlans] = useState<DbPlan[]>([]);
  const [dbPlanParticipants, setDbPlanParticipants] = useState<DbPlanParticipant[]>([]);
  const [dbMemories, setDbMemories] = useState<DbMemory[]>([]);

  const [plans, setPlans] = useState<Plan[]>([]);

  const joinPlan = (planId: string, userProfile: any) => {
    // 1. Update UI plans state
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === planId) {
        const alreadyJoined = plan.members.some(u => u.userId === userProfile.user_id && u.joinState === "going");
        if (alreadyJoined) return plan;

        const activeMembersCount = plan.members.filter(u => u.joinState === "going").length;
        if (activeMembersCount >= plan.capacity) {
          console.warn(`[Planless] Cannot join ${plan.title}, capacity reached (${plan.capacity}). Routing to waitlist.`);
          return plan;
        }

        const newMember: PlanMember = {
          userId: userProfile.user_id || userId,
          name: userProfile.name,
          avatar: userProfile.avatar,
          joinState: "going",
          reminderState: "none",
          joinedAt: new Date().toISOString()
        };

        const newMembersList = [...plan.members.filter(m => m.userId !== newMember.userId), newMember];

        return {
          ...plan,
          members: newMembersList,
          joinedUsers: newMembersList,
          confirmedCount: newMembersList.filter(m => m.joinState === "going").length
        };
      }
      return plan;
    }));

    // 2. Sync DB Participants
    setDbPlanParticipants(prev => {
      const exists = prev.some(p => p.plan_id === planId && p.user_id === userProfile.user_id);
      if (exists) {
        return prev.map(p => p.plan_id === planId && p.user_id === userProfile.user_id ? { ...p, status: "going" as const } : p);
      }
      return [...prev, {
        participant_id: `PP_${Date.now()}`,
        plan_id: planId,
        user_id: userProfile.user_id,
        status: "going" as const,
        payment_status: "paid" as const,
        joined_at: new Date().toISOString()
      }];
    });
  };

  const waitlistPlan = (planId: string, userProfile: any) => {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === planId) {
        const alreadyWaitlisted = plan.members.some(u => u.userId === userProfile.user_id && u.joinState === "waitlist");
        if (alreadyWaitlisted) return plan;

        const newMember: PlanMember = {
          userId: userProfile.user_id || userId,
          name: userProfile.name,
          avatar: userProfile.avatar,
          joinState: "waitlist",
          reminderState: "none",
          joinedAt: new Date().toISOString()
        };

        const newMembersList = [...plan.members.filter(m => m.userId !== newMember.userId), newMember];

        return {
          ...plan,
          members: newMembersList,
          joinedUsers: newMembersList,
          waitlistUsers: newMembersList.filter(m => m.joinState === "waitlist")
        };
      }
      return plan;
    }));

    setDbPlanParticipants(prev => {
      const exists = prev.some(p => p.plan_id === planId && p.user_id === userProfile.user_id);
      if (exists) {
        return prev.map(p => p.plan_id === planId && p.user_id === userProfile.user_id ? { ...p, status: "waitlist" as const } : p);
      }
      return [...prev, {
        participant_id: `PP_${Date.now()}`,
        plan_id: planId,
        user_id: userProfile.user_id,
        status: "waitlist" as const,
        payment_status: "unpaid" as const,
        joined_at: new Date().toISOString()
      }];
    });
  };

  const leavePlan = (planId: string, leaverId: string) => {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === planId) {
        const newMembersList = plan.members.filter(u => u.userId !== leaverId);
        return {
          ...plan,
          members: newMembersList,
          joinedUsers: newMembersList,
          confirmedCount: newMembersList.filter(m => m.joinState === "going").length
        };
      }
      return plan;
    }));

    setDbPlanParticipants(prev => prev.filter(p => !(p.plan_id === planId && p.user_id === leaverId)));
  };

  const passPlan = (planId: string, passerId: string) => {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === planId) {
        const newMembersList = plan.members.map(u =>
          u.userId === passerId ? { ...u, joinState: "skipped" as const } : u
        );
        return {
          ...plan,
          members: newMembersList,
          joinedUsers: newMembersList.filter(m => m.joinState !== "passed" && m.joinState !== "skipped"),
          confirmedCount: newMembersList.filter(m => m.joinState === "going").length
        };
      }
      return plan;
    }));

    setDbPlanParticipants(prev => {
      const exists = prev.some(p => p.plan_id === planId && p.user_id === passerId);
      if (exists) {
        return prev.map(p => p.plan_id === planId && p.user_id === passerId ? { ...p, status: "skipped" as const } : p);
      }
      return [...prev, {
        participant_id: `PP_${Date.now()}`,
        plan_id: planId,
        user_id: passerId,
        status: "skipped" as const,
        payment_status: "unpaid" as const,
        joined_at: new Date().toISOString()
      }];
    });
  };

  // Reminder System
  const sendReminder = (planId: string, targetUserId: string) => {
    setPlans(prevPlans => prevPlans.map(plan => {
      if (plan.id === planId) {
        const newMembersList = plan.members.map(u =>
          u.userId === targetUserId ? { ...u, reminderState: "sent" as const } : u
        );
        return {
          ...plan,
          members: newMembersList,
          joinedUsers: newMembersList.filter(m => m.joinState !== "passed")
        };
      }
      return plan;
    }));
  };

  const ignoreReminder = (planId: string, ignoreUserId: string) => {
    passPlan(planId, ignoreUserId);
  };

  const getHomeFeedPlans = (userId: string) => {
    const filtered = plans.filter(plan => {
      const member = plan.members.find(m => m.userId === userId);
      if (member && (member.joinState === "passed" || member.joinState === "skipped" || member.joinState === "passed" as any)) return false;
      return true;
    });

    const getTimelineSectionValue = (p: Plan) => {
      const dt = p.date.toUpperCase();
      if (dt.includes("TODAY")) return 1;
      if (dt.includes("TOMORROW")) return 2;
      return 3;
    };

    const getDayIndexValue = (dateStr: string) => {
      const d = dateStr.toUpperCase();
      if (d.includes("MON")) return 1;
      if (d.includes("TUE")) return 2;
      if (d.includes("WED")) return 3;
      if (d.includes("THU")) return 4;
      if (d.includes("FRI")) return 5;
      if (d.includes("SAT")) return 6;
      if (d.includes("SUN")) return 7;
      return 8;
    };

    const parseTimeToMinutesValue = (timeStr: string) => {
      if (!timeStr) return 0;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    return filtered.sort((a, b) => {
      const secA = getTimelineSectionValue(a);
      const secB = getTimelineSectionValue(b);
      if (secA !== secB) return secA - secB;

      const dayA = getDayIndexValue(a.date);
      const dayB = getDayIndexValue(b.date);
      if (dayA !== dayB) return dayA - dayB;

      return parseTimeToMinutesValue(a.time) - parseTimeToMinutesValue(b.time);
    });
  };

  const getHubPlans = (userIdStr: string) => {
    return plans.filter(plan => {
      if (plan.hostId === userIdStr || plan.creatorId === "u_self") return true;
      const member = plan.members.find(m => m.userId === userIdStr);
      return member?.joinState === "going";
    });
  };

  return (
    <PlansContext.Provider value={{ 
      plans, setPlans, 
      dbPlans, setDbPlans, 
      dbPlanParticipants, setDbPlanParticipants,
      dbMemories, setDbMemories,
      joinPlan, leavePlan, passPlan, waitlistPlan, sendReminder, ignoreReminder, getHomeFeedPlans, getHubPlans 
    }}>
      {children}
    </PlansContext.Provider>
  );
};

export const usePlansStore = () => {
  const context = useContext(PlansContext);
  if (context === undefined) {
    throw new Error("usePlansStore must be used within a PlansProvider");
  }
  return context;
};
