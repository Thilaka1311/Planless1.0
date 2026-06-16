import React, { useState } from 'react';
import { ArrowLeft, Check, Plus, Minus, MapPin, Clock, Calendar, Users, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { Plan } from '../../../core/types';
import { hasUserEnteredDescription } from '../../../shared/modals/DetailedPlanModal';

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
  // State for editable fields
  const [title, setTitle] = useState(plan.title);
  const [category] = useState<'sports' | 'movies' | 'restaurants' | 'custom'>((plan.category as any) || 'sports');
  const [subcategory] = useState<string | null>((plan as any).activity_type || (plan as any).activityType || null);
  
  // Parse date and time if they are in standard template format (e.g., "Wed, 27 May • 08:30 PM" or "Saturday • 8:00 PM")
  const initialTimeStr = plan.time || 'Wed, 27 May • 08:30 PM';
  const parts = initialTimeStr.split('•').map(p => p.trim());
  const initialDate = parts[0] || 'Wed, 27 May';
  const initialTime = parts[1] || '08:30 PM';

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [location, setLocation] = useState(plan.location || '');
  const [capacity, setCapacity] = useState(plan.capacity || plan.maxSpots || 4);
  
  // Custom description lookup or edit
  const getAboutDescription = () => {
    if (hasUserEnteredDescription(plan)) {
      return plan.description || '';
    }
    return '';
  };
  const [description, setDescription] = useState(getAboutDescription());

  // Modal display elements
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);

  // Derive dynamic attending statistics
  const joinedCount = plan.members ? plan.members.filter(m => m.joinState === 'going').length : 1;
  const spotsRemaining = Math.max(0, capacity - joinedCount);

  // Detect which fields changed
  const getChangedFields = () => {
    const list: string[] = [];
    if (title.trim() !== plan.title) list.push('Title');
    const updatedTimeStr = date && time ? `${date} • ${time}` : (date || time || plan.time);
    if (updatedTimeStr !== plan.time) {
      const timeParts = plan.time.split('•').map(p => p.trim());
      const origDate = timeParts[0] || '';
      const origTime = timeParts[1] || '';
      if (date !== origDate) list.push('Date');
      if (time !== origTime) list.push('Time');
    }
    if (location.trim() !== (plan.location || '')) list.push('Location');
    if (description.trim() !== getAboutDescription()) list.push('Description');
    if (capacity !== (plan.capacity || plan.maxSpots)) list.push('Capacity');
    return list;
  };

  const getCategoryImage = (cat: string, sub: string | null) => {
    if (cat === 'sports') {
      switch (sub) {
        case 'football': return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80';
        case 'badminton': return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';
        case 'basketball': return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800';
        case 'tennis': return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=800';
        case 'volleyball': return 'https://images.unsplash.com/photo-1592656094267-764a450233c6?auto=format&fit=crop&q=80&w=800';
        case 'cricket': return 'https://images.unsplash.com/photo-1531415080290-bc98538bd802?auto=format&fit=crop&q=80&w=800';
        default: return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800';
      }
    }
    if (cat === 'movies') {
      return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800';
    }
    if (cat === 'dining' || cat === 'restaurants') {
      return 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800';
    }
    return plan.coverImage || (plan as any).image;
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      alert('Plan title is required.');
      return;
    }

    const changed = getChangedFields();
    if (changed.length > 0) {
      setShowSaveConfirmModal(true);
    } else {
      // Nothing is changed, navigate back directly
      onBack();
    }
  };

  const executeSave = (notify: boolean) => {
    const updatedTimeStr = date && time ? `${date} • ${time}` : (date || time || plan.time);
    const updatedImage = getCategoryImage(category, subcategory);

    const updatedPlan: Plan = {
      ...plan,
      title: title.trim(),
      category,
      time: updatedTimeStr,
      location: location.trim() || 'Spontaneous Spot',
      capacity,
      maxSpots: capacity,
      coverImage: updatedImage,
      description: description.trim(),
    };

    onSave(updatedPlan);
    setShowSaveConfirmModal(false);
  };

  const sportsOptions = [
    { id: 'football', title: 'Football', emoji: '⚽' },
    { id: 'badminton', title: 'Badminton', emoji: '🏸' },
    { id: 'basketball', title: 'Basketball', emoji: '🏀' },
    { id: 'tennis', title: 'Tennis', emoji: '🎾' },
    { id: 'volleyball', title: 'Volleyball', emoji: '🏐' },
    { id: 'cricket', title: 'Cricket', emoji: '🏏' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex-1 flex flex-col h-full bg-[#050505] relative overflow-hidden select-none"
    >
      {/* HEADER SECTION */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/[0.04] bg-[#050505] z-20">
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
            <h2 className="font-sans font-black text-[20px] uppercase tracking-wide text-white truncate leading-tight">
              Edit Plan
            </h2>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5 leading-none">
              Manage your active plan
            </p>
            <p className="text-[11px] font-semibold text-zinc-500 mt-2 flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{joinedCount} attending • {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining</span>
            </p>
          </div>
        </div>
      </div>

      {/* SCROLLABLE FORM FIELDS */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-6 pt-5 pb-44 space-y-5 text-left">
        
        {/* FIELD 1: PLAN TITLE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Plan Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Badminton Session, Sunday Drinks"
            className="w-full bg-[#0E0E12] border border-white/[0.06] focus:border-[#FF6B2C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-semibold transition"
            id="edit-plan-title-input"
          />
        </div>

        {/* FIELD 2: CATEGORY SELECT (LOCKED FOR LIVE ACTIVE STATUS) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C]">
              Category
            </label>
            <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
              <span>🔒 Locked after participants join</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 opacity-60">
            {[
              { id: 'sports', label: 'Sports 🏸' },
              { id: 'movies', label: 'Movies 🎬' },
              { id: 'dining', label: 'Dining 🍴' },
              { id: 'custom', label: 'Custom ✨' }
            ].map((cat) => {
              const matches = category === cat.id || (category === 'restaurants' && cat.id === 'dining');
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center border cursor-not-allowed ${
                    matches
                      ? 'bg-zinc-800/40 border-zinc-700 text-zinc-400'
                      : 'bg-[#0E0E12]/50 border-white/[0.02] text-zinc-650'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 2B: SPORT TYPE (IF SPORTS SELECTED - LOCKED FOR LIVE ACTIVE STATUS) */}
        {category === 'sports' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500">
                Sport Discipline
              </label>
              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                <span>🔒 Locked after participants join</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 opacity-60">
              {sportsOptions.map((sport) => {
                const isSelected = subcategory === sport.id;
                return (
                  <button
                    key={sport.id}
                    type="button"
                    disabled
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border cursor-not-allowed ${
                      isSelected
                        ? 'bg-zinc-800/40 border-zinc-700 text-zinc-400'
                        : 'bg-[#0E0E12]/50 border-white/[0.02] text-zinc-650'
                    }`}
                  >
                    <span>{sport.emoji}</span>
                    <span>{sport.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* REORDERED FIELD 1: DATE */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date</span>
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="e.g., Wed, 27 May"
            className="w-full bg-[#0E0E12] border border-white/[0.06] focus:border-[#FF6B2C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-semibold transition"
          />
        </div>

        {/* REORDERED FIELD 2: TIME */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Time</span>
          </label>
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="e.g., 08:30 PM"
            className="w-full bg-[#0E0E12] border border-white/[0.06] focus:border-[#FF6B2C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-semibold transition"
          />
        </div>

        {/* REORDERED FIELD 3: LOCATION */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Location</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter a turf, venue, cafe..."
            className="w-full bg-[#0E0E12] border border-white/[0.06] focus:border-[#FF6B2C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-semibold transition"
          />
        </div>

        {/* REORDERED FIELD 4: DESCRIPTION (ABOVE CAPACITY NOW) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Description (About Details)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add some details about the plan guidelines..."
            rows={3}
            className="w-full bg-[#0E0E12] border border-white/[0.06] focus:border-[#FF6B2C] rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-zinc-700 font-semibold transition resize-none leading-relaxed"
          />
        </div>

        {/* REORDERED FIELD 5: CAPACITY */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-mono font-black uppercase tracking-widest text-[#FF6B2C] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Capacity</span>
            </label>
            <span className="text-[11px] text-[#FF6B2C] font-mono uppercase font-black tracking-wider">
              {joinedCount} / {capacity} joined
            </span>
          </div>
          <div className="bg-[#0E0E12] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-300">
              Set Plan Capacity Limit
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCapacity(prev => Math.max(joinedCount, prev - 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-zinc-350 cursor-pointer active:scale-90 transition ${
                  capacity <= joinedCount
                    ? 'bg-white/[0.01] border-transparent text-zinc-700 cursor-not-allowed'
                    : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
                title={capacity <= joinedCount ? 'Cannot reduce below actual attending count' : 'Reduce capacity'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-black text-white bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-lg min-w-[70px] text-center">
                {capacity} SPOTS
              </span>
              <button
                type="button"
                onClick={() => setCapacity(prev => Math.min(20, prev + 1))}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] flex items-center justify-center text-zinc-350 cursor-pointer active:scale-90 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* TRUST & CONTEXT */}
        <div className="pt-6 pb-4 flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="text-[10px] font-sans text-zinc-500 font-semibold tracking-wider">
            Last edited 15 minutes ago
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
        </div>

      </div>

      {/* FLOAT SAVE ACTIONS DOCK */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent z-20 space-y-2">
        <button
          type="button"
          onClick={handleSaveClick}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF854F] text-white py-3.5 rounded-xl text-xs font-black tracking-widest uppercase transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#FF6B2C]/10 active:scale-[0.99]"
          id="btn-save-plan"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Save Changes</span>
        </button>

        {onEndPlan && (
          <button
            type="button"
            onClick={() => setShowCancelConfirmModal(true)}
            className="w-full border border-red-500/20 hover:border-red-500/40 bg-red-500/[0.02] hover:bg-red-500/[0.05] text-red-500 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            id="btn-cancel-plan"
          >
            <span>Cancel Plan</span>
          </button>
        )}
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
                className="w-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-zinc-300 py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
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
              <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
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
                className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
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
                className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition cursor-pointer text-center"
              >
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};
