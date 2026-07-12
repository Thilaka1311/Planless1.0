import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface CreateNewCircleButtonProps {
  onClick: () => void;
}

export const CreateNewCircleButton: React.FC<CreateNewCircleButtonProps> = ({ onClick }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // spring transition configs
  const springTransition = {
    type: "spring",
    stiffness: 70,
    damping: 15,
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="relative flex items-center justify-center transition-all duration-350 cursor-pointer active:scale-[0.96] group select-none bg-transparent border-none p-0"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      aria-label="Create New Circle"
    >
      {/* SVG Icon Area (No circular badge container around it) */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 82 82"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Green (Emerald) stroke gradient */}
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          {/* Red (Rose/Crimson) stroke gradient */}
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          {/* Purple (Violet) stroke gradient */}
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* Overlapping Circles converging from edges to center (slightly larger unit coordinates inside 82x82 viewBox) */}
        {/* Top Circle - Green Gradient (starts higher up at cy=15, converges to cy=31) */}
        <motion.circle
          cx="41"
          r="18"
          stroke="url(#greenGrad)"
          strokeWidth="3"
          fill="none"
          initial={{ cy: 15, opacity: 0 }}
          animate={{ cy: 31, opacity: 0.95 }}
          transition={springTransition}
        />

        {/* Bottom Left Circle - Red Gradient (starts further left at cx=12, converges to cx=28) */}
        <motion.circle
          cy="49"
          r="18"
          stroke="url(#redGrad)"
          strokeWidth="3"
          fill="none"
          initial={{ cx: 12, opacity: 0 }}
          animate={{ cx: 28, opacity: 0.95 }}
          transition={springTransition}
        />

        {/* Bottom Right Circle - Purple Gradient (starts further right at cx=70, converges to cx=54) */}
        <motion.circle
          cy="49"
          r="18"
          stroke="url(#purpleGrad)"
          strokeWidth="3"
          fill="none"
          initial={{ cx: 70, opacity: 0 }}
          animate={{ cx: 54, opacity: 0.95 }}
          transition={springTransition}
        />
      </svg>
    </motion.button>
  );
};
