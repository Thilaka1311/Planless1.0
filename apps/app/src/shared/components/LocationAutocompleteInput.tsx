import React, { useState, useEffect, useRef } from "react";
import { useGooglePlacesAutocomplete } from "../hooks/useGooglePlacesAutocomplete";

interface LocationAutocompleteInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSelectPlace?: (place: {
    place_id: string;
    name: string;
    formatted_address: string;
    latitude: number;
    longitude: number;
  }) => void;
  className?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = "Search location / venue...",
  onSelectPlace,
  className = "",
}) => {
  const {
    suggestions,
    isLoading,
    getPlaceDetails,
    clearSuggestions,
    setProgrammaticSelection,
  } = useGooglePlacesAutocomplete(value);

  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Pre-seed selected description to suppress fetch requests on form load (edit screens)
  useEffect(() => {
    if (value) {
      setProgrammaticSelection("INITIAL_LOAD");
    }
  }, [setProgrammaticSelection]);

  const handleSelectSuggestion = async (suggestion: any) => {
    setShowDropdown(false);
    setProgrammaticSelection(suggestion.place_id);
    onChange(suggestion.description);
    clearSuggestions();
    
    if (onSelectPlace) {
      const details = await getPlaceDetails(suggestion.place_id);
      if (details) {
        onSelectPlace({
          place_id: details.place_id,
          name: details.name,
          formatted_address: details.formatted_address,
          latitude: details.geometry.location.lat,
          longitude: details.geometry.location.lng,
        });
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className={className}
      />
      
      {showDropdown && !!value?.trim() && (suggestions.length > 0 || isLoading) && (
        <div className="absolute left-0 right-0 top-13 z-50 rounded-2xl bg-[#111111] border border-white/[0.08] max-h-56 overflow-y-auto no-scrollbar shadow-2xl p-1.5 flex flex-col gap-1">
          {isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-xs font-medium text-zinc-500 uppercase tracking-widest animate-pulse">
              Locating match...
            </div>
          )}
          {suggestions.map((item) => (
            <button
              key={item.place_id}
              type="button"
              onMouseDown={() => handleSelectSuggestion(item)}
              className="w-full text-left p-3 rounded-xl hover:bg-white/[0.04] transition duration-200 flex flex-col gap-0.5 group outline-none"
            >
              <span className="text-[13px] font-bold text-white group-hover:text-[#FF6B2C] transition-colors truncate">
                {item.structured_formatting?.main_text || item.description}
              </span>
              <span className="text-[10px] text-zinc-500 truncate">
                {item.structured_formatting?.secondary_text || ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
