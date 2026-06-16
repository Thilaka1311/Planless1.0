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
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minStr = minutes < 10 ? "0" + minutes : minutes;
      setCurrentTime(`${hours}:${minStr} ${ampm}`);
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

  useEffect(() => {
    async function syncDatabaseProfile() {
      if (userProfile && userProfile.phone) {
        try {
          const res = await fetch("/api/auth/login-or-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: userProfile.phone, name: userProfile.name }),
          });
          if (res.ok) {
            const result = await res.json();
            const user = result.user;
            const updatedProfile = {
              name: user.full_name,
              phone: user.phone_number,
              bio: user.bio || "Always spontaneous, never planless.",
              avatar: user.profile_photo || userProfile.avatar,
              joined: true,
              college_or_work: user.college_or_work || "SRM Chennai",
              user_id: user.user_id,
              dbUuid: user.id,
              token: result.token,
            };
            setUserProfile(updatedProfile);
            localStorage.setItem(localStorageKey, JSON.stringify(updatedProfile));
          }
        } catch (err) {
          console.warn("[App Startup] Session profile restore exception:", err);
        }
      }
    }
    syncDatabaseProfile();
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    localStorage.setItem(localStorageKey, JSON.stringify(newProfile));
  };

  const handleLogoutReset = () => {
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
        {!userProfile ? (
          <div className="w-full max-w-md h-full bg-[#050505] flex flex-col relative mx-auto">
            <div className="flex-1 overflow-hidden relative">
              <OnboardingFlow onComplete={handleOnboardingComplete} />
            </div>
          </div>
        ) : (
          <WalletProvider userId={userProfile.dbUuid}>
            <CirclesProvider userId={userProfile.dbUuid}>
              <PlansProvider userId={userProfile.dbUuid}>
                <ChatProvider userId={userProfile.dbUuid}>
                  <div className="flex flex-row items-stretch justify-center max-w-6xl w-full h-full mx-auto relative overflow-hidden">
                    {/* Developer Testing Panel (Desktop Layout) */}
                    {showDevPanel && (
                      <div className="hidden lg:block w-80 h-full border-r border-zinc-900/40 overflow-y-auto shrink-0 bg-[#0A0A0C]">
                        <DeveloperPanel />
                      </div>
                    )}
 
                    {/* Responsive Container */}
                    <div className="w-full max-w-lg h-full bg-[#050505] flex flex-col relative border-x border-zinc-900/40">
                      <div className="flex-1 overflow-hidden relative">
                        <MainApp 
                          userProfile={userProfile} 
                          activeUserId={userProfile.dbUuid || "U001"} 
                          onLogout={handleLogoutReset} 
                        />
                      </div>
                    </div>
                  </div>
                </ChatProvider>
              </PlansProvider>
            </CirclesProvider>
          </WalletProvider>
        )}
      </div>

      <WorkspaceFooter />
    </div>
  );
}
