import React from "react";
import { AnimatePresence } from "motion/react";
import { Plan } from "../../core/types";
import { PlanConfirmedOverlay } from "../../components/PlanConfirmedOverlay";

interface ReservationSuccessModalProps {
  showPaymentSuccess: Plan | null;
  onClose: () => void;
  setActiveTab: (tab: any) => void;
}

export default function ReservationSuccessModal({
  showPaymentSuccess,
  onClose,
  setActiveTab
}: ReservationSuccessModalProps) {
  return (
    <AnimatePresence>
      {showPaymentSuccess && (
        <PlanConfirmedOverlay
          plan={showPaymentSuccess}
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

