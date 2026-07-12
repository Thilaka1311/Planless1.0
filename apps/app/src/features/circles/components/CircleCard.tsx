import React from 'react';
import { CircleAvatar } from '../../../shared/components/CircleAvatar';

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
  const photoUrl = circle.groupPhoto || circle.groupImage;
  
  return (
    <div 
      onClick={onClick}
      className="w-full bg-transparent hover:bg-zinc-900/50 py-3.5 px-6 transition-all duration-200 cursor-pointer flex items-center justify-between group select-none border-b border-zinc-900/50"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {/* Circle photo avatar - perfectly round chat avatar style */}
        <div className="w-[52px] h-[52px] rounded-full overflow-hidden border border-zinc-800 shadow-sm flex-shrink-0 relative bg-zinc-950">
          <CircleAvatar 
            src={photoUrl} 
            alt={circle.name} 
            size="w-full h-full"
            className="object-cover relative z-0 scale-100 transition-transform duration-300"
          />
        </div>
        
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {/* Header row with Name and Time */}
          <div className="flex justify-between items-baseline w-full">
            {/* Circle Name */}
            <h3 className="font-sans font-semibold text-[15px] tracking-tight text-white/90 group-hover:text-white transition-colors duration-200 leading-tight truncate">
              {circle.name}
            </h3>
            
            {/* Relative Time (aligns to WhatsApp list format in top-right area) */}
            {circle.lastPlanTime && (
              <span className="text-zinc-500 font-sans text-[11px] font-normal tracking-wide shrink-0 ml-2">
                {circle.lastPlanTime}
              </span>
            )}
          </div>
          
          {/* Subtitle row with last plan status */}
          <div className="font-sans text-[13px] mt-1.5 flex items-center justify-between w-full min-w-0 select-none">
            {circle.lastPlan && circle.lastPlan !== 'No plans yet' ? (
              <p className="text-zinc-400 font-normal truncate leading-snug flex-1 pr-4">
                {circle.lastPlan}
              </p>
            ) : (
              <p className="text-zinc-650 font-normal truncate leading-snug flex-1 pr-4">
                No plans yet
              </p>
            )}
            
            {/* Custom glowing unread-style badge indicators matching WhatsApp screenshot */}
            {circle.lastPlan && circle.lastPlan !== 'No plans yet' && (
              <span className="w-5 h-5 rounded-full bg-[#10B981]/25 border border-[#10B981]/40 flex items-center justify-center text-[10px] text-[#10B981] font-bold shrink-0">
                1
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
