import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  pulseIcon?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search", 
  pulseIcon = false 
}) => {
  return (
    <div className="relative mb-5.5 w-full">
      <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#6B6B72]">
        <Search className={`w-5 h-5 ${pulseIcon ? 'animate-pulse' : ''}`} strokeWidth={1.8} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-11 pr-10 bg-[#0E0E10]/95 backdrop-blur-md border border-[#1A1A1A] rounded-[24px] text-zinc-100 placeholder-[#6B6B72] text-sm font-sans focus:outline-none focus:border-zinc-800 transition-colors select-text"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
