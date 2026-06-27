import React from "react";
import { Plan } from "../../../core/types";
import { usePlansStore } from "../../plans/state/PlansContext";

export function useHomeFeed(discoverablePlans: Plan[]) {
  const { refreshPlans } = usePlansStore();

  React.useEffect(() => {
    refreshPlans().catch((err) =>
      console.error("[HomeScreen] failed to refresh plans:", err)
    );
  }, []);

  const plansToRender = React.useMemo(() => {
    return discoverablePlans;
  }, [discoverablePlans]);

  return {
    plansToRender,
  };
}

