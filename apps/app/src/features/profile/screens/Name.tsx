import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, XCircle } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

interface NameProps {
  activeUserUuid: string;
  currentValue: string;
  onBack: () => void;
  onSaveSuccess: (newName: string) => void;
}

export const Name = ({
  activeUserUuid,
  currentValue,
  onBack,
  onSaveSuccess,
}: NameProps) => {
  const [name, setName] = useState(currentValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChanges = name.trim() !== currentValue;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (val.length > 40) {
      setError("Name can't be this long.");
    } else if (val.trim().length > 0 && val.trim().length < 3) {
      setError("Name must be at least 3 characters.");
    } else {
      setError(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    if (trimmed.length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }
    if (error) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ full_name: trimmed })
        .eq("id", activeUserUuid);

      if (updateError) {
        setError("Failed to save name. Please try again.");
        setIsSaving(false);
        return;
      }

      onSaveSuccess(trimmed);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setIsSaving(false);
    }
  };

  const isSaveDisabled = isSaving || name.trim().length < 3 || !!error || !hasChanges;

  return (
    <div className="absolute inset-0 bg-[#0C0C0E] z-50 flex flex-col animate-fade-in text-zinc-200">
      {/* Header */}
      <div className="border-b border-white/[0.03] select-none flex-shrink-0">
        <div className="max-w-md mx-auto w-full px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-90 disabled:opacity-50"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-sans font-semibold text-white">
            Name
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-between max-w-md mx-auto w-full">
        <form onSubmit={handleSave} className="space-y-6 flex flex-col text-left">
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-lg text-white">
              Change your name
            </h3>
            <p className="text-zinc-550 text-xs leading-relaxed font-sans font-medium">
              This is how you will appear to your friends on Planless.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="relative flex items-center bg-[#0D0D10] border border-white/[0.05] focus-within:border-[#FF6B2C]/40 rounded-xl px-4 py-3.5 transition">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={isSaving}
                className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none placeholder-zinc-700 font-semibold"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            {error && (
              <div className="px-1 text-[11px] font-sans font-medium text-[#FF4F00] flex items-center gap-1.5 animate-fade-in select-none">
                <XCircle className="w-3.5 h-3.5 text-[#FF4F00] flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        </form>

        <div className="pb-8">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaveDisabled}
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wide transition shadow-lg shadow-[#FF6B2C]/10 active:scale-98 cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
