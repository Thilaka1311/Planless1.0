import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

interface UsernameScreenProps {
  activeUserUuid: string;
  currentUsername: string | null;
  onBack: () => void;
  onSaveSuccess: (newUsername: string, isUpdate: boolean) => void;
}

export const UsernameScreen = ({
  activeUserUuid,
  currentUsername,
  onBack,
  onSaveSuccess,
}: UsernameScreenProps) => {
  // Raw display value — accepts both upper and lowercase input
  const [username, setUsername] = useState(currentUsername || "");
  // All active validation errors shown simultaneously
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!currentUsername;
  // Normalise to lowercase for validation and DB writes
  const normalised = username.toLowerCase();
  const hasChanges = normalised !== (currentUsername || "");

  // Focus and place cursor at the end on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Validation & Debounced availability check
  useEffect(() => {
    if (!username) {
      setValidationErrors([]);
      setIsAvailable(null);
      setIsCheckingAvailability(false);
      return;
    }

    // If the normalised value matches the current username, skip all checks
    if (isEditing && normalised === currentUsername) {
      setValidationErrors([]);
      setIsAvailable(true);
      setIsCheckingAvailability(false);
      return;
    }

    // ── Local validation — collect ALL active errors simultaneously ─────────
    const errors: string[] = [];

    const validRegex = /^[a-z0-9_]+$/;
    if (!validRegex.test(normalised)) {
      errors.push("Only letters, numbers, and underscores are allowed.");
    }

    if (normalised.length > 15) {
      errors.push("Username can't be longer than 15 characters.");
    }

    if (normalised.length > 0 && normalised.length < 3) {
      errors.push("Username must be at least 3 characters.");
    }

    setValidationErrors(errors);

    // Skip availability check while any local errors exist
    if (errors.length > 0) {
      setIsAvailable(null);
      setIsCheckingAvailability(false);
      return;
    }

    // ── Debounced availability check ────────────────────────────────────────
    setIsAvailable(null);
    setIsCheckingAvailability(true);

    const timeoutId = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("username", normalised)
          .maybeSingle();

        if (error) {
          console.error("Error checking username availability:", error);
          setIsAvailable(false);
          setValidationErrors(["Could not verify availability. Try again."]);
        } else if (data) {
          setIsAvailable(false);
          setValidationErrors(["This username is already taken."]);
        } else {
          setIsAvailable(true);
          setValidationErrors([]);
        }
      } catch (err) {
        console.error(err);
        setIsAvailable(false);
        setValidationErrors(["Network error. Please try again."]);
      } finally {
        setIsCheckingAvailability(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [username, isEditing, currentUsername, normalised]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (
      !hasChanges ||
      validationErrors.length > 0 ||
      !isAvailable ||
      isSaving ||
      isCheckingAvailability
    )
      return;

    setIsSaving(true);
    try {
      // Re-verify availability to prevent race conditions
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("username", normalised)
        .maybeSingle();

      if (checkError) {
        setValidationErrors(["Database error during verification."]);
        setIsSaving(false);
        return;
      }

      if (existingUser && existingUser.id !== activeUserUuid) {
        setIsAvailable(false);
        setValidationErrors(["That username was just taken. Please choose another."]);
        setIsSaving(false);
        return;
      }

      // Save normalised (lowercase) username to DB
      const { error: updateError } = await supabase
        .from("users")
        .update({ username: normalised })
        .eq("id", activeUserUuid);

      if (updateError) {
        setValidationErrors(["Failed to save username. Try again."]);
        setIsSaving(false);
        return;
      }

      onSaveSuccess(normalised, isEditing);
    } catch (err) {
      console.error(err);
      setValidationErrors(["Failed to save. Check your connection and try again."]);
      setIsSaving(false);
    }
  };

  const handleBackPress = () => {
    if (hasChanges) {
      setShowDiscardDialog(true);
    } else {
      onBack();
    }
  };

  const isFormValid =
    normalised.length >= 3 &&
    normalised.length <= 15 &&
    validationErrors.length === 0 &&
    isAvailable === true &&
    !isCheckingAvailability &&
    hasChanges;

  return (
    <div className="absolute inset-0 bg-[#0C0C0E] z-50 flex flex-col animate-fade-in text-zinc-200">
      {/* Header bar */}
      <div className="border-b border-white/[0.03] select-none flex-shrink-0">
        <div className="max-w-md mx-auto w-full px-6 py-4 flex items-center gap-4">
          <button
            onClick={handleBackPress}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white flex items-center justify-center transition active:scale-90 disabled:opacity-50"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-sans font-semibold text-white">
            {isEditing ? "Change Username" : "Create your username"}
          </h2>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 px-6 py-8 flex flex-col justify-between max-w-md mx-auto w-full relative">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 flex flex-col text-left"
        >
          {/* Header Texts */}
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-lg text-white">
              {isEditing ? "Change Username" : "Create your username"}
            </h3>
            <p className="text-zinc-550 text-xs leading-relaxed font-sans font-medium">
              {isEditing
                ? "Changing your username will update how friends find and mention you on Planless."
                : "Your username is unique and helps friends find you on Planless."}
            </p>
          </div>

          {/* Current Username Info Section */}
          {isEditing && currentUsername && (
            <div className="space-y-1.5 select-none bg-zinc-950/40 p-3 rounded-xl border border-white/[0.02]">
              <span className="block text-[10px] font-sans font-bold text-zinc-550 tracking-wider uppercase">
                Current Username
              </span>
              <span className="text-sm font-sans font-medium text-zinc-200 mt-0.5 block">
                {currentUsername}
              </span>
            </div>
          )}

          {/* Input field wrapper */}
          <div className="space-y-2.5">
            <div className="relative flex items-center bg-[#0D0D10] border border-white/[0.05] focus-within:border-[#FF6B2C]/40 rounded-xl px-4 py-3.5 transition">
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={isSaving}
                className="flex-1 bg-transparent text-xs text-zinc-200 focus:outline-none placeholder-zinc-700 font-semibold"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck="false"
              />

              {/* Loader */}
              {isCheckingAvailability && (
                <div className="flex items-center select-none">
                  <Loader2 className="w-3.5 h-3.5 text-zinc-550 animate-spin" />
                </div>
              )}
            </div>

            {/* Validation Feedback Messages — all errors shown simultaneously */}
            {username.length > 0 && username.toLowerCase() !== (currentUsername || "") && (
              <div className="px-1 text-[11px] font-sans font-medium transition duration-200 space-y-1">
                {validationErrors.length > 0 ? (
                  validationErrors.map((err, i) => (
                    <span
                      key={i}
                      className="text-[#FF4F00] flex items-center gap-1.5 animate-fade-in"
                    >
                      <XCircle className="w-3.5 h-3.5 text-[#FF4F00] flex-shrink-0" />
                      {err}
                    </span>
                  ))
                ) : isAvailable === true ? (
                  <span className="text-[#00E575] flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575] flex-shrink-0" />
                    Username is available
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </form>

        {/* CTA Save/Continue button */}
        <div className="pb-8">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!isFormValid || isSaving}
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-white py-3.5 rounded-xl font-bold text-xs tracking-wide transition shadow-lg shadow-[#FF6B2C]/10 active:scale-98 cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Continue"}
          </button>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-fade-in">
          <div className="w-full max-w-[280px] bg-[#0A0A0C] border border-white/10 rounded-2xl p-5 text-center shadow-2xl relative select-none">
            <h3 className="font-sans font-bold text-base text-white mb-1.5">Discard changes?</h3>
            <p className="text-zinc-550 text-xs leading-normal mb-5">
              Your new username hasn't been saved.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDiscardDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-white/5 text-zinc-350 hover:text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDiscardDialog(false);
                  onBack();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#D95A23] hover:bg-[#FF6B2C] text-white font-semibold text-xs tracking-wide transition active:scale-95 cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
