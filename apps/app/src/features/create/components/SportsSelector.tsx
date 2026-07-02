import React from "react";
import { ArrowLeft } from "lucide-react";
import { PLAN_COVER_IMAGES } from "../../plans/config/planCoverImages";

interface SportsSelectorProps {
  onSelectSubcategory: (sub: 'football' | 'badminton') => void;
  onBack: () => void;
}

export const SportsSelector = ({ onSelectSubcategory, onBack }: SportsSelectorProps) => {
  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full text-left">
      <div className="flex-1 flex flex-col px-5 pt-3.5 pb-24 animate-fade-in justify-between overflow-y-auto scrollbar-none">
        
        <div className="flex flex-col">
          <div className="mb-3 text-left">
            <button 
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 text-xs text-zinc-550 hover:text-white py-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FF6B2C]" />
              <span className="font-semibold">Back</span>
            </button>
          </div>

          <div className="mb-6 mt-1 text-left">
            <h2 className="font-display font-semibold text-[32px] leading-tight tracking-tight text-white mb-1.5">
              What's the <span className="italic font-serif text-[#FF6B2C] font-semibold">game?</span>
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed font-semibold">
              Choose the sport you're organizing.
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 justify-start">
          {[
            { 
              id: 'football' as const, 
              title: 'Football', 
              emoji: '⚽', 
              image: PLAN_COVER_IMAGES.football
            },
            { 
              id: 'badminton' as const, 
              title: 'Badminton', 
              emoji: '🏸', 
              image: PLAN_COVER_IMAGES.badminton
            }
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectSubcategory(item.id)}
              className="group rounded-[28px] relative overflow-hidden bg-zinc-950 border border-white/5 transition-all duration-300 cursor-pointer h-[150px] flex-shrink-0 flex flex-col justify-start pt-7 px-7 pb-5 shadow-lg scale-100 hover:scale-[1.01]"
            >
              <img 
                src={item.image} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-300 brightness-[0.85] group-hover:brightness-[0.95]"
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-black/25 z-0"></div>
              
              <div className="relative z-10 flex items-center gap-2.5 text-left">
                <span className="text-2xl select-none leading-none">{item.emoji}</span>
                <h3 className="font-display font-bold text-[24px] tracking-tight text-white leading-none">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
