import React from 'react';
import { ChevronRight } from 'lucide-react';

interface StepWhatProps {
  localTitle: string;
  setLocalTitle: (title: string) => void;
  selectedCategory: 'sports' | 'movies' | 'dining' | 'custom';
  selectedSubcategory: 'football' | 'badminton' | null;
  localLocation: string;
  localDate: string;
  localTime: string;
  totalInvitedCount: number;
  selectedCircles: string[];
  selectedFriends: any[];
  waitlistEnabled: boolean;
  waitlistCapacity: number;
  rsvpDeadline: string;
  customDeadline: string;
  costAmount: number;
  quickNote: string;
  isSubmitting: boolean;
  handleHostPlanSubmit: () => Promise<void>;
  setCustomizerStep: (step: number) => void;
}

export const StepWhat: React.FC<StepWhatProps> = ({
  localTitle,
  setLocalTitle,
  selectedCategory,
  selectedSubcategory,
  localLocation,
  localDate,
  localTime,
  totalInvitedCount,
  selectedCircles,
  selectedFriends,
  waitlistEnabled,
  waitlistCapacity,
  rsvpDeadline,
  customDeadline,
  costAmount,
  quickNote,
  isSubmitting,
  handleHostPlanSubmit,
  setCustomizerStep,
}) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Not set';
    const [hour, minute] = timeStr.split(':');
    const hh = hour.padStart(2, '0');
    const mm = minute.padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatDeadline = (date: Date | null) => {
    if (!date || isNaN(date.getTime())) return '—';
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
      
    let dayPart = '';
    if (isSameDay(date, today)) {
      dayPart = 'Today';
    } else if (isSameDay(date, tomorrow)) {
      dayPart = 'Tomorrow';
    } else if (isSameDay(date, yesterday)) {
      dayPart = 'Yesterday';
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dayPart = `${months[date.getMonth()]} ${date.getDate()}`;
    }
    
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    
    return `${dayPart} • ${hh}:${mm}`;
  };

  const getDeadlineDate = (dateStr: string, timeStr: string, deadlineOption: string, customVal: string) => {
    if (deadlineOption === 'Custom') {
      return customVal ? new Date(customVal) : null;
    }
    if (!dateStr || !timeStr) return null;
    const combinedStr = `${dateStr}T${timeStr}:00`;
    const planDate = new Date(combinedStr);
    
    let hoursOffset = 12;
    if (deadlineOption === '1 hour before') hoursOffset = 1;
    else if (deadlineOption === '3 hours before') hoursOffset = 3;
    else if (deadlineOption === '6 hours before') hoursOffset = 6;
    else if (deadlineOption === '12 hours before') hoursOffset = 12;
    else if (deadlineOption === '24 hours before') hoursOffset = 24;
    
    return new Date(planDate.getTime() - hoursOffset * 60 * 60 * 1000);
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Review Plan</h2>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Give your plan a title and review details.</p>
        </div>

        <div className="bg-[#111115] border border-[#FF6B2C]/30 focus-within:border-[#FF6B2C] rounded-xl p-3 flex flex-col transition-all text-left">
          <span className="text-[8px] font-mono uppercase text-[#FF6B2C] font-bold block mb-1.5">PLAN TITLE</span>
          <input 
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="e.g. Saturday Football Match"
            className="bg-transparent text-white border-none p-0 text-xs font-bold focus:outline-none focus:ring-0 w-full"
          />
        </div>

        <div className="space-y-1">
          {[
            { key: 'activity', label: 'Activity', value: selectedSubcategory ? `${selectedSubcategory.charAt(0).toUpperCase() + selectedSubcategory.slice(1)}` : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`, step: 0 },
            { key: 'location', label: 'Location', value: localLocation || 'Not set', step: 0 },
            { key: 'datetime', label: 'Date & Time', value: `${formatDate(localDate)} at ${formatTime(localTime)}`, step: 1 },
            { key: 'invited', label: 'Invited Circle', value: `${totalInvitedCount} invited (${selectedCircles.length} circles, ${selectedFriends.length} friends)`, step: 2 },
            { key: 'waitlist', label: 'Waitlist', value: waitlistEnabled ? `${waitlistCapacity} spots` : 'Disabled', step: 2 },
            { key: 'deadline', label: 'Response Deadline', value: formatDeadline(getDeadlineDate(localDate, localTime, rsvpDeadline, customDeadline)), step: 1 },
            { key: 'cost', label: 'Cost Split', value: costAmount > 0 ? `₹${costAmount} (${quickNote || 'Pay at venue'})` : 'Free entry', step: 3 },
          ].map((row) => (
            <button 
              key={row.key}
              type="button"
              onClick={() => setCustomizerStep(row.step)}
              className="w-full text-left py-2.5 px-3 bg-[#111115]/30 hover:bg-[#111115]/70 rounded-xl flex items-center justify-between border border-white/[0.02] hover:border-white/5 transition-all text-xs"
            >
              <div className="flex flex-col text-left">
                <span className="text-[8.5px] font-semibold text-zinc-550 uppercase tracking-wider leading-none mb-1">{row.label}</span>
                <span className="text-zinc-200 font-bold truncate max-w-[245px]">{row.value}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-555 mr-0.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-auto">
        <button 
          type="button"
          disabled={isSubmitting}
          onClick={handleHostPlanSubmit}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <span>Posting...</span>
          ) : (
            <>
              <span>Post Plan</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
