import React, { useState, useEffect } from "react";
import { OnboardingFlow } from "./components/OnboardingFlow";
import MainApp from "./components/MainApp";
import { UserProfile } from "./core/types";
import { WorkspaceHeader } from "./components/WorkspaceHeader";
import { SimulatorStatusBar } from "./components/SimulatorStatusBar";
import { SimulatorHomeBar } from "./components/SimulatorHomeBar";
import { WorkspaceFooter } from "./components/WorkspaceFooter";
import { PlansProvider } from "./features/plans/state/PlansContext";
import { ProfileProvider, useProfileStore } from "./features/profile/state/ProfileContext";
import { WalletProvider } from "./features/wallet/state/WalletContext";
import { CirclesProvider } from "./features/circles/state/CirclesContext";
import { ChatProvider } from "./features/chat/state/ChatContext";
import { DeveloperPanel } from "./components/dev/DeveloperPanel";
import { ToastProvider } from "./shared/contexts/ToastContext";
import { supabase } from "./lib/supabaseClient";
import { getInitialsAvatar } from "./demo/seedData";

const WalletProviderComp = WalletProvider as React.ComponentType<{ children: React.ReactNode; userId?: string }>;
const CirclesProviderComp = CirclesProvider as React.ComponentType<{ children: React.ReactNode; userId?: string }>;
const PlansProviderComp = PlansProvider as React.ComponentType<{ children: React.ReactNode; userId?: string }>;
const ChatProviderComp = ChatProvider as React.ComponentType<{ children: React.ReactNode; userId?: string }>;

