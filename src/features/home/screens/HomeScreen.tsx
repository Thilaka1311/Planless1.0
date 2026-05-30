import React from 'react';
import PlanReelCard from "../../../features/plans/components/PlanReelCard";

export const HomeScreen = (props: any) => {
  const {
    discoverablePlans,
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
    triggerToast,
    activeCardId,
    setActiveCardId,
    handleSnoozePlan,
    handleWaitlistPlan
  } = props;

          const N = discoverablePlans.length;
          const plansToRender = N > 1
            ? [
              { ...discoverablePlans[N - 1], id: `${discoverablePlans[N - 1].id}-loop-prev-dup` },
              ...discoverablePlans,
              { ...discoverablePlans[0], id: `${discoverablePlans[0].id}-loop-next-dup` }
            ]
            : discoverablePlans;

          const handleScrollLoop = (e: React.UIEvent<HTMLDivElement>) => {
            const target = e.currentTarget;
            const { scrollTop, clientHeight } = target;
            if (N <= 1) return;

            const maxThreshold = (N + 1) * clientHeight - 10;
            if (scrollTop >= maxThreshold) {
              target.scrollTop = clientHeight;
            } else if (scrollTop <= 10) {
              target.scrollTop = N * clientHeight;
            }
          };


return (
            <div id="home_tab_pane" className="w-full h-full relative overflow-hidden bg-[#0C0C0E]">
              {discoverablePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                  <span className="text-4xl text-zinc-650 animate-pulse">✨</span>
                  <p className="text-zinc-400 font-sans text-xs max-w-xs leading-relaxed">
                    Your home feed is empty for now. Visit the <strong className="text-brand-orange">Plans</strong> or <strong className="text-brand-orange">Circles</strong> tab to create or join something new.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    id="home_swipe_feed"
                    ref={homeFeedRef}
                    className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                    style={{
                      scrollSnapType: 'y mandatory',
                      WebkitOverflowScrolling: 'touch'
                    }}
                    onScroll={handleScrollLoop}
                  >
                    {plansToRender.map((plan) => (
                      <PlanReelCard
                        key={plan.id}
                        plan={plan}
                        userProfile={userProfile}
                        interestedPlanIds={interestedPlanIds}
                        setSelectedPlan={setSelectedPlan}
                        setPaymentConfirmationPlan={setPaymentConfirmationPlan}
                        walletBalance={walletBalance}
                        handleToggleJoin={handleToggleJoin}
                        setShowPaymentSuccess={setShowPaymentSuccess}
                        setShowWaitlistSuccess={setShowWaitlistSuccess}
                        setNotifications={setNotifications}
                        triggerToast={triggerToast}
                        activeCardId={activeCardId}
                        onSelectCard={setActiveCardId}
                        handleSnoozePlan={handleSnoozePlan}
                        waitlistPlan={handleWaitlistPlan}
                      />
                    ))}
                  </div>


                </>
              )}
            </div>
          );
        
};
