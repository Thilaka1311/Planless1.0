import React from 'react';
import { InterlockingRingsIcon } from './InterlockingRingsIcon';

interface CircleMember {
  id: string;
  name: string;
  avatar: string;
  status: string;
}

interface Circle {
  id: string;
  name: string;
  tagline?: string;
  groupPhoto?: string;
  groupImage?: string;
  lastPlan?: string;
  lastPlanTime?: string;
  members?: CircleMember[];
  avatars?: string[];
}

interface CircleCardProps {
  circle: Circle;
  onClick: () => void;
}

export const CircleCard: React.FC<CircleCardProps> = ({ circle, onClick }) => {
  const photoUrl = circle.groupPhoto || circle.groupImage || (circle.avatars && circle.avatars[0]);
  const hasPhoto = !!photoUrl;
  
  return (
    <div 
      onClick={onClick}
      className="w-full bg-[#0A0A0C] hover:bg-[#121215] border border-white/[0.04] rounded-2xl py-2.5 px-4 transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-[0.99] select-none"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Circular cover photo or default logo with cohesive dark cinematic overlay */}
        {hasPhoto ? (
          <div className="w-[74px] h-[74px] rounded-full overflow-hidden border border-white/[0.06] shadow-md flex-shrink-0 relative bg-zinc-950">
            <div className="absolute inset-0 bg-black/45 z-10"></div>
            <img 
              src={photoUrl} 
              alt={circle.name} 
              className="w-full h-full object-cover brightness-[0.7] contrast-[1.1] relative z-0 scale-100 group-hover:scale-105 transition-transform duration-200"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-[74px] h-[74px] rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-[#FF6B2C] shadow-md flex-shrink-0 select-none">
            <InterlockingRingsIcon className="w-9 h-9" strokeWidth={2.0} />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          {/* Circle Name as primary heading */}
          <h3 className="font-display font-bold text-[14px] uppercase tracking-wider text-zinc-150 group-hover:text-white transition-colors">
            {circle.name}
          </h3>
          
          {/* Most recent plan name underneath with status dot indicator */}
          <div className="font-sans text-xs mt-0.5 flex items-center gap-1.5 min-w-0 select-none">
            {circle.lastPlan && circle.lastPlan !== 'No plans yet' ? (
              <>
                <span className="w-[5px] h-[5px] rounded-full bg-[#FF6B2C] flex-shrink-0"></span>
                <span className="text-zinc-300 font-medium truncate">{circle.lastPlan}</span>
              </>
            ) : (
              <>
                <span className="w-[5px] h-[5px] rounded-full bg-zinc-850 flex-shrink-0"></span>
                <span className="text-zinc-555 font-normal truncate">No plans yet</span>
              </>
            )}
          </div>

          {/* Relative time beneath the plan name */}
          {circle.lastPlanTime && (
            <div className="text-zinc-650 font-sans text-[10px] mt-0.5 font-normal">
              {circle.lastPlanTime}
            </div>
          )}
        </div>
      </div>

      {/* Elegantly placed rightward Chevron text indicator */}
      <div className="text-white/20 group-hover:text-white/60 group-active:text-white/100 group-hover:translate-x-0.5 transition-all text-[11px] font-sans font-bold flex-shrink-0 ml-3.5 select-none">
        →
      </div>
    </div>
  );
};
