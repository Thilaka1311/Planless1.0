import React, { useState, useRef, useEffect } from 'react';
import { Calendar, MapPin, IndianRupee, FileText, Plus, Clock } from 'lucide-react';
import { formatDateTimeStandard, toLocalISOString } from '../../../shared/components/NativeDateTimeField';

interface EditablePlanPreviewCardProps {
  title: string;
  setTitle: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  eventDateTime: Date;
  setEventDateTime: (date: Date) => void;
  rsvpDeadlineOption: string;
  setRsvpDeadlineOption: (opt: string) => void;
  customDeadline: Date;
  setCustomDeadline: (date: Date) => void;
  cost: number;
  setCost: (val: number) => void;
  description: string;
  setDescription: (val: string) => void;
  creatorName: string;
}

export const EditablePlanPreviewCard: React.FC<EditablePlanPreviewCardProps> = ({
  title,
  setTitle,
  location,
  setLocation,
  eventDateTime,
  setEventDateTime,
  rsvpDeadlineOption,
  setRsvpDeadlineOption,
  customDeadline,
  setCustomDeadline,
  cost,
  setCost,
  description,
  setDescription,
  creatorName,
}) => {
  // Inline editing toggle states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingCost, setIsEditingCost] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);

  // Input refs for autofocus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const costInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingLocation) locationInputRef.current?.focus();
  }, [isEditingLocation]);

  useEffect(() => {
    if (isEditingCost) costInputRef.current?.focus();
  }, [isEditingCost]);

  useEffect(() => {
    if (isEditingNotes) notesTextareaRef.current?.focus();
  }, [isEditingNotes]);

  // Minimum bounds for date pickers
  const minEventStr = toLocalISOString(new Date());
  const maxRsvpStr = toLocalISOString(eventDateTime);

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent p-5 relative overflow-hidden shadow-xl text-left select-none space-y-4">
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#FF6B2C]/5 blur-3xl pointer-events-none" />

      {/* 1. Title Row */}
      <div className="min-h-[36px] flex items-center">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
            placeholder="Plan Title"
            className="w-full bg-white/[0.04] border border-[#FF6B2C]/30 rounded-xl px-3 py-1.5 text-xl font-sans font-black text-white focus:outline-none focus:border-[#FF6B2C]/60"
          />
        ) : (
          <h3
            onClick={() => setIsEditingTitle(true)}
            className="font-sans font-black text-2xl text-white tracking-tight leading-snug truncate hover:bg-white/[0.03] rounded-lg px-2 -mx-2 transition cursor-pointer flex-1"
          >
            {title.trim() || 'Untitled Plan'}
          </h3>
        )}
      </div>

      <p className="text-[11px] font-sans font-medium text-zinc-500">
        Hosted by <strong className="text-zinc-300 font-semibold">{creatorName || 'You'}</strong>
      </p>

      {/* Divider */}
      <div className="h-px bg-white/[0.04] w-full" />

      {/* event fields rows */}
      <div className="space-y-4 text-xs text-zinc-300">
        
        {/* 2. Location Row */}
        <div 
          onClick={() => { if (!isEditingLocation) setIsEditingLocation(true); }}
          className="flex items-center gap-3 hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition cursor-pointer min-h-[38px]"
        >
          <MapPin className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider font-bold">Location</p>
            {isEditingLocation ? (
              <input
                ref={locationInputRef}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => setIsEditingLocation(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingLocation(false); }}
                placeholder="To be determined / Spontaneous"
                className="w-full bg-white/[0.04] border border-[#FF6B2C]/30 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/60 font-semibold"
              />
            ) : (
              <p className="text-zinc-200 font-semibold truncate mt-0.5">
                {location.trim() || 'TBD / Spontaneous'}
              </p>
            )}
          </div>
        </div>

        {/* 3. Date & Time Row */}
        <div className="relative flex items-center gap-3 hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition cursor-pointer">
          <Calendar className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-mono text-zinc-550 uppercase tracking-wider font-bold">Date & Time</p>
            <p className="text-zinc-200 font-semibold truncate mt-0.5">{formatDateTimeStandard(eventDateTime)}</p>
          </div>
          <input
            type="datetime-local"
            value={toLocalISOString(eventDateTime)}
            min={minEventStr}
            onChange={(e) => {
              if (e.target.value) {
                setEventDateTime(new Date(e.target.value));
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [color-scheme:dark]"
          />
        </div>

        {/* 4. RSVP Row (Single Horizontal line layout) */}
        <div className="flex items-center justify-between border-t border-white/[0.02] pt-2 min-h-[36px]">
          <div className="flex items-center gap-1.5 select-none">
            <Clock className="w-3.5 h-3.5 text-[#FF6B2C] flex-shrink-0" />
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-wider font-bold">RSVP</span>
          </div>

          <div className="flex gap-1.5">
            {[
              { id: '1 hour before', label: '1 Hour' },
              { id: '12 hours before', label: '12 Hours' },
              { id: '24 hours before', label: '24 Hours' },
              { id: 'Custom', label: 'Custom' }
            ].map((option) => {
              const isSelected = rsvpDeadlineOption === option.id;
              const isCustom = option.id === 'Custom';
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (!isCustom) {
                      setRsvpDeadlineOption(option.id);
                    }
                  }}
                  className={`relative text-center py-1.5 px-3 rounded-full text-[10px] font-bold transition border select-none cursor-pointer ${
                    isSelected 
                      ? 'bg-[#FF6B2C] border-[#FF6B2C] text-[#050505] shadow-[0_0_8px_rgba(255,107,44,0.2)]' 
                      : 'bg-white/[0.015] border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                  {isCustom && (
                    <input
                      type="datetime-local"
                      value={toLocalISOString(customDeadline)}
                      max={maxRsvpStr}
                      onChange={(e) => {
                        if (e.target.value) {
                          setRsvpDeadlineOption('Custom');
                          setCustomDeadline(new Date(e.target.value));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 [color-scheme:dark]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Cost Row */}
        <div 
          onClick={() => { if (!isEditingCost) setIsEditingCost(true); }}
          className="flex items-center gap-3 hover:bg-white/[0.03] rounded-xl p-2 -mx-2 transition cursor-pointer min-h-[38px] border-t border-white/[0.02] pt-2"
        >
          <IndianRupee className="w-4 h-4 text-[#FF6B2C] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-mono text-zinc-555 uppercase tracking-wider font-bold">Cost per person</p>
            {isEditingCost ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-zinc-400 font-semibold">₹</span>
                <input
                  ref={costInputRef}
                  type="number"
                  value={cost || ''}
                  onChange={(e) => setCost(Math.max(0, parseInt(e.target.value) || 0))}
                  onBlur={() => setIsEditingCost(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingCost(false); }}
                  placeholder="Free"
                  className="w-20 bg-white/[0.04] border border-[#FF6B2C]/30 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/60 font-mono font-bold"
                />
              </div>
            ) : (
              <p className="text-zinc-200 font-semibold mt-0.5">
                {cost > 0 ? `₹${Number(cost).toFixed(2)} per person` : 'Free'}
              </p>
            )}
          </div>
        </div>

        {/* 6. Description / Notes Row */}
        <div className="border-t border-white/[0.04] pt-3 mt-2">
          <div 
            onClick={() => setIsNotesExpanded(!isNotesExpanded)}
            className="flex items-center gap-2 text-zinc-450 hover:text-white transition cursor-pointer select-none"
          >
            <FileText className="w-3.5 h-3.5 text-[#FF6B2C] flex-shrink-0" />
            <span className="text-[10px] font-mono font-black uppercase tracking-wider">
              Notes {isNotesExpanded ? '▲' : '▼'}
            </span>
          </div>

          {isNotesExpanded && (
            <div className="mt-2 text-left bg-white/[0.01] border border-white/[0.03] rounded-xl p-3">
              {isEditingNotes ? (
                <textarea
                  ref={notesTextareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setIsEditingNotes(false)}
                  placeholder="Add venue specifics, guidelines, or details..."
                  rows={3}
                  className="w-full bg-transparent border-0 text-xs text-zinc-200 focus:outline-none placeholder-zinc-700 font-medium resize-none leading-relaxed"
                />
              ) : (
                <div 
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs text-zinc-300 min-h-[30px] font-medium leading-relaxed cursor-pointer hover:bg-white/[0.02] p-1 rounded transition"
                >
                  {description.trim() ? (
                    description
                  ) : (
                    <span className="text-zinc-600 italic font-normal flex items-center gap-1.5">
                      <Plus className="w-3 h-3 text-[#FF6B2C]" /> Add Notes...
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
EditablePlanPreviewCard.displayName = 'EditablePlanPreviewCard';
