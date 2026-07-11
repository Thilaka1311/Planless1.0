import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface PlanDetailOverviewCardProps {
  planName: string;
  date: string;
  time: string;
  activityType?: string;
  visible: boolean;
  onClose: () => void;
}

export const PlanDetailOverviewCard: React.FC<PlanDetailOverviewCardProps> = ({
  planName,
  date,
  time,
  activityType = 'Sports',
  visible,
  onClose,
}) => {
  // Listen for Escape key to close the overlay
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // Click outside to close
  useEffect(() => {
    if (!visible) return;
    const handleOutsideClick = (e: MouseEvent) => {
      // Find elements with card or toggle button to prevent immediate close on open click
      const target = e.target as HTMLElement;
      if (target.closest('.plan-details-popover') || target.closest('.plan-details-toggle')) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [visible, onClose]);

  // Derive color based on activityType
  const getCategoryColor = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'sports') return '#10B981';
    if (t === 'movies') return '#A78BFA';
    if (t === 'dining') return '#FB7185';
    return '#FFFFFF'; // Custom
  };

  const accentColor = getCategoryColor(activityType);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 6 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="plan-details-popover absolute right-5 top-[60px] w-60 bg-[#1C1C1E]/95 rounded-2xl shadow-2xl backdrop-blur-md z-[60] text-left p-3"
      style={{
        height: 'auto',
        border: `1.5px solid ${accentColor}2A`,
        boxShadow: `0 12px 32px rgba(0,0,0,0.5), 0 0 10px ${accentColor}08`,
      }}
    >
      <div className="flex flex-col gap-1">
        {/* SMALL CATEGORY LABEL */}
        <span 
          className="text-[9px] font-bold tracking-wider uppercase leading-none font-mono"
          style={{ color: accentColor }}
        >
          {activityType} Plan
        </span>
        
        {/* TITLE */}
        <h3 className="text-xs font-bold text-white truncate leading-snug uppercase mt-0.5">
          {planName}
        </h3>
        
        {/* METADATA */}
        <p className="text-[10px] font-semibold text-zinc-400 leading-none mt-0.5">
          {date} • {time}
        </p>
      </div>
    </motion.div>
  );
};
