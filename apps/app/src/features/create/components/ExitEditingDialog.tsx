import React, { useRef } from 'react';

const KEYFRAMES = `
@keyframes ag-sheet-rise {
  from { transform: translateY(100%); opacity: 0.7; }
  to   { transform: translateY(0);    opacity: 1;   }
}
`;

interface ExitEditingDialogProps {
  visible: boolean;
  onKeepEditing: () => void;
  onStopEditing: () => void;
}

export const ExitEditingDialog: React.FC<ExitEditingDialogProps> = ({
  visible,
  onKeepEditing,
  onStopEditing,
}) => {
  // Inject keyframes once
  const injected = useRef(false);
  if (!injected.current && typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    injected.current = true;
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0, 0, 0, 0.82)', transition: 'background-color 0.25s ease' }}
      onClick={onKeepEditing}
    >
      {/* Bottom sheet matching Planless surface elevated dialog styling */}
      <div
        style={{
          background: '#1A1A1A', // color-surface-elevated
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', // color-border
          padding: '24px 24px 48px',
          animation: 'ag-sheet-rise 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Warning Icon Box */}
        <div
          style={{
            width: 44, height: 44,
            background: 'rgba(239, 68, 68, 0.1)', // Subtle danger tint
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 22, fontWeight: 700, color: '#FFFFFF',
            marginBottom: 8, letterSpacing: '-0.02em',
          }}
        >
          Stop editing?
        </h2>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, lineHeight: 1.45,
            color: '#A1A1AA', // color-text-secondary
            marginBottom: 32,
          }}
        >
          Do you want to stop editing or keep editing this plan?
        </p>

        {/* Keep Editing — primary CTA button */}
        <button
          type="button"
          onClick={onKeepEditing}
          style={{
            display: 'block', width: '100%',
            height: 48, marginBottom: 12,
            borderRadius: 8, border: 'none',
            background: '#FFFFFF', // color-action-primary
            color: '#000000',
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          Keep Editing
        </button>

        {/* Stop Editing — secondary action button */}
        <button
          type="button"
          onClick={onStopEditing}
          style={{
            display: 'block', width: '100%',
            height: 48,
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.08)', // color-border
            color: '#EF4444', // color-danger
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
        >
          Stop Editing
        </button>
      </div>
    </div>
  );
};
