import React, { useState, useMemo } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Plan } from '../../../core/types';
import { hasUserEnteredDescription } from '../../../shared/modals/DetailedPlanModal';
import { usePlansStore } from '../state/PlansContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { getCategoryImage } from '../../create/utils/constants';
import { ManageParticipantsScreen } from './ManageParticipantsScreen';
import { EditablePlanPreviewCard } from '../components/EditablePlanPreviewCard';

interface EditPlanScreenProps {
  plan: Plan;
  onBack: () => void;
  onSave: (updatedPlan: Plan) => void;
  onEndPlan?: (planId: string) => void;
}

export const EditPlanScreen: React.FC<EditPlanScreenProps> = ({
  plan,
  onBack,
  onSave,
  onEndPlan,
}) => {
  const { plans } = usePlansStore();
  const { userProfile, activeUserId } = useProfileStore();

  const livePlan = useMemo(() => {
    return plans.find(p => p.id === plan.id || p.dbUuid === plan.dbUuid) || plan;
  }, [plans, plan]);

  // State for editable fields
  const [title, setTitle] = useState(plan.title);
  const [category] = useState<'sports' | 'movies' | 'restaurants' | 'custom'>((plan.category as any) || 'sports');
  const [subcategory] = useState<string | null>((plan as any).activity_type || (plan as any).activityType || null);
  
  const getInitialEventDateTime = () => {
    if (plan.datetime) {
      const d = new Date(plan.datetime);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const [eventDateTime, setEventDateTime] = useState<Date>(getInitialEventDateTime);
  const [location, setLocation] = useState(plan.location || '');
  const [cost, setCost] = useState(plan.cost || 0);

  const getAboutDescription = () => {
    if (hasUserEnteredDescription(plan)) {
      return plan.description || '';
    }
    return '';
  };
  const [description, setDescription] = useState(getAboutDescription());

  // RSVP deadline logic unified with Create Plan
  const [rsvpDeadlineOption, setRsvpDeadlineOption] = useState<string>(() => {
    if (!plan.response_deadline_at) return '12 hours before';
    const diffMs = getInitialEventDateTime().getTime() - new Date(plan.response_deadline_at).getTime();
    const diffHours = Math.round(diffMs / (60 * 60 * 1000));
    if (diffHours === 1) return '1 hour before';
    if (diffHours === 12) return '12 hours before';
    if (diffHours === 24) return '24 hours before';
    return 'Custom';
  });

  const [customDeadline, setCustomDeadline] = useState<Date>(() => {
    if (plan.response_deadline_at) {
      const d = new Date(plan.response_deadline_at);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date(getInitialEventDateTime().getTime() - 12 * 60 * 60 * 1000);
  });

  // Calculate actual RSVP deadline value
  const rsvpDeadline = useMemo(() => {
    if (rsvpDeadlineOption === 'Custom') {
      return customDeadline;
    }
    let hoursOffset = 12;
    if (rsvpDeadlineOption === '1 hour before') hoursOffset = 1;
    else if (rsvpDeadlineOption === '12 hours before') hoursOffset = 12;
    else if (rsvpDeadlineOption === '24 hours before') hoursOffset = 24;
    
    return new Date(eventDateTime.getTime() - hoursOffset * 60 * 60 * 1000);
  }, [eventDateTime, rsvpDeadlineOption, customDeadline]);

  // Modal display elements
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showManageParticipants, setShowManageParticipants] = useState(false);

  const isHostUser = useMemo(() => {
    const hostUuid = livePlan.hostId;
    return hostUuid === activeUserId || hostUuid === userProfile?.dbUuid;
  }, [livePlan.hostId, activeUserId, userProfile]);

  const goingCount = livePlan.members ? livePlan.members.filter(m => m.joinState === 'going').length : 0;
  const waitlistedCount = livePlan.members ? livePlan.members.filter(m => m.joinState === 'waitlist').length : 0;
  const invitedCount = livePlan.members ? livePlan.members.filter(m => m.joinState === 'delivered' || m.joinState === 'seen').length : 0;

  // Detect which fields changed
  const getChangedFields = () => {
    const list: string[] = [];
    if (title.trim() !== livePlan.title) list.push('Title');
    if (eventDateTime.getTime() !== new Date(livePlan.datetime || livePlan.time).getTime()) list.push('Date & Time');
    if (location.trim() !== (livePlan.location || '')) list.push('Location');
    if (description.trim() !== getAboutDescription()) list.push('Description');
    if (cost !== (livePlan.cost || 0)) list.push('Cost');
    const oldDeadline = livePlan.response_deadline_at ? new Date(livePlan.response_deadline_at).getTime() : 0;
    if (rsvpDeadline.getTime() !== oldDeadline) list.push('RSVP Deadline');
    return list;
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      alert('Plan title is required.');
      return;
    }

    const now = new Date();
    if (eventDateTime < now) {
      alert("Event time cannot be in the past.");
      return;
    }

    if (rsvpDeadline > eventDateTime) {
      alert("RSVP Deadline cannot be after the plan start time.");
      return;
    }

    const changed = getChangedFields();
    if (changed.length > 0) {
      setShowSaveConfirmModal(true);
    } else {
      onBack();
    }
  };

  const executeSave = (notify: boolean) => {
    const updatedTimeStr = eventDateTime.toISOString();
    const updatedImage = getCategoryImage(category, subcategory);

    const updatedPlan: Plan = {
      ...livePlan,
      title: title.trim(),
      category,
      time: updatedTimeStr,
      datetime: updatedTimeStr,
      response_deadline_at: rsvpDeadline.toISOString(),
      location: location.trim() || 'Spontaneous Spot',
      coverImage: updatedImage,
      description: description.trim(),
      cost: cost,
    };

    onSave(updatedPlan);
    setShowSaveConfirmModal(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      className="flex-1 flex flex-col h-full bg-[#030303] relative overflow-hidden select-none"
    >
      {/* HEADER SECTION */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.03] bg-[#030303] z-20 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition active:scale-95 cursor-pointer flex-shrink-0"
            id="edit-plan-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-left min-w-0">
            <h2 className="font-display font-bold text-[22px] tracking-tight text-white leading-tight">
              Edit Plan
            </h2>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-5 pt-6 pb-36 space-y-6 text-left">
        
        {/* EDITABLE EVENT PREVIEW CARD */}
        <EditablePlanPreviewCard
          title={title}
          setTitle={setTitle}
          location={location}
          setLocation={setLocation}
          eventDateTime={eventDateTime}
          setEventDateTime={setEventDateTime}
          rsvpDeadlineOption={rsvpDeadlineOption}
          setRsvpDeadlineOption={setRsvpDeadlineOption}
          customDeadline={customDeadline}
          setCustomDeadline={setCustomDeadline}
          cost={cost}
          setCost={setCost}
          description={description}
          setDescription={setDescription}
          creatorName={livePlan.creatorName || 'You'}
        />

        {/* 2. Compact Participant Summary Status Row */}
        <div className="flex items-center justify-between border-t border-white/[0.04] pt-4 select-none">
          <div className="text-zinc-400 text-xs font-semibold">
            <span>{goingCount} Going</span>
            <span className="mx-2 text-zinc-600 font-bold">•</span>
            <span>{waitlistedCount} Waitlisted</span>
            <span className="mx-2 text-zinc-600 font-bold">•</span>
            <span>{invitedCount} Invited</span>
          </div>
          <button
            type="button"
            onClick={() => setShowManageParticipants(true)}
            className="text-[10px] font-mono font-black uppercase tracking-wider text-[#FF6B2C] bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 px-3.5 py-1.5 rounded-full cursor-pointer hover:bg-[#FF6B2C]/15 transition"
          >
            Manage Participants
          </button>
        </div>

        {/* 3. Standalone Cancel Plan Button */}
        {onEndPlan && (
          <div className="flex justify-center pt-2 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => setShowCancelConfirmModal(true)}
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 hover:text-red-300 bg-red-950/10 border border-red-955/20 px-4 py-2.5 rounded-xl transition cursor-pointer"
              id="btn-cancel-plan"
            >
              Cancel Plan
            </button>
          </div>
        )}

      </div>

      {/* FLOAT SAVE ACTIONS DOCK (STICKY SAVE BAR) */}
      <div className="shrink-0 p-4 border-t border-white/[0.03] bg-gradient-to-b from-[#08080C]/80 to-[#030305]/95 backdrop-blur-xl z-20 flex gap-3 shadow-2xl">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] text-zinc-350 py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSaveClick}
          className="flex-[2] bg-[#FF6B2C] hover:bg-[#FF854F] text-white py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF6B2C]/10 active:scale-[0.98]"
          id="btn-save-plan"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowSaveConfirmModal(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-xs"
          />
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 max-w-xs w-full z-10 space-y-4 shadow-2xl relative text-left">
            <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider text-center">
              You're updating this plan
            </h3>
            
            <div className="space-y-2 py-1">
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#FF6B2C] font-black">
                Changes:
              </p>
              <div className="bg-[#050505] p-3 rounded-xl border border-white/[0.04] space-y-1.5">
                {getChangedFields().map((field) => (
                  <div key={field} className="text-xs text-zinc-300 font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
                    <span>{field}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed text-center pt-2 font-medium">
                Notify participants about these changes?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => executeSave(true)}
                className="w-full bg-[#FF6B2C] hover:bg-[#FF854F] text-white py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
              >
                Notify & Save
              </button>
              <button
                type="button"
                onClick={() => executeSave(false)}
                className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-350 py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
              >
                Save Without Notification
              </button>
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="w-full py-2 text-[10px] font-sans font-black tracking-wider uppercase text-zinc-500 hover:text-zinc-400 cursor-pointer text-center font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL PLAN CONFIRMATION DIALOG */}
      {showCancelConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowCancelConfirmModal(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-xs"
          />
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 max-w-xs w-full z-10 space-y-4 shadow-2xl relative text-left">
            <h3 className="font-sans font-black text-sm text-white uppercase tracking-wider text-center">
              Cancel this plan?
            </h3>
            
            <div className="space-y-2 py-1">
              <p className="text-[11px] text-zinc-455 font-semibold leading-relaxed">
                This action will:
              </p>
              <div className="bg-[#050505] p-3 rounded-xl border border-white/[0.04] space-y-2.5">
                <div className="text-xs text-red-400 font-semibold flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>Remove the plan from active feeds</span>
                </div>
                <div className="text-xs text-red-400 font-semibold flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>Notify all participants</span>
                </div>
                <div className="text-xs text-red-400 font-semibold flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>Close the plan thread</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-350 py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  if (onEndPlan) {
                    onEndPlan(livePlan.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-650 text-white py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE PARTICIPANTS SCREEN */}
      <AnimatePresence>
        {showManageParticipants && (
          <ManageParticipantsScreen
            plan={livePlan}
            onBack={() => setShowManageParticipants(false)}
          />
        )}
      </AnimatePresence>

    </motion.div>
  );
};
