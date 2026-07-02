import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Check, ChevronRight, Calendar, Hourglass, MapPin, IndianRupee, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Plan, NotificationItem } from '../../../core/types';
import { usePlansStore } from '../state/PlansContext';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';
import { useToast } from '../../../shared/contexts/ToastContext';
import { formatDateTimeStandard, toLocalISOString } from '../../../shared/components/NativeDateTimeField';
import { getCategoryImage } from '../../create/utils/constants';
import { UserAvatar } from '../../../shared/components/UserAvatar';
import { ParticipantToggleBar } from '../components/ParticipantToggleBar';
import { ManageParticipantsScreen } from './ManageParticipantsScreen';
import { supabase } from '../../../lib/supabaseClient';

interface EditPlanScreenProps {
  planId: string;
  onBack: () => void;
  onSave: (updatedPlan: Plan) => void;
  onEndPlan?: (planId: string) => void;
}

export const EditPlanScreen: React.FC<EditPlanScreenProps> = ({
  planId,
  onBack,
  onSave,
  onEndPlan,
}) => {
  const { plans } = usePlansStore();
  const livePlan = useMemo(() => plans.find(p => p.id === planId || p.dbUuid === planId), [plans, planId]);

  if (!livePlan) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505]">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-[#ff8b66] animate-spin" />
        <p className="text-zinc-500 text-xs mt-3 font-mono">Loading plan…</p>
      </div>
    );
  }

  return (
    <EditPlanForm
      plan={livePlan}
      onBack={onBack}
      onSave={onSave}
      onEndPlan={onEndPlan}
    />
  );
};

interface EditPlanFormProps {
  plan: Plan;
  onBack: () => void;
  onSave: (updatedPlan: Plan) => void;
  onEndPlan?: (planId: string) => void;
}

