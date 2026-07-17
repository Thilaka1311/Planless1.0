import React from "react";
import { PlansPreviewScreen, PlansPreviewScreenProps } from "../../../features/home/screens/HomePlansPreview/HomePlansPreviewScreen";

// DetailedPlanModal is a thin wrapper around PlansPreviewScreen.
// All visual logic, state, and sub-components live in PlansPreviewScreen.
// planId may be null (when no plan is selected); in that case nothing is rendered.
interface DetailedPlanModalProps extends Omit<PlansPreviewScreenProps, "planId"> {
  planId: string | null;
}

function DetailedPlanModal({ planId, ...rest }: DetailedPlanModalProps) {
  if (!planId) return null;
  return <PlansPreviewScreen planId={planId} {...rest} />;
}

export default React.memo(DetailedPlanModal);
