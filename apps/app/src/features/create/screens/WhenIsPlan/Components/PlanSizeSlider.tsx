import React, { useState, useRef, useEffect } from 'react';

interface PlanSizeSliderProps {
  value: number | undefined;
  onChange: (val: number) => void;
  hasError: boolean;
  min?: number;
  max?: number;
}

export const PlanSizeSlider: React.FC<PlanSizeSliderProps> = ({
  value,
  onChange,
  hasError,
  min = 0,
  max = 51,
}) => {
  // undefined = sentinel (–1 / unset): render at far left so visual matches the "–" count
  const currentVal = value !== undefined ? value : 0;
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Constants
  const minVal = min;
  const maxVal = max;
  const percent = maxVal > minVal ? ((currentVal - minVal) / (maxVal - minVal)) * 100 : 0;
  
  // Sports Green themed color (#1ED760)
  const themeColor = hasError ? '#EF4444' : '#1ED760';

  const updateValueFromCoords = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const width = rect.width;
    const relativeX = clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, relativeX / width));
    
    // Map fraction linearly between minVal and maxVal
    const rawVal = minVal + fraction * (maxVal - minVal);
    const roundedVal = Math.round(rawVal);
    onChange(roundedVal);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValueFromCoords(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      updateValueFromCoords(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      updateValueFromCoords(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        updateValueFromCoords(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      className="w-full select-none relative" 
      style={{ 
        paddingTop: 36, // leave room for floating value bubble
        paddingBottom: 12 
      }}
    >
      {/* ── Floating Value Bubble ── */}
      <div
        style={{
          position: 'absolute',
          top: -2,
          left: `calc(${percent}% - 23px)`,
          width: 46,
          height: 30,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDragging ? 1 : 0,
          transform: isDragging ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(6px)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: themeColor,
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            textAlign: 'center',
            minWidth: 32,
            whiteSpace: 'nowrap'
          }}
        >
          {value === undefined ? '–' : (currentVal === 51 && maxVal === 51 ? '> 50' : currentVal)}
        </div>
        {/* Triangle Arrow */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `5px solid ${themeColor}`,
            marginTop: -1
          }}
        />
      </div>

      {/* ── Slider Track Container ── */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          height: 7,
          width: '100%',
          borderRadius: 999,
          background: '#27272A', // dark zinc/graphite
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Filled Track portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${percent}%`,
            background: hasError 
              ? 'linear-gradient(to right, #F87171, #EF4444)' 
              : 'linear-gradient(to right, #22C55E, #1ED760)',
            boxShadow: hasError
              ? '0 0 6px rgba(239, 68, 68, 0.4)'
              : '0 0 8px rgba(30, 215, 96, 0.5)',
            borderRadius: 999,
            transition: isDragging ? 'none' : 'width 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
          }}
        />

        {/* Custom Thumb */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${percent}% - 12px)`,
            top: '50%',
            transform: `translateY(-50%) scale(${isDragging ? 1.15 : 1})`,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: `3px solid ${themeColor}`,
            boxShadow: isDragging 
              ? `0 0 12px ${themeColor}, 0 4px 8px rgba(0,0,0,0.5)`
              : `0 0 4px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.4)`,
            cursor: 'grab',
            zIndex: 5,
            transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.25s, box-shadow 0.25s'
          }}
        />
      </div>
    </div>
  );
};
