import React from "react";
import { Plan, UserProfile, NotificationItem } from "../../../core/types";
import { PlanCard } from "./PlanCard";

interface PlanStackProps {
  plansToRender: Plan[];
  handleScrollLoop: (e: React.UIEvent<HTMLDivElement>) => void;
  homeFeedRef: React.RefObject<HTMLDivElement | null>;
  userProfile: UserProfile;
  interestedPlanIds: string[];
  setSelectedPlan: (planId: string | null) => void;
  setPaymentConfirmationPlan: (planId: string | null) => void;
  walletBalance: number;
  handleToggleJoin: (planId: string) => void;
  setShowPaymentSuccess: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  activeCardId: string | null;
  setActiveCardId: (planId: string) => void;
  handleSnoozePlan: (planId: string) => void;
  handleWaitlistPlan?: (planId: string, userProfile: any) => void;
  onNavigateToPlanChat?: (planId: string) => void;
}

export const PlanStack: React.FC<PlanStackProps> = ({
  plansToRender,
  handleScrollLoop,
  homeFeedRef,
  userProfile,
  interestedPlanIds,
  setSelectedPlan,
  setPaymentConfirmationPlan,
  walletBalance,
  handleToggleJoin,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  setNotifications,
  activeCardId,
  setActiveCardId,
  handleSnoozePlan,
  handleWaitlistPlan,
  onNavigateToPlanChat,
}) => {
  return (
    <div
      id="home_swipe_feed"
      ref={homeFeedRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      style={{
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
      onScroll={handleScrollLoop}
    >
      {plansToRender.map((plan) => (
        <PlanCard
          key={plan.id}
          planId={plan.id}
          userProfile={userProfile}
          interestedPlanIds={interestedPlanIds}
          setSelectedPlan={setSelectedPlan}
          setPaymentConfirmationPlan={setPaymentConfirmationPlan}
          walletBalance={walletBalance}
          handleToggleJoin={handleToggleJoin}
          setShowPaymentSuccess={setShowPaymentSuccess}
          setShowWaitlistSuccess={setShowWaitlistSuccess}
          setNotifications={setNotifications}
          activeCardId={activeCardId}
          onSelectCard={(id) => {
            setActiveCardId(id);
            if (id) {
              setSelectedPlan(id);
            }
          }}
          handleSnoozePlan={handleSnoozePlan}
          waitlistPlan={handleWaitlistPlan}
          onNavigateToPlanChat={onNavigateToPlanChat}
        />
      ))}
    </div>
  );
};
