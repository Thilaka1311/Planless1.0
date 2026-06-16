import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { Plan as ActivePlan } from '../core/types';

interface PlanConfirmedOverlayProps {
  plan: ActivePlan;
  onGoToPlans: () => void;
  onBackToHome: () => void;
}

export const PlanConfirmedOverlay: React.FC<PlanConfirmedOverlayProps> = ({
  plan,
  onGoToPlans,
  onBackToHome,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="absolute inset-0 bg-[#050505] z-50 flex flex-col justify-between p-6 select-none text-center"
    >
      {/* Top spacer to align layout vertically */}
      <div className="w-full h-12"></div>

      {/* Centered Confirmation Section */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-8 my-auto">
        
        {/* Glow-enhanced Success Checkmark Badge (Staged Entrance: 100ms) */}
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ 
            scale: [0.85, 1.06, 1],
            opacity: 1,
          }}
          transition={{ 
            delay: 0.1,
            duration: 0.45, 
            ease: [0.16, 1, 0.3, 1]
          }}
          className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/70 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.35)]"
        >
          <Check className="w-9 h-9 stroke-[3]" />
        </motion.div>

        {/* Text Area */}
        <div className="space-y-4 max-w-xs mx-auto">
          {/* Headline "You're In" (Staged Entrance: 250ms) */}
          <motion.h3 
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3, ease: 'easeOut' }}
            className="font-sans font-black text-[28px] text-white tracking-tight leading-none"
          >
            You're In
          </motion.h3>
          
          {/* Plan context with title, date, time and host (Staged Entrance: 350ms) */}
          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3, ease: 'easeOut' }}
            className="space-y-2 mt-4"
          >
            <div className="text-[17px] text-white font-sans font-extrabold tracking-tight leading-snug">
              {plan.title}
            </div>
            <div className="text-[13px] text-zinc-400 font-sans font-medium tracking-wide">
              {plan.time}
            </div>
            <div className="text-[12.5px] text-zinc-500 font-sans">
              Hosted by <strong className="text-zinc-300 font-semibold">{plan.creatorName || "Host"}</strong>
            </div>
          </motion.div>
        </div>

      </div>

      {/* Primary and Secondary Action CTAs */}
      <div className="w-full pt-6 pb-6 flex flex-col items-center">
        {/* Primary Action Button (Staged Entrance: 500ms) */}
        <motion.button
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.5, 
            type: 'spring', 
            stiffness: 400, 
            damping: 24 
          }}
          onClick={onGoToPlans}
          className="w-full py-4 rounded-full bg-[#FF6B2C] hover:bg-[#FF854C] text-white font-sans font-extrabold text-xs tracking-[0.15em] transition-all duration-200 uppercase cursor-pointer shadow-lg shadow-[#FF6B2C]/20 active:scale-98 border border-[#FF6B2C]/20"
          id="btn-go-to-plans"
        >
          Go To Plans
        </motion.button>

        {/* Secondary Action Link (Staged Entrance: 650ms) */}
        <motion.button
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            delay: 0.65, 
            type: 'spring', 
            stiffness: 400, 
            damping: 24 
          }}
          onClick={onBackToHome}
          className="w-full mt-5 py-2 text-[#94A3B8]/65 hover:text-white font-sans font-black text-[11px] tracking-[0.14em] transition-colors duration-200 uppercase cursor-pointer"
          id="btn-back-to-home"
        >
          Back to Home
        </motion.button>
      </div>
    </motion.div>
  );
};