const EditPlanForm: React.FC<EditPlanFormProps> = ({
  plan,
  onBack,
  onSave,
  onEndPlan,
}) => {
  const { circles } = useCirclesStore();
  const { userProfile } = useProfileStore();
  const { showToast } = useToast();

  const selectedCategory = plan.category === "restaurants" ? "dining" : (plan.category || "custom");
  const selectedSubcategory = plan.subcategory || null;

  // Form states matching EditPlan screen values
  const [title, setTitle] = useState(plan.title || '');
  const [description, setDescription] = useState(plan.description || '');
  const [location, setLocation] = useState(plan.location || '');
  const [cost, setCost] = useState(plan.cost || 0);

  const getInitialEventDateTime = () => {
    if (plan.datetime) {
      const d = new Date(plan.datetime);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const [eventDateTime, setEventDateTime] = useState<Date>(getInitialEventDateTime);
  const [rsvpDeadlineOption, setRsvpDeadlineOption] = useState<string>(() => {
    if (!plan.response_deadline_at) return '1 hour before';
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

  const [customCoverImage, setCustomCoverImage] = useState<string | null>(plan.coverImage || null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal displays
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showManageParticipants, setShowManageParticipants] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // RSVP deadline computation logic
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

  // Resolve associated circle if any
  const selectedCircleObj = useMemo(() => {
    const circleId = plan.groupId || plan.circleId || (plan as any).circle_id;
    if (circleId) {
      return circles.find(c => c.id === circleId || c.circle_id === circleId);
    }
    return null;
  }, [plan, circles]);

  const selectedCircleName = selectedCircleObj?.name || "Custom Plan";

  // Re-build mock plan for live preview card/ParticipantToggleBar binding
  const mockPlan = useMemo(() => {
    return {
      ...plan,
      title: title.toUpperCase(),
      location: location,
      coverImage: customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory),
      cost: cost,
      description: description,
      time: formatDateTimeStandard(eventDateTime),
      datetime: eventDateTime.toISOString(),
      response_deadline_at: rsvpDeadline.toISOString(),
    };
  }, [plan, title, location, customCoverImage, selectedCategory, selectedSubcategory, cost, description, eventDateTime, rsvpDeadline]);

  // Image customizer handlers
  const handleOpenImageDialog = () => {
    setShowImageDialog(true);
  };

  const handleUseDefaultImage = () => {
    setCustomCoverImage(null);
    setShowImageDialog(false);
    showToast("Using default activity cover");
  };

  const handleUseGroupPhoto = () => {
    const circlePhoto = selectedCircleObj?.groupPhoto || selectedCircleObj?.groupImage || selectedCircleObj?.cover_image || (selectedCircleObj as any)?.coverImage;
    if (circlePhoto) {
      setCustomCoverImage(circlePhoto);
      showToast("Using group profile photo");
    } else {
      showToast("No profile photo found for this circle");
    }
    setShowImageDialog(false);
  };

  const handleChooseCustomImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        showToast("Unsupported file type. Please upload JPG, PNG, or WEBP.");
        return;
      }

      showToast("Uploading cover image...");
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const userUuid = userProfile?.dbUuid || plan.hostId;
        if (!userUuid) {
          throw new Error("User UUID not found for upload path");
        }
        const fileName = `${userUuid}/plan_cover_${Date.now()}.${fileExt}`;
        
        const { data, error: uploadErr } = await supabase.storage
          .from("profile-images")
          .upload(fileName, file, {
            contentType: file.type,
            upsert: true,
          });

        if (uploadErr || !data) {
          throw new Error(uploadErr?.message || "Upload failed");
        }

        const { data: { publicUrl } } = supabase.storage
          .from("profile-images")
          .getPublicUrl(data.path);

        setCustomCoverImage(publicUrl);
        showToast("Cover image updated successfully!");
      } catch (err: any) {
        console.error("Error uploading plan cover image:", err);
        showToast("Failed to upload image. Please try again.");
      }
    }
    setShowImageDialog(false);
  };

  // Detect which fields changed
  const getChangedFields = () => {
    const list: string[] = [];
    if (title.trim() !== plan.title) list.push('Title');
    if (eventDateTime.getTime() !== new Date(plan.datetime || plan.time).getTime()) list.push('Date & Time');
    if (location.trim() !== (plan.location || '')) list.push('Location');
    if (description.trim() !== (plan.description || '')) list.push('Notes');
    if (cost !== (plan.cost || 0)) list.push('Cost');
    if (customCoverImage !== (plan.coverImage || null)) list.push('Cover Image');
    const oldDeadline = plan.response_deadline_at ? new Date(plan.response_deadline_at).getTime() : 0;
    if (rsvpDeadline.getTime() !== oldDeadline) list.push('RSVP Deadline');
    return list;
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      showToast("Plan title is required.");
      return;
    }

    const now = new Date();
    if (eventDateTime < now) {
      showToast("Event time cannot be in the past.");
      return;
    }

    if (rsvpDeadline > eventDateTime) {
      showToast("RSVP Deadline cannot be after the plan start time.");
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
    const updatedPlan: Plan = {
      ...plan,
      title: title.trim(),
      time: updatedTimeStr,
      datetime: updatedTimeStr,
      response_deadline_at: rsvpDeadline.toISOString(),
      location: location.trim() || 'Spontaneous Spot',
      coverImage: customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory),
      description: description.trim(),
      cost: cost,
    };

    onSave(updatedPlan);
    setShowSaveConfirmModal(false);
  };

  const isTitleEmpty = !title.trim();
  const minEventStr = toLocalISOString(new Date());

  return (
    <div className="flex-1 flex flex-col justify-between h-full bg-[#050505] text-left relative overflow-hidden">
      
      {/* Scrollable content simulating the Detailed Plan card */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
        
        {/* Cover image header block */}
        <div 
          onClick={handleOpenImageDialog}
          className="relative h-[225px] shrink-0 w-full overflow-hidden flex flex-col justify-end cursor-pointer group"
        >
          <img 
            src={customCoverImage || getCategoryImage(selectedCategory, selectedSubcategory)} 
            alt="Preview cover" 
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.8] contrast-110 group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {/* Overlay info to hint clicking to edit */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
            <span className="bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-sans font-black text-white tracking-[0.12em] uppercase border border-white/10 shadow-lg">
              Tap to Change Image
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/40 to-transparent z-0" />

          {/* Hero Meta Info */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="px-6 pb-4 z-10 w-full relative"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-black/55 backdrop-blur-md px-4.5 py-1.5 rounded-full text-[11px] font-sans font-black text-white tracking-[0.16em] inline-flex items-center justify-center uppercase border border-white/[0.08] shadow-2xl select-none">
                {selectedCircleName.toUpperCase()}
              </span>
            </div>

            {/* Editable Title input directly within card title hierarchy */}
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tap to add title..."
              className="font-sans font-black text-[26px] text-white tracking-tight leading-none bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full placeholder-white/40 text-left"
            />

            {/* Hosted By Mini Badge */}
            <div className="flex items-center gap-2 mt-2">
              <UserAvatar
                src={userProfile?.avatar || userProfile?.avatarUrl}
                alt={userProfile?.name || "Host"}
                size="w-5 h-5"
                className="border border-white/10"
              />
              <span className="text-[11.5px] text-zinc-300 font-medium">
                Hosted by <strong className="text-white font-semibold">{userProfile?.name || "You"}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Notes (About/Description block) */}
        <div className="px-6 py-3.5 bg-[#111115]/30 border border-white/[0.03] rounded-2xl mx-6 mb-2 mt-4 text-left">
          <span className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase block mb-1">
            Notes (Optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, instructions, or rules..."
            className="w-full bg-transparent border-none p-0 text-xs text-zinc-300 font-medium placeholder-zinc-650 focus:outline-none focus:ring-0 resize-none h-16 scrollbar-none"
          />
        </div>

        {/* Plan Configuration/Timing rows */}
        <div className="px-6 space-y-3.5 mt-4">
          
          {/* Timing Row */}
          <div className="relative bg-[#111115]/20 border border-white/[0.03] p-4.5 rounded-2xl flex items-center justify-between text-left group overflow-hidden">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#FF6B2C]" />
              <div className="min-w-0">
                <span className="text-[9px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase block leading-none mb-1">
                  Timing
                </span>
                <span className="text-[13px] font-semibold text-zinc-300 font-sans">
                  {formatDateTimeStandard(eventDateTime)}
                </span>
              </div>
            </div>
            {/* Native local datetime overlay */}
            <input 
              type="datetime-local"
              value={toLocalISOString(eventDateTime)}
              min={minEventStr}
              onChange={(e) => {
                if (e.target.value) {
                  setEventDateTime(new Date(e.target.value));
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
            />
          </div>

          {/* RSVP Deadline Row */}
          <div className="relative bg-[#111115]/20 border border-white/[0.03] p-4.5 rounded-2xl flex items-center justify-between text-left overflow-hidden">
            <div className="flex items-center gap-3 w-full">
              <Hourglass className="w-5 h-5 text-[#FF6B2C]" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase block leading-none mb-1">
                  Respond By
                </span>
                {rsvpDeadlineOption === 'Custom' ? (
                  <div className="relative flex items-center justify-between w-full">
                    <span className="text-[13px] font-semibold text-zinc-300 font-sans">
                      {formatDateTimeStandard(customDeadline)}
                    </span>
                    <input 
                      type="datetime-local"
                      value={toLocalISOString(customDeadline)}
                      max={toLocalISOString(eventDateTime)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCustomDeadline(new Date(e.target.value));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full pointer-events-auto"
                    />
                  </div>
                ) : (
                  <select
                    value={rsvpDeadlineOption}
                    onChange={(e) => setRsvpDeadlineOption(e.target.value)}
                    className="bg-transparent border-none text-[13px] font-semibold text-zinc-300 font-sans p-0 m-0 focus:ring-0 focus:outline-none cursor-pointer w-full"
                  >
                    <option value="1 hour before" className="bg-[#121216]">1 hour before</option>
                    <option value="12 hours before" className="bg-[#121216]">12 hours before</option>
                    <option value="24 hours before" className="bg-[#121216]">24 hours before</option>
                    <option value="Custom" className="bg-[#121216]">Custom...</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Location Row */}
          <div className="bg-[#111115]/20 border border-white/[0.03] p-4.5 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3 w-full">
              <MapPin className="w-5 h-5 text-[#FF6B2C]" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase block leading-none mb-1">
                  Location
                </span>
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where are you meeting?"
                  className="bg-transparent border-none text-[13px] font-semibold text-zinc-300 font-sans p-0 m-0 focus:ring-0 focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Entry Fee Row */}
          <div className="bg-[#111115]/20 border border-white/[0.03] p-4.5 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3 w-full">
              <IndianRupee className="w-5 h-5 text-[#FF6B2C]" />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-sans font-black tracking-[0.14em] text-zinc-550 uppercase block leading-none mb-1">
                  Entry Fee
                </span>
                <div className="flex items-center">
                  <span className="text-zinc-500 font-bold mr-1 text-[13px]">₹</span>
                  <input 
                    type="number"
                    value={cost === 0 ? '' : cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    placeholder="Free"
                    className="bg-transparent border-none text-[13px] font-semibold text-zinc-300 font-sans p-0 m-0 focus:ring-0 focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Live replica of the ParticipantToggleBar from the feed */}
        <div className="relative mt-6">
          <ParticipantToggleBar
            plan={mockPlan}
            userProfile={userProfile!}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setSelectedParticipantForActions={() => setShowManageParticipants(true)}
          />
        </div>
      </div>

      {/* Floating CTA footer at the bottom of the Edit screen */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#050505]/90 backdrop-blur-md border-t border-white/5 z-20 shadow-2xl flex gap-3">
        {onEndPlan && (
          <button
            type="button"
            onClick={() => setShowCancelConfirmModal(true)}
            className="flex-1 bg-red-950/20 border border-red-900/30 hover:bg-red-900/25 text-red-400 py-4 rounded-2xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center cursor-pointer active:scale-[0.98]"
          >
            Cancel Plan
          </button>
        )}
        <button
          type="button"
          disabled={isTitleEmpty}
          onClick={handleSaveClick}
          className="flex-[2] bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-4 rounded-2xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
        >
          <span>Save Changes</span>
        </button>
      </div>

      {/* SAVE CHANGES CONFIRMATION MODAL */}
      {showSaveConfirmModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-[28px] w-full max-w-[280px] p-5 text-center shadow-2xl relative text-left">
            <h3 className="text-white text-sm font-black uppercase tracking-wider text-center mb-1.5">
              Confirm changes
            </h3>
            <p className="text-zinc-400 text-[10.5px] font-semibold text-center mb-4 leading-normal">
              Notify participants about these updates?
            </p>
            
            <div className="bg-[#050505] p-3 rounded-xl border border-white/[0.04] space-y-1.5 mb-4 max-h-24 overflow-y-auto">
              {getChangedFields().map((field) => (
                <div key={field} className="text-xs text-zinc-300 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B2C]" />
                  <span>{field}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => executeSave(true)}
                className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer text-center"
              >
                Notify & Save
              </button>
              <button
                type="button"
                onClick={() => executeSave(false)}
                className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer text-center"
              >
                Save silently
              </button>
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="w-full text-zinc-400 hover:text-white py-2 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer text-center"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL PLAN CONFIRMATION DIALOG */}
      {showCancelConfirmModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-[28px] w-full max-w-[280px] p-5 text-center shadow-2xl relative text-left">
            <h3 className="text-white text-sm font-black uppercase tracking-wider text-center mb-1.5">
              Cancel this plan?
            </h3>
            <p className="text-zinc-400 text-[10.5px] font-semibold text-center mb-4 leading-normal">
              This action will remove the plan and notify guests.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirmModal(false)}
                className="bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer text-center"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirmModal(false);
                  if (onEndPlan) {
                    onEndPlan(plan.id);
                  }
                }}
                className="bg-red-500 hover:bg-red-650 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer text-center"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightweight Image Selection Dialog Overlay */}
      {showImageDialog && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-[28px] w-full max-w-[280px] p-5 text-center shadow-2xl relative">
            <h3 className="text-white text-sm font-black uppercase tracking-wider mb-1.5">Customize Cover</h3>
            <p className="text-zinc-400 text-[10.5px] font-semibold mb-4 leading-normal">
              Select how you want to display the plan's cover image.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleUseDefaultImage}
                className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
              >
                Use Default Image
              </button>
              {selectedCircleObj && (
                <button
                  type="button"
                  onClick={handleUseGroupPhoto}
                  className="w-full bg-[#1A1A22] hover:bg-[#22222E] border border-white/5 text-white py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
                >
                  Use Group Photo
                </button>
              )}
              <button
                type="button"
                onClick={handleChooseCustomImage}
                className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-2.5 rounded-xl text-xs font-bold transition uppercase tracking-wide cursor-pointer"
              >
                Choose Custom Image
              </button>
              <button
                type="button"
                onClick={() => setShowImageDialog(false)}
                className="w-full text-zinc-400 hover:text-white py-2 rounded-xl text-xs font-bold transition uppercase tracking-wide mt-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for custom cover image */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* MANAGE PARTICIPANTS SCREEN */}
      <AnimatePresence>
        {showManageParticipants && (
          <ManageParticipantsScreen
            planId={plan.id}
            onBack={() => setShowManageParticipants(false)}
          />
        )}
      </AnimatePresence>
      
    </div>
  );
};
