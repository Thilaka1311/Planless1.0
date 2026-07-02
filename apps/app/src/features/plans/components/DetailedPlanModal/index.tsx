import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "../../../../core/types";
import { useDetailedPlanState } from "./hooks/useDetailedPlanState";
import { Header } from "./Header";
import { PlanDetailsInfo, hasUserEnteredDescription } from "./PlanDetailsInfo";
import { ParticipantToggleBar } from "../ParticipantToggleBar";
import { TeamsSection } from "./TeamsSection";
import { ActionButtons } from "./ActionButtons";
import { LeaveConfirmDialog } from "./LeaveConfirmDialog";
import { DitchConfirmDialog } from "./DitchConfirmDialog";
import { ChangeHostDialog } from "./ChangeHostDialog";
import { ParticipantActionSheet } from "./ParticipantActionSheet";
import { RemoveConfirmDialog } from "./RemoveConfirmDialog";
import TeamOrganizerModal from "../../../../shared/modals/TeamOrganizerModal";
import PlanCompletionModal from "../../../../shared/modals/PlanCompletionModal";

// Re-export this utility for compatibility with edit forms
export { hasUserEnteredDescription };

interface DetailedPlanModalProps {
  planId: string;
  onClose: () => void;
  userProfile: UserProfile;
  activeUserId?: string;
  setSelectedMemoryPlan?: (planId: string) => void;
  onNavigateToCircle?: (circleId: string) => void;
  onNavigateToPlanChat?: (planId: string) => void;
  onEditPlan?: (planId: string) => void;
  setShowPaymentSuccess?: (planId: string | null) => void;
  setShowWaitlistSuccess?: (planId: string | null) => void;
  onLeavePlan?: () => void;
  onPlanCancelled?: (planId: string) => void;
}

function DetailedPlanModal({
  planId,
  onClose,
  userProfile,
  activeUserId,
  setSelectedMemoryPlan,
  onNavigateToCircle,
  onNavigateToPlanChat,
  onEditPlan,
  setShowPaymentSuccess,
  setShowWaitlistSuccess,
  onLeavePlan,
  onPlanCancelled,
}: DetailedPlanModalProps) {
  const state = useDetailedPlanState({
    planId,
    userProfile,
    activeUserId,
    onClose,
    setSelectedMemoryPlan,
    setShowPaymentSuccess,
    setShowWaitlistSuccess,
    onLeavePlan,
    onPlanCancelled,
  });

  const { selectedPlan, showToast } = state;

  if (!selectedPlan) return null;

  return (
    <motion.div
      id="detailed_plan_modal"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute inset-0 bg-[#050505] z-45 flex flex-col h-full relative overflow-hidden text-left"
    >
      {/* Dialog Overlays */}
      <LeaveConfirmDialog
        showLeaveConfirm={state.showLeaveConfirm}
        setShowLeaveConfirm={state.setShowLeaveConfirm}
        handleSkipConfirm={state.handleSkipConfirm}
        isLeaving={state.isLeaving}
      />

      <DitchConfirmDialog
        showDitchConfirm={state.showDitchConfirm}
        setShowDitchConfirm={state.setShowDitchConfirm}
        handleDitchConfirm={state.handleDitchConfirm}
        isDitching={state.isDitching}
      />

      <ChangeHostDialog
        showChangeHostList={state.showChangeHostList}
        setShowChangeHostList={state.setShowChangeHostList}
        eligibleParticipants={state.eligibleParticipants}
        selectedNewHost={state.selectedNewHost}
        setSelectedNewHost={state.setSelectedNewHost}
        handleChangeHostConfirm={state.handleChangeHostConfirm}
        isChangingHost={state.isChangingHost}
      />

      <ParticipantActionSheet
        selectedParticipantForActions={state.selectedParticipantForActions}
        setSelectedParticipantForActions={state.setSelectedParticipantForActions}
        isHost={state.isHost}
        resolvedUserUuid={state.resolvedUserUuid}
        hostId={selectedPlan.hostId}
        setUserToRemove={state.setUserToRemove}
        showToast={showToast}
      />

      <RemoveConfirmDialog
        userToRemove={state.userToRemove}
        setUserToRemove={state.setUserToRemove}
        handleRemoveParticipant={state.handleRemoveParticipant}
        isRemoving={state.isRemoving}
      />

      {/* Main scrollable viewport */}
      <div
        id="immersive-plan-scroll-container"
        className="flex-1 overflow-y-auto scrollbar-none pb-10"
      >
        <Header
          selectedPlan={selectedPlan}
          onClose={onClose}
          isHost={state.isHost}
          isMenuOpen={state.isMenuOpen}
          setIsMenuOpen={state.setIsMenuOpen}
          onEditPlan={onEditPlan}
          setShowChangeHostList={state.setShowChangeHostList}
          setShowDitchConfirm={state.setShowDitchConfirm}
          isParticipant={state.isParticipant}
        />

        <PlanDetailsInfo
          selectedPlan={selectedPlan}
          responseDeadlineText={state.responseDeadlineText}
          costText={state.costText}
          hasCost={state.hasCost}
        />

        <ParticipantToggleBar
          plan={selectedPlan}
          userProfile={userProfile}
          isExpanded={state.isExpanded}
          setIsExpanded={state.setIsExpanded}
          setSelectedParticipantForActions={state.setSelectedParticipantForActions}
        />

        <TeamsSection
          showTeams={state.showTeams}
          isModerator={state.isHost}
          setShowManageTeams={state.setShowManageTeams}
          teamAMembers={state.teamAMembers}
          teamBMembers={state.teamBMembers}
          unassignedMembers={state.unassignedMembers}
        />

        <ActionButtons
          selectedPlan={selectedPlan}
          isParticipant={state.isParticipant}
          showJoinDirect={state.showJoinDirect}
          alreadySkipped={state.alreadySkipped}
          isFull={state.isFull}
          isWaitlist={state.isWaitlist}
          isHost={state.isHost}
          isJoiningDirect={state.isJoiningDirect}
          isRejoining={state.isRejoining}
          isSkipping={state.isSkipping}
          showTeams={state.showTeams}
          handleJoinDirect={state.handleJoinDirect}
          handleRejoin={state.handleRejoin}
          handleSkip={state.handleSkip}
          setShowLeaveConfirm={state.setShowLeaveConfirm}
          setShowDitchConfirm={state.setShowDitchConfirm}
          setShowCompletionFlow={state.setShowCompletionFlow}
          setShowManageTeams={state.setShowManageTeams}
          onNavigateToPlanChat={onNavigateToPlanChat}
          setSelectedMemoryPlan={setSelectedMemoryPlan}
          onClose={onClose}
          navigatingToChatRef={state.navigatingToChatRef}
        />
      </div>

      {/* Organizer modals */}
      {state.showManageTeams && (
        <TeamOrganizerModal
          planId={selectedPlan.id}
          userProfile={userProfile}
          activeUserId={activeUserId}
          onClose={() => state.setShowManageTeams(false)}
        />
      )}

      <AnimatePresence>
        {state.showCompletionFlow && (
          <PlanCompletionModal
            plan={selectedPlan}
            onClose={() => state.setShowCompletionFlow(false)}
            activeUserId={activeUserId || ""}
            onPublish={() => {
              state.setShowCompletionFlow(false);
              onClose();
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default React.memo(DetailedPlanModal);
