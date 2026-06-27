import React from "react";
import { MapPin, X, Plus, ChevronRight } from "lucide-react";
import { RECENT_PLACES } from "../utils/constants";

interface StepWhereProps {
  localLocation: string;
  setLocalLocation: (loc: string) => void;
  onContinue: () => void;
  cameFromReview?: boolean;
}

export const StepWhere = ({
  localLocation,
  setLocalLocation,
  onContinue,
  cameFromReview = false
}: StepWhereProps) => {
  return (
    <div className="flex-1 flex flex-col px-5 pt-0 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none">Where?</h2>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Choose where everyone meets.</p>
        </div>
        
        <div className="relative mt-1">
          <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#FF6B2C]" />
          <input 
            type="text"
            placeholder="Search venue, turf, café, theatre or address"
            value={localLocation}
            onChange={(e) => setLocalLocation(e.target.value)}
            className="w-full bg-[#111115] border border-white/5 rounded-xl py-3.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/50 transition placeholder-zinc-500 font-medium"
            autoFocus
          />
          {localLocation && (
            <button 
              type="button" 
              onClick={() => setLocalLocation('')}
              className="absolute right-3.5 top-3.5 p-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-350"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-2 pt-1">
          <h4 className="text-[9px] font-mono tracking-wider text-zinc-550 uppercase font-bold block mb-1">Recent Places</h4>
          <div className="grid grid-cols-1 gap-3">
            {RECENT_PLACES.map((place) => {
              const isSelected = localLocation === place;
              return (
                <button 
                  key={place}
                  type="button"
                  onClick={() => setLocalLocation(place)}
                  className={`w-full text-left py-3 px-3.5 rounded-xl text-xs font-semibold select-none transition-all duration-150 border flex items-center justify-between ${
                    isSelected 
                      ? 'bg-[#FF6B2C]/10 border-[#FF6B2C]/30 text-[#FF6B2C]' 
                      : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04] text-zinc-300'
                  }`}
                >
                  <span>{place}</span>
                  <Plus className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF6B2C]' : 'text-zinc-650'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!cameFromReview && (
        <div className="pt-4 mt-auto">
          {!localLocation.trim() && (
            <p className="text-[13px] text-center text-zinc-500 mb-2.5 transition">
              Choose a location to continue
            </p>
          )}
          <button 
            type="button"
            disabled={!localLocation.trim()}
            onClick={onContinue}
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] disabled:bg-zinc-900 disabled:text-zinc-655 text-white py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/5"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
};
