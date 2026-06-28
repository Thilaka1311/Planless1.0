import React from 'react';

interface InterlockingRingsIconProps {
  className?: string;
  strokeWidth?: number;
  withPlus?: boolean;
}

export const InterlockingRingsIcon: React.FC<InterlockingRingsIconProps> = ({ 
  className = "w-6 h-6", 
  strokeWidth = 2, 
  withPlus = false 
}) => {
  return (
    <svg 
      viewBox="0 0 32 20" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left Ring */}
      <circle 
        cx="11" 
        cy="10" 
        r="7" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        fill="none" 
      />
      {/* Right Ring */}
      <circle 
        cx="21" 
        cy="10" 
        r="7" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        fill="none" 
      />
      {/* Top intersection overlay of Left Ring (angles -75 to 75 deg on a r=7 circle centered at 11,10) */}
      <path 
        d="M 12.2 3.1 A 7 7 0 0 1 17.9 8.8" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        fill="none" 
        strokeLinecap="round" 
      />
      {/* Integrated Plus indicator in top right */}
      {withPlus && (
        <path 
          d="M 26 5 H 30 M 28 3 V 7" 
          stroke="currentColor" 
          strokeWidth={strokeWidth + 0.4} 
          strokeLinecap="round" 
        />
      )}
    </svg>
  );
};
