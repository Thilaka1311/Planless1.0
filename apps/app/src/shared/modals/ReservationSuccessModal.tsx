import React from "react";
import { AnimatePresence } from "motion/react";
import { PlanConfirmedOverlay } from "../../components/PlanConfirmedOverlay";
import { useLivePlan } from "../../features/plans/hooks/useLivePlan";

interface ReservationSuccessModalProps {
  planId: string | null;
  isWaitlist?: boolean;
  onClose: () => void;
  setActiveTab: (tab: any) => void;
}

export default function ReservationSuccessModal({
  planId,
  isWaitlist = false,
  onClose,
  setActiveTab
}: ReservationSuccessModalProps) {
  const livePlan = useLivePlan(planId);

  React.useEffect(() => {
    console.log('[PLAN_DEBUG] ReservationSuccessModal', { planId, livePlan: livePlan?.id ?? null });
  }, [planId, livePlan]);

  return (
    <AnimatePresence>
      {planId && livePlan && (
        <PlanConfirmedOverlay
          plan={livePlan}
          isWaitlist={isWaitlist}
          onGoToPlans={() => {
            onClose();
            setActiveTab("plans");
          }}
          onBackToHome={onClose}
        />
      )}
    </AnimatePresence>
  );
}
