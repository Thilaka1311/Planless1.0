import React, { useRef } from "react";
import { Calendar, Clock, ChevronRight, Check } from "lucide-react";

interface StepWhenProps {
  localDate: string;
  setLocalDate: (date: string) => void;
  localTime: string;
  setLocalTime: (time: string) => void;
  rsvpDeadline: string;
  setRsvpDeadline: (deadline: string) => void;
  customDeadline: string;
  setCustomDeadline: (deadline: string) => void;
  onContinue: () => void;
}

export const StepWhen = ({
  localDate,
  setLocalDate,
  localTime,
  setLocalTime,
  rsvpDeadline,
  setRsvpDeadline,
  customDeadline,
  setCustomDeadline,
  onContinue
}: StepWhenProps) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  // Helper date format text for display card
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

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return 'Pick date';
    const dateObj = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[dateObj.getDay()];
    const monthName = months[dateObj.getMonth()];
    const dayNum = dateObj.getDate();
    return `${dayName}, ${monthName} ${dayNum}`;
  };

  const formatFriendlyTime = (timeStr: string) => {
    if (!timeStr) return 'Pick time';
    const [hour, minute] = timeStr.split(':');
    const hh = hour.padStart(2, '0');
    const mm = minute.padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Format deadline to "Today/Tomorrow/Yesterday • HH:mm" or "MMM D • HH:mm"
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
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 min-h-0 animate-fade-in overflow-y-auto scrollbar-none justify-start">
      <div className="space-y-5 flex-1">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">When?</h2>
          <p className="text-[#8e8e93] text-[13px] mt-1.5 font-medium leading-relaxed">Choose the plan timing.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-1">
          {/* DATE CARD CONTAINER */}
          <div className="bg-[#111115] border border-white/5 hover:border-white/10 rounded-[22px] p-3.5 flex items-center justify-between min-h-[72px] relative transition-all duration-150 ease-out active:scale-[0.98] active:opacity-85 overflow-hidden select-none outline-none focus-within:ring-1 focus-within:ring-[#FF6B2C]">
            <div className="flex items-center gap-2.5 w-full min-w-0">
              <div className="p-1.5 bg-[#FF6B2C]/10 rounded-lg shrink-0">
                <Calendar className="w-4 h-4 text-[#FF6B2C]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 font-bold block mb-0.5">Date</span>
                <span className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-snug whitespace-nowrap">
                  {localDate ? formatFriendlyDate(localDate) : 'Pick date'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1.5" />
            <input 
              ref={dateInputRef}
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [color-scheme:dark]"
            />
          </div>
          
          {/* TIME CARD CONTAINER */}
          <div className="bg-[#111115] border border-white/5 hover:border-white/10 rounded-[22px] p-3.5 flex items-center justify-between min-h-[72px] relative transition-all duration-150 ease-out active:scale-[0.98] active:opacity-85 overflow-hidden select-none outline-none focus-within:ring-1 focus-within:ring-[#FF6B2C]">
            <div className="flex items-center gap-2.5 w-full min-w-0">
              <div className="p-1.5 bg-[#FF6B2C]/10 rounded-lg shrink-0">
                <Clock className="w-4 h-4 text-[#FF6B2C]" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 font-bold block mb-0.5">Time</span>
                <span className="text-[13.5px] sm:text-[14.5px] font-semibold text-white leading-snug whitespace-nowrap">
                  {localTime ? formatFriendlyTime(localTime) : 'Pick time'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0 ml-1.5" />
            <input 
              ref={timeInputRef}
              type="time"
              value={localTime}
              onChange={(e) => setLocalTime(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* SELECTED TIME CONFIRMATION CARD */}
        <div className="bg-[#111115]/55 border border-white/5 rounded-[22px] py-3.5 px-4.5 flex items-center justify-between transition-all duration-300">
          <div className="flex flex-col space-y-0.5 text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-550 font-bold block mb-0.5">SELECTED TIME</span>
            <h3 className="text-[16.5px] font-bold text-zinc-100 leading-tight">
              {localDate ? formatDate(localDate) : 'Not selected'}
            </h3>
            <p className="text-[#FF6B2C] text-[14.5px] font-semibold leading-normal">
              {localTime ? formatTime(localTime) : '—'}
            </p>
          </div>
          
          <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/15 shrink-0 ml-4">
            <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
          </div>
        </div>

        {/* RSVP DEADLINE SELECTION (Inline) */}
        <div className="bg-[#111115]/55 border border-white/5 rounded-[22px] p-4 text-left space-y-3 mt-1.5 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-zinc-400 font-medium leading-none">Choose when people must respond</span>
            <span className="text-[10.5px] text-zinc-500 font-semibold text-right leading-none">
              {formatDeadline(getDeadlineDate(localDate, localTime, rsvpDeadline, customDeadline))}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: '1 hour before', label: '1H' },
              { id: '12 hours before', label: '12H' },
              { id: '24 hours before', label: '24H' },
              { id: 'Custom', label: 'Custom' }
            ].map((option) => {
              const isSelected = rsvpDeadline === option.id;
              return (
                <button 
                  key={option.id}
                  type="button"
                  onClick={() => setRsvpDeadline(option.id)}
                  className={`flex-1 min-w-[70px] text-center py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-150 border select-none cursor-pointer ${
                    isSelected 
                      ? 'bg-[#FF6B2C] border-[#FF6B2C] text-[#050505] shadow-[0_0_12px_rgba(255,107,44,0.25)]' 
                      : 'bg-[#111115]/80 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {rsvpDeadline === 'Custom' && (
            <div className="bg-[#111115] border border-white/5 rounded-xl p-3 animate-fade-in mt-2">
              <span className="text-[9px] font-mono uppercase text-zinc-500 block mb-1 font-bold">Custom Deadline</span>
              <input 
                type="datetime-local"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                className="w-full bg-transparent text-white border-none p-0 text-xs focus:outline-none focus:ring-0 cursor-pointer font-bold [color-scheme:dark]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 mt-5">
        <button 
          type="button"
          onClick={onContinue}
          className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-4 rounded-2xl font-semibold text-sm tracking-wider uppercase transition-all duration-250 flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 active:scale-[0.985] cursor-pointer"
        >
          <span>Continue</span>
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
