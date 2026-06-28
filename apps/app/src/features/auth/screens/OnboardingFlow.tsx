import React, { useState, useEffect } from "react";
import { ArrowLeft, HelpCircle, User } from "lucide-react";
import { UserProfile } from "../../../core/types";
import { getInitialsAvatar } from "../../../demo/seedData";
import { trackEvent } from "../../../lib/analytics";
import { supabase } from "../../../lib/supabaseClient";
import { useProfileUpload } from "../../profile/hooks/useProfileUpload";

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile) => void;
  initialStep?: OnboardingStep;
  existingProfile?: UserProfile | null;
}

export type OnboardingStep = "LANDING" | "EMAIL_INPUT" | "OTP_INPUT" | "PROFILE_SETUP";

export function OnboardingFlow({ onComplete, initialStep = "LANDING", existingProfile = null }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [profileName, setProfileName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200");
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingUser, setCheckingUser] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [tempPublicId, setTempPublicId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const { uploading: uploadImageInProgress, uploadError, uploadImage } = useProfileUpload();

  // If redirected from App, initialize the state fields
  useEffect(() => {
    if (existingProfile) {
      setProfileName(existingProfile.name || "");
      setBio(existingProfile.bio || "");
      setAvatar(existingProfile.avatar || getInitialsAvatar(existingProfile.name || "User"));
      setTempUserId(existingProfile.dbUuid || null);
      setTempPublicId(existingProfile.user_id || null);
      setSessionToken(existingProfile.token || null);
    }
  }, [existingProfile]);

  // Automatically update initials avatar dynamically when typing name
  useEffect(() => {
    if (profileName.trim() && (avatar === "" || avatar.includes("unsplash.com") || avatar.includes("api/placeholder"))) {
      setAvatar(getInitialsAvatar(profileName));
    }
  }, [profileName]);

  // Handle Email submission (sends OTP)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Enter a valid email address");
      return;
    }

    setErrorMessage("");
    setCheckingUser(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.error(error);
        setErrorMessage(error.message || "Failed to send OTP. Please try again.");
        return;
      }

      setStep("OTP_INPUT");
    } catch (err) {
      console.warn("[Onboarding] Email OTP error:", err);
      setErrorMessage("Unable to send OTP. Please try again.");
    } finally {
      setCheckingUser(false);
    }
  };

  // Handle OTP Verification and public.users creation/routing
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim() || otpToken.trim().length < 6) {
      setErrorMessage("Enter a valid 6-digit OTP code");
      return;
    }

    setErrorMessage("");
    setCheckingUser(true);

    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpToken.trim(),
        type: 'email'
      });

      if (error || !session) {
        setErrorMessage(error?.message || "Invalid or expired OTP. Please try again.");
        return;
      }

      const authUser = session.user;
      setTempUserId(authUser.id);
      setSessionToken(session.access_token);

      // Check whether a corresponding profile exists in public.users
      const { data: dbProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (fetchError) {
        console.error("[Onboarding] Fetch profile error:", fetchError);
      }

      if (!dbProfile) {
        // Retrieve sequential public ID from the database RPC safely
        const { data: publicId, error: rpcError } = await supabase.rpc("generate_user_public_id");
        
        if (rpcError || !publicId) {
          setErrorMessage(rpcError?.message || "Failed to generate a public ID. Please try again.");
          return;
        }

        // Insert minimal profile record
        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            public_id: publicId,
            full_name: "",
            profile_url: null,
            bio: "",
            profile_completed: false
          })
          .select("*")
          .single();

        if (insertError || !newProfile) {
          setErrorMessage(insertError?.message || "Failed to initialize your profile. Please try again.");
          return;
        }

        setTempPublicId(newProfile.public_id);
        // Brand new profile is NOT completed, navigate to setup
        setStep("PROFILE_SETUP");
      } else {
        setTempPublicId(dbProfile.public_id);
        
        // If user profile is already completed, finish onboarding immediately
        if (dbProfile.profile_completed) {
          trackEvent("user_signed_in", { source: "app" });
          onComplete({
            name: dbProfile.full_name,
            phone: email.trim() || authUser.email || "",
            bio: dbProfile.bio || "",
            avatar: dbProfile.profile_url || getInitialsAvatar(dbProfile.full_name),
            joined: true,
            college_or_work: "SRM Chennai",
            user_id: dbProfile.public_id,
            dbUuid: dbProfile.id,
            token: session.access_token,
            profile_completed: true
          });
        } else {
          // Profile exists but is not completed, redirect to complete setup screen
          setStep("PROFILE_SETUP");
        }
      }

    } catch (err) {
      console.warn("[Onboarding] OTP verification exception:", err);
      setErrorMessage("Unable to verify OTP. Please try again.");
    } finally {
      setCheckingUser(false);
    }
  };

  // Handle Profile Submission (complete the profile details)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage("Please enter your name");
      return;
    }
    if (!tempUserId) {
      setErrorMessage("Session expired. Please start over.");
      return;
    }

    setErrorMessage("");
    setCheckingUser(true);

    try {
      // Update the authenticated user's row in public.users using id = session.user.id
      const { data: updatedProfile, error: updateError } = await supabase
        .from("users")
        .update({
          full_name: profileName.trim(),
          bio: bio.trim(),
          profile_url: avatar || null,
          profile_completed: true
        })
        .eq("id", tempUserId)
        .select("*")
        .single();

      if (updateError || !updatedProfile) {
        setErrorMessage(updateError?.message || "Failed to save profile. Please try again.");
        return;
      }

      // Track user signup analytics event
      trackEvent("user_signed_up", { source: "app" });

      onComplete({
        name: updatedProfile.full_name,
        phone: email || existingProfile?.phone || "",
        bio: updatedProfile.bio || "",
        avatar: updatedProfile.profile_url || getInitialsAvatar(updatedProfile.full_name),
        joined: true,
        college_or_work: "SRM Chennai",
        user_id: updatedProfile.public_id,
        dbUuid: updatedProfile.id,
        token: sessionToken || "",
        profile_completed: true
      });
    } catch (err) {
      console.warn("[Onboarding] Profile save exception:", err);
      setErrorMessage("Unable to save profile details. Please try again.");
    } finally {
      setCheckingUser(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && tempUserId) {
      // Local preview immediately
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);

      // Perform background upload
      const publicUrl = await uploadImage(file, tempUserId);
      if (publicUrl) {
        setAvatar(publicUrl);
      } else {
        setErrorMessage("Image upload failed. Please try a different file.");
      }
    }
  };

  return (
    <div id="onboarding_wrapper" className="w-full h-full text-white bg-[#0A0A0B] flex flex-col justify-between font-sans relative overflow-hidden p-6 md:p-8">
      
      {/* Visual background abstract element */}
      <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-[#ff5e3b] opacity-[0.06] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-50px] right-[-50px] w-72 h-72 bg-[#ff8b66] opacity-[0.04] rounded-full blur-[100px] pointer-events-none" />

      {/* Header bar */}
      {step !== "LANDING" && (
        <div id="onboarding_header" className="flex items-center justify-between w-full h-10 shrink-0 z-10">
          {step !== "PROFILE_SETUP" ? (
            <button
              id="back_btn"
              onClick={() => {
                if (step === "EMAIL_INPUT") setStep("LANDING");
                else if (step === "OTP_INPUT") setStep("EMAIL_INPUT");
              }}
              className="w-10 h-10 rounded-full flex items-center justify-start text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10" />
          )}
          
          <span className="text-[11px] font-display uppercase tracking-[0.25em] text-zinc-500 font-semibold">
            PLANLESS
          </span>
          
          <button className="w-10 h-10 rounded-full flex items-center justify-end text-zinc-500 hover:text-zinc-300 transition-all">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Form/Content Section */}
      <div id="onboarding_main" className="flex-1 flex flex-col justify-center my-auto py-10 z-10">
        
        {/* LANDING STEP */}
        {step === "LANDING" && (
          <div id="step_landing" className="flex flex-col h-full justify-between py-12">
            <div className="text-zinc-500 text-[11px] font-display uppercase tracking-[0.25em] font-semibold text-center mt-4">
              PLANLESS
            </div>

            <div className="my-auto flex flex-col gap-6">
              <h1 className="text-5xl font-display font-bold tracking-tight text-white leading-[1.05] max-w-sm">
                Planless<br />
                fixes plans.<br />
                Ironic.<br />
                We know.
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs font-sans">
                Spontaneous hangouts, real-world experiences, and circles of friends without the calendar complex.
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-auto">
              <button
                id="btn_create_account"
                onClick={() => {
                  setErrorMessage("");
                  setProfileName("");
                  setEmail("");
                  setOtpToken("");
                  setAuthMode("signup");
                  setStep("EMAIL_INPUT");
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-peach text-white font-medium text-sm tracking-wide shadow-lg shadow-[#ff5e3a]/15 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer text-center"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* EMAIL SIGN IN STEP (SUPPORTING SIGN UP / LOG IN) */}
        {step === "EMAIL_INPUT" && (
          <div id="step_email" className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-medium text-white tracking-tight">
                {authMode === "signup" ? "Let's get you started" : "Welcome back"}
              </h2>
              <p className="text-zinc-500 text-xs">
                Enter your email address to continue.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 font-display font-semibold uppercase tracking-widest block">
                  Email Address
                </label>
                <input
                  id="email_input_field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                  required
                />
                {errorMessage && (
                  <p className="text-xs text-brand-orange font-sans mt-1">{errorMessage}</p>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 leading-relaxed">
                We will send a passwordless OTP code to your email to verify your identity.
              </div>

              <button
                id="email_continue_btn"
                type="submit"
                disabled={checkingUser}
                className="w-full py-3.5 px-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition-all duration-200 text-center cursor-pointer disabled:opacity-50"
              >
                {checkingUser ? "Sending OTP..." : "Continue"}
              </button>
            </form>

            <div className="text-center pt-2">
              {authMode === "signup" ? (
                <p className="text-xs text-zinc-400">
                  Already have an account?{" "}
                  <button 
                    onClick={() => { setAuthMode("login"); setErrorMessage(""); }}
                    className="text-[#ff5e3b] font-medium hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    Log In
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  New to Planless?{" "}
                  <button 
                    onClick={() => { setAuthMode("signup"); setErrorMessage(""); }}
                    className="text-[#ff5e3b] font-medium hover:underline cursor-pointer bg-transparent border-none p-0 focus:outline-none"
                  >
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* OTP VERIFICATION STEP */}
        {step === "OTP_INPUT" && (
          <div id="step_otp" className="space-y-8 animate-fade-in">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-medium text-white tracking-tight">
                Verify your email
              </h2>
              <p className="text-zinc-500 text-xs">
                Enter the 6-digit OTP code sent to <strong>{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleOtpVerify} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-500 font-display font-semibold uppercase tracking-widest block">
                  Verification Code
                </label>
                <input
                  id="otp_input_field"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="000000"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-center text-white tracking-[0.5em] font-mono placeholder-zinc-600 focus:outline-none focus:border-brand-orange"
                  required
                />
                {errorMessage && (
                  <p className="text-xs text-brand-orange font-sans mt-1 text-center">{errorMessage}</p>
                )}
              </div>

              <button
                id="otp_verify_btn"
                type="submit"
                disabled={checkingUser}
                className="w-full py-3.5 px-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-white font-medium text-xs tracking-wider uppercase transition-all duration-200 text-center cursor-pointer disabled:opacity-50"
              >
                {checkingUser ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <div className="text-[11px] text-zinc-600 text-center leading-relaxed">
              Didn't receive the code?{" "}
              <span
                onClick={handleEmailSubmit}
                className="underline cursor-pointer hover:text-white"
              >
                Resend code
              </span>
            </div>
          </div>
        )}

        {/* PROFILE SETUP - post-login profile photo and bio setup */}
        {step === "PROFILE_SETUP" && (
          <div id="step_profile" className="flex flex-col items-center justify-between h-full py-2 space-y-6 animate-fade-in">
            
            {/* Circle Photo Selector */}
            <div className="relative flex flex-col items-center justify-center">
              <div 
                onClick={() => !uploadImageInProgress && document.getElementById("profile_avatar_upload_input")?.click()}
                className={`w-28 h-28 rounded-full border-2 border-transparent bg-gradient-to-tr from-[#ff5e3b] to-[#ff8b66] p-[2.5px] shadow-2xl relative transition-all duration-300 ${uploadImageInProgress ? "opacity-70 cursor-wait" : "cursor-pointer active:scale-95"}`}
              >
                <div className="w-full h-full bg-[#0A0A0B] rounded-full overflow-hidden flex items-center justify-center relative">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      className="w-full h-full object-cover rounded-full transition-opacity duration-300" 
                      alt="Avatar Preview" 
                    />
                  ) : (
                    <User className="w-10 h-10 text-zinc-700" />
                  )}
                  {/* Upload loading overlay */}
                  {uploadImageInProgress && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                
                {/* Custom orange plus badge overlay in bottom-right corner */}
                {!uploadImageInProgress && (
                  <div className="absolute bottom-1.5 right-1.5 w-6.5 h-6.5 bg-gradient-to-r from-[#ff5e3b] to-[#ff8b66] rounded-full flex items-center justify-center border-2 border-[#0A0A0B] shadow cursor-pointer">
                    <span className="text-white text-xs font-black leading-none">+</span>
                  </div>
                )}
              </div>
              
              {/* Hidden file input */}
              <input 
                id="profile_avatar_upload_input"
                type="file" 
                accept="image/jpeg,image/jpg,image/png,image/webp" 
                className="hidden" 
                onChange={handleFileChange}
              />
              {/* Upload error */}
              {uploadError && (
                <p className="text-xs text-brand-orange mt-2 text-center">{uploadError}</p>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1">
              <h2 className="text-[26px] font-display font-bold text-white tracking-tight leading-tight">
                Set up your profile
              </h2>
              <p className="text-zinc-500 text-[10.5px] font-sans">
                This is how people will see you in plans
              </p>
            </div>

            {/* Inputs & Form */}
            <form onSubmit={handleProfileSubmit} className="w-full space-y-4 pt-2">
              <div className="space-y-3">
                
                {/* Pill Name Input */}
                <input
                  id="profile_name_input"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter Your Name"
                  className="w-full bg-white text-zinc-900 rounded-full py-3 px-6 text-sm text-center border-none font-sans font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff5e3b] shadow-lg shadow-black/10"
                  required
                />

                {/* Pill Bio Input */}
                <input
                  id="profile_bio_input"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="About you"
                  className="w-full bg-white text-zinc-900 rounded-full py-3 px-6 text-sm text-center border-none font-sans font-medium placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#ff5e3b] shadow-lg shadow-black/10"
                />
              </div>

              {errorMessage && (
                <p className="text-xs text-brand-orange font-sans text-center mt-1 animate-pulse">{errorMessage}</p>
              )}

              {/* Gradient Continue Button */}
              <div className="pt-8">
                <button
                  id="complete_onboarding_btn"
                  type="submit"
                  disabled={checkingUser}
                  className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#ff5e3b] to-[#ff8b66] text-white font-bold text-xs tracking-[0.1em] uppercase shadow-lg shadow-[#ff5e3a]/15 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  {checkingUser ? "Saving..." : "Continue"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
