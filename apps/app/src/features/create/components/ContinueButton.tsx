import React from 'react';

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  text: string;
}

export const ContinueButton: React.FC<ContinueButtonProps> = ({
  onClick,
  disabled = false,
  text
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '16px 20px',
        background: 'linear-gradient(to top, #000000 80%, rgba(0,0,0,0))',
        zIndex: 40,
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        pointerEvents: 'auto'
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 14,
          border: 'none',
          background: disabled ? 'rgba(255, 255, 255, 0.15)' : '#FFFFFF',
          color: disabled ? 'rgba(255, 255, 255, 0.3)' : '#000000',
          fontSize: 15,
          fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.5)',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif'
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.opacity = '1';
        }}
      >
        {text}
      </button>
    </div>
  );
};
