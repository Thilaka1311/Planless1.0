import { useMemo } from "react";
import { usePlansStore } from "../state/PlansContext";
import { Plan } from "../../../core/types";

export function useLivePlan(planId: string | null | undefined): Plan | null {
  const { plans } = usePlansStore();
  return useMemo(() => {
    if (!planId) return null;
    return plans.find(p => p.id === planId || p.dbUuid === planId) || null;
  }, [plans, planId]);
}
