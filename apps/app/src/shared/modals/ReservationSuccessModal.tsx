import React from "react";
import { AnimatePresence } from "motion/react";
import { PlanConfirmedOverlay } from "../../features/plans/components/PlanConfirmedOverlay";
import { useLivePlan } from "../../features/plans/hooks/useLivePlan";

interface ReservationSuccessModalProps {
  planId: string | null;
  isWaitlist?: boolean;
  onClose: () => void;
  setActiveTab: (tab: any) => void;
  setPlansFilter?: (filter: any) => void;
}

export default function ReservationSuccessModal({
  planId,
  isWaitlist = false,
  onClose,
  setActiveTab,
  setPlansFilter,
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
            if (setPlansFilter) {
              setPlansFilter(isWaitlist ? "WAITLISTED" : "JOINED");
            }
            setActiveTab("plans");
          }}
          onBackToHome={onClose}
        />
      )}
    </AnimatePresence>
  );
}
