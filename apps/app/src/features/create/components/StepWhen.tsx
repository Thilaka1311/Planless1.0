import React from "react";
import { ChevronRight } from "lucide-react";
import { NativeDateTimeField, formatDateTimeStandard } from "../../shared/components/NativeDateTimeField";

interface StepWhenProps {
  eventDateTime: Date;
  setEventDateTime: (date: Date) => void;
  rsvpDeadline: string;
  setRsvpDeadline: (deadline: string) => void;
  customDeadline: Date;
  setCustomDeadline: (deadline: Date) => void;
  onContinue: () => void;
  cameFromReview?: boolean;
}

export const StepWhen: React.FC<StepWhenProps> = ({
  eventDateTime,
  setEventDateTime,
  rsvpDeadline,
  setRsvpDeadline,
  customDeadline,
  setCustomDeadline,
  onContinue,
  cameFromReview = false
}) => {

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

  const getDeadlineDate = (eventDate: Date, deadlineOption: string, customVal: Date) => {
    if (deadlineOption === 'Custom') {
      return customVal;
    }
    if (!eventDate || isNaN(eventDate.getTime())) return null;
    
    let hoursOffset = 12;
    if (deadlineOption === '1 hour before') hoursOffset = 1;
    else if (deadlineOption === '3 hours before') hoursOffset = 3;
    else if (deadlineOption === '6 hours before') hoursOffset = 6;
    else if (deadlineOption === '12 hours before') hoursOffset = 12;
    else if (deadlineOption === '24 hours before') hoursOffset = 24;
    
    return new Date(eventDate.getTime() - hoursOffset * 60 * 60 * 1000);
  };

  const currentDeadlineVal = getDeadlineDate(eventDateTime, rsvpDeadline, customDeadline);

  return (
    <div className="flex-1 flex flex-col px-5 pt-3 pb-6 min-h-0 animate-fade-in overflow-y-auto scrollbar-none justify-start">
      <div className="space-y-5 flex-1">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">When?</h2>
          <p className="text-[#8e8e93] text-[13px] mt-1.5 font-medium leading-relaxed">Choose the plan timing.</p>
        </div>
        
        <div className="mt-1">
          {/* Native combined picker */}
          <NativeDateTimeField
            value={eventDateTime}
            onChange={setEventDateTime}
            label="Event Date & Time"
            minimumDate={new Date()}
          />
        </div>

        {/* RSVP DEADLINE SELECTION (Inline) */}
        <div className="bg-[#111115]/55 border border-white/5 rounded-[22px] p-4 text-left space-y-3 mt-1.5 select-none">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-zinc-400 font-medium leading-none">Choose when people must respond</span>
            <span className="text-[10.5px] text-[#FF6B2C] font-semibold text-right leading-none">
              {formatDeadline(currentDeadlineVal)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: '1 hour before', label: '1 Hour' },
              { id: '12 hours before', label: '12 Hours' },
              { id: '24 hours before', label: '24 Hours' },
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
            <div className="mt-3">
              <NativeDateTimeField
                value={customDeadline}
                onChange={setCustomDeadline}
                label="Custom RSVP Deadline"
                maximumDate={eventDateTime}
              />
            </div>
          )}
        </div>
      </div>

      {!cameFromReview && (
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
      )}
    </div>
  );
};
