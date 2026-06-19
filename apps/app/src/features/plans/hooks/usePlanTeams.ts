import { useState, useCallback } from "react";
import { DbPlanTeamAssignment, User } from "../../../core/types";
import { getPlanTeamAssignments, upsertPlanTeamAssignment, removePlanTeamAssignment } from "../../../lib/db";

export interface UsePlanTeamsProps {
  dbUsers: User[];
  insertSystemMessage: (planUuid: string, content: string, actorUuid: string | null) => Promise<void>;
}

export function usePlanTeams({ dbUsers, insertSystemMessage }: UsePlanTeamsProps) {
  const [dbPlanTeamAssignments, setDbPlanTeamAssignments] = useState<DbPlanTeamAssignment[]>([]);

  const getTeamAssignments = useCallback(async (planUuid: string): Promise<DbPlanTeamAssignment[]> => {
    const assignments = await getPlanTeamAssignments(planUuid);
    setDbPlanTeamAssignments(prev => {
      const withoutPlan = prev.filter(a => a.plan_id !== planUuid);
      return [...withoutPlan, ...assignments];
    });
    return assignments;
  }, []);

  const assignTeam = useCallback(async (planUuid: string, userUuid: string, team: "A" | "B"): Promise<void> => {
    setDbPlanTeamAssignments(prev => {
      const withoutEntry = prev.filter(a => !(a.plan_id === planUuid && a.user_id === userUuid));
      return [...withoutEntry, { plan_id: planUuid, user_id: userUuid, team }];
    });
    const ok = await upsertPlanTeamAssignment(planUuid, userUuid, team);
    if (!ok) {
      console.error("[usePlanTeams] assignTeam failed — rolling back optimistic state");
      await getTeamAssignments(planUuid);
    }
  }, [dbUsers, insertSystemMessage, getTeamAssignments]);

  const unassignTeam = useCallback(async (planUuid: string, userUuid: string): Promise<void> => {
    setDbPlanTeamAssignments(prev => prev.filter(a => !(a.plan_id === planUuid && a.user_id === userUuid)));
    const ok = await removePlanTeamAssignment(planUuid, userUuid);
    if (!ok) {
      console.error("[usePlanTeams] unassignTeam failed — rolling back optimistic state");
      await getTeamAssignments(planUuid);
    }
  }, [dbUsers, insertSystemMessage, getTeamAssignments]);

  return {
    dbPlanTeamAssignments,
    setDbPlanTeamAssignments,
    getTeamAssignments,
    assignTeam,
    unassignTeam,
  };
}