export default function App() {
  const query = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const sessionKey = query.get("session") || query.get("user") || "default";
  const localStorageKey = `planless_active_user_${sessionKey}`;

  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.user_id) {
          return parsed;
        }
      } catch (e) {
        localStorage.removeItem(localStorageKey);
      }
    }
    return null;
  });

  const [isSimulatorMode, setIsSimulatorMode] = useState(true);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const minutes = now.getMinutes();
      const minStr = String(minutes).padStart(2, '0');
      setCurrentTime(`${hh}:${minStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileSync = async (profile: UserProfile | null) => {
    if (profile) {
      localStorage.setItem(localStorageKey, JSON.stringify(profile));
    } else {
      localStorage.removeItem(localStorageKey);
    }
  };

  return (
    <ProfileProvider initialProfile={initialProfile} onProfileChange={handleProfileSync}>
      <AppContent 
         isSimulatorMode={isSimulatorMode} 
         setIsSimulatorMode={setIsSimulatorMode} 
         currentTime={currentTime}
         localStorageKey={localStorageKey}
      />
    </ProfileProvider>
  );
}

function AppContent({ 
  isSimulatorMode, 
  setIsSimulatorMode, 
  currentTime,
  localStorageKey
}: {
  isSimulatorMode: boolean;
  setIsSimulatorMode: React.Dispatch<React.SetStateAction<boolean>>;
  currentTime: string;
  localStorageKey: string;
}) {
  const { userProfile, setUserProfile } = useProfileStore();
  const [showDevPanel, setShowDevPanel] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "true") {
      setShowDevPanel(true);
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setShowDevPanel(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync Supabase active session and database profile
  useEffect(() => {
    async function restoreSessionAndProfile() {
      try {
        // Development auth reset: sign out and clear cache on fresh session start
        if (import.meta.env.DEV && !sessionStorage.getItem("planless_dev_session_active")) {
          sessionStorage.setItem("planless_dev_session_active", "true");
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn("[Dev Auth Reset] Supabase signOut failed:", e);
          }
          setUserProfile(null);
          localStorage.removeItem(localStorageKey);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const authUser = session.user;
          
          // Fetch profile from public.users
          const { data: dbProfile, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (dbProfile) {
            const mappedProfile: UserProfile = {
              name: dbProfile.full_name,
              phone: authUser.email || "", // Email maps to phone/identifier in UI fallback
              bio: dbProfile.bio || "",
              avatar: dbProfile.profile_url || getInitialsAvatar(dbProfile.full_name),
              joined: true,
              college_or_work: "SRM Chennai",
              user_id: dbProfile.public_id,
              dbUuid: dbProfile.id,
              token: session.access_token,
              profile_completed: dbProfile.profile_completed,
            };
            setUserProfile(mappedProfile);
            localStorage.setItem(localStorageKey, JSON.stringify(mappedProfile));
          } else {
            // Auto-initialize minimal profile if missing
            const { data: publicId, error: rpcError } = await supabase.rpc("generate_user_public_id");
            if (rpcError || !publicId) {
              console.error("[App Startup] Failed to generate a public ID:", rpcError?.message);
              return;
            }

            const { data: newProfile } = await supabase
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

            if (newProfile) {
              const mappedProfile: UserProfile = {
                name: newProfile.full_name,
                phone: authUser.email || "",
                bio: newProfile.bio || "",
                avatar: newProfile.profile_url || getInitialsAvatar(newProfile.full_name),
                joined: true,
                college_or_work: "SRM Chennai",
                user_id: newProfile.public_id,
                dbUuid: newProfile.id,
                token: session.access_token,
                profile_completed: newProfile.profile_completed,
              };
              setUserProfile(mappedProfile);
              localStorage.setItem(localStorageKey, JSON.stringify(mappedProfile));
            }
          }
        }
      } catch (err) {
        console.warn("[App Startup] Session and profile restore exception:", err);
      }
    }

    restoreSessionAndProfile();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUserProfile(null);
        localStorage.removeItem(localStorageKey);
      } else if (event === "SIGNED_IN" && session) {
        restoreSessionAndProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUserProfile, localStorageKey]);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem(localStorageKey, JSON.stringify(newProfile));
  };

  const handleLogoutReset = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Failed to sign out via Supabase auth:", e);
    }
    setUserProfile(null);
    localStorage.removeItem(localStorageKey);
  };

  return (
    <div className="h-screen w-screen bg-[#050505] flex flex-col font-sans selection:bg-[#ff5e3a]/35 overflow-hidden">
      <WorkspaceHeader 
        isSimulatorMode={isSimulatorMode}
        setIsSimulatorMode={setIsSimulatorMode}
        profile={userProfile}
        handleLogoutReset={handleLogoutReset}
      />

      <div className="flex-1 w-full h-full z-10 overflow-hidden">
        {!userProfile || !userProfile.profile_completed ? (
          <div className="w-full h-full bg-[#050505] flex flex-col relative">
            <div className="flex-1 overflow-hidden relative">
              <OnboardingFlow 
                onComplete={handleOnboardingComplete} 
                initialStep={userProfile ? "PROFILE_SETUP" : "LANDING"}
                existingProfile={userProfile}
              />
            </div>
          </div>
        ) : (
          (() => {
            const providerKey = userProfile.user_id || "anonymous";
            return (
              <WalletProviderComp key={`wallet-${providerKey}`} userId={userProfile.dbUuid}>
                <CirclesProviderComp key={`circles-${providerKey}`} userId={userProfile.dbUuid}>
                  <PlansProviderComp key={`plans-${providerKey}`} userId={userProfile.dbUuid}>
                    <ChatProviderComp key={`chat-${providerKey}`} userId={userProfile.dbUuid}>
                      <div className="flex flex-row items-stretch justify-center w-full h-full relative overflow-hidden">
                        {/* Developer Testing Panel (Desktop Layout) */}
                        {showDevPanel && (
                          <div className="hidden lg:block w-80 h-full border-r border-zinc-900/40 overflow-y-auto shrink-0 bg-[#0A0A0C]">
                            <DeveloperPanel />
                          </div>
                        )}
     
                        {/* Responsive Container */}
                        <div className="w-full h-full bg-[#050505] flex flex-col relative">
                          <div className="flex-1 overflow-hidden relative">
                            <ToastProvider>
                              <MainApp 
                                userProfile={userProfile} 
                                activeUserId={userProfile.dbUuid || "U001"} 
                                onLogout={handleLogoutReset} 
                              />
                            </ToastProvider>
                          </div>
                        </div>
                      </div>
                    </ChatProviderComp>
                  </PlansProviderComp>
                </CirclesProviderComp>
              </WalletProviderComp>
            );
          })()
        )}
      </div>

      <WorkspaceFooter />
    </div>
  );
}
