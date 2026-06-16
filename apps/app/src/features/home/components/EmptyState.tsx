import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  description?: React.ReactNode;
  py?: string;
  variant?: "dashed" | "default";
  title?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  description,
  py,
  variant,
  title,
}) => {
  if (variant === "dashed") {
    return (
      <div className={`border border-dashed border-white/[0.08] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-[#0A0A0C]/25 ${py || ""}`}>
        {icon || (
          <div className="flex items-center justify-center w-10 h-10 relative text-[#FF6B2C]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M12 3 C12 8, 8 12, 3 12 C8 12, 12 16, 12 21 C12 16, 16 12, 21 12 C16 12, 12 8, 12 3 Z" />
            </svg>
          </div>
        )}
        {title && (
          <h4 className="text-xs font-display font-black text-white uppercase tracking-wider">
            {title}
          </h4>
        )}
        <p className="text-zinc-550 text-[11px] font-sans max-w-[220px] leading-relaxed">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6 select-none animate-fade-in bg-[#020202] h-full ${py || ""}`}>
      {icon ? (
        <div className="flex items-center justify-center mb-2 text-zinc-400 text-3xl font-medium">
          {icon}
        </div>
      ) : (
        /* Concave sparkle star SVG matching the screenshot exactly */
        <div className="flex items-center justify-center w-12 h-12 mb-2 relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF6B2C"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-11 h-11"
          >
            <path d="M12 3 C12 8, 8 12, 3 12 C8 12, 12 16, 12 21 C12 16, 16 12, 21 12 C16 12, 12 8, 12 3 Z" />
            <circle cx="6.5" cy="17.5" r="1.2" fill="#FF6B2C" stroke="none" />
          </svg>
        </div>
      )}

      <p className="text-zinc-400 font-sans text-[14.5px] leading-relaxed max-w-[280px] font-medium">
        {description || (
          <>
            You have joined all active spontaneous plans! Head to the{" "}
            <span className="text-[#FF6B2C] font-extrabold cursor-pointer">Circles</span> or{" "}
            <span className="text-[#FF6B2C] font-extrabold cursor-pointer">Plans</span> tab to view and
            coordinate.
          </>
        )}
      </p>
    </div>
  );
};
