import React from "react";
import { PlansDetailsScreen, PlansDetailsScreenProps } from "../../../features/plans/screens/PlansScreen/PlansDetailsScreen";

// DetailedPlanModal is a thin wrapper around PlansDetailsScreen.
// All visual logic, state, and sub-components live in PlansDetailsScreen.
// planId may be null (when no plan is selected); in that case nothing is rendered.
interface DetailedPlanModalProps extends Omit<PlansDetailsScreenProps, "planId"> {
  planId: string | null;
}

function DetailedPlanModal({ planId, ...rest }: DetailedPlanModalProps) {
  if (!planId) return null;
  return <PlansDetailsScreen planId={planId} {...rest} />;
}

export default React.memo(DetailedPlanModal);
