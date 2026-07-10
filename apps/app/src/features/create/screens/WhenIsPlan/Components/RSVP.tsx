import React from 'react';
import { ChevronRight, UserCheck } from 'lucide-react';

export interface RSVPProps {
  selectedValue: string | null; // e.g., '1 hour', '12 hours', '24 hours' or null
  onChange: (value: string | null) => void;
  isExpanded: boolean;
  onToggle: () => void;
  hasError?: boolean;
  errorText?: string | null;
}

export const RSVP: React.FC<RSVPProps> = ({ selectedValue, onChange, isExpanded, onToggle, hasError, errorText }) => {
  const options = ['< 1 Hour', '< 12 Hours', '< 24 Hours'];

  const headerLabel = selectedValue 
    ? `Respond by: ${selectedValue}`
    : 'Respond by: Plan start time';

  return (
    <div
      className="when-is-plan-card"
      style={{
        borderRadius: 8,
        background: '#18181B', // zinc-900 charcoal
        border: hasError ? '1px solid #EF4444' : '1px solid #27272A', // zinc-800
        overflow: 'hidden',
        height: isExpanded ? 236 : 48,
        transition: 'height 0.28s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease-in-out',
        willChange: 'height',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden'
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          height: 48,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <UserCheck className="w-5 h-5 text-zinc-400 shrink-0" />
          <span 
            style={{ 
              fontSize: 14, 
              fontFamily: 'Inter, sans-serif', 
              fontWeight: 600, 
              color: '#FFFFFF', // color-text-primary
              lineHeight: 1.2 
            }}
          >
            Respond by:
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 550, color: 'rgba(255, 255, 255, 0.4)' }}>
            {selectedValue ? selectedValue.replace('<', '').trim() : "Plan Start"}
          </span>
        </div>
      </button>

      {/* Inline RSVP Options Panel */}
      <div
        style={{
          minHeight: 0,
          opacity: isExpanded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out, visibility 0.2s ease-in-out',
          visibility: isExpanded ? 'visible' : 'hidden',
          background: '#18181B', // zinc-900 charcoal
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '8px 16px 6px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
          {options.map((opt, idx) => {
            const isSelected = selectedValue === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onChange(null);
                  } else {
                    onChange(opt);
                  }
                }}
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 6,
                  border: 'none',
                  background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#A1A1AA',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Radio Indicator */}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #FFFFFF' : '2px solid #71717A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                      }}
                    />
                  )}
                </div>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {/* Dynamic Helper explanation text or Error Message */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 38, boxSizing: 'border-box' }}>
          {!hasError ? (
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.2 }}>
              {(() => {
                if (!selectedValue) return "Friends can respond until the plan starts.";
                const clean = selectedValue.replace('<', '').trim();
                const lowerCase = clean.toLowerCase();
                return `Friends can respond until ${lowerCase} before the plan starts.`;
              })()}
            </p>
          ) : (
            /* Embedded Validation Error Text in the exact same slot */
            errorText && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textAlign: 'center', fontFamily: 'Inter, sans-serif', lineHeight: 1.35, display: 'inline-block', maxWidth: '90%' }}>
                {errorText}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};
