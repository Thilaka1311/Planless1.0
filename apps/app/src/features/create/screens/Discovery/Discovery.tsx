import React, { useState, useEffect } from "react";
import { Search, Compass, Film, UtensilsCrossed, CalendarDays, Star, MapPin } from "lucide-react";
import { getSectionsByCategory } from "../../../../services/discoveryService";
import { DiscoverySection as DiscoverySectionType, DiscoveryItem } from "../../../../core/types/discovery";
import { HomeHeader } from "../../../../components/HomeHeader";
import { useProfileStore } from "../../../profile/state/ProfileContext";
import { ADMIN_CONFIGS, ContentConfig } from "../../../admin/adminContentService";
import { useLongPress } from "../../../../shared/hooks/useLongPress";
import { AdminContextSheet, AdminDrawer } from "./AdminDiscovery/AdminDiscovery";
import { EditCard } from "./AdminDiscovery/Components/EditCard";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscoveryProps {
  userProfile: any;
  setActiveTab: (tab: any) => void;
  notifications: any[];
  onSelectDiscoveryItem: (item: DiscoveryItem) => void;
  onSelectCustomPlan: () => void;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// Isolated card component so each card gets its own long-press hook instance.

interface DiscoveryCardProps {
  item: DiscoveryItem;
  colorAccent: string;
  badgeBg: string;
  isAdmin: boolean;
  onTap: () => void;
  onLongPressAdmin: () => void;
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  item,
  colorAccent,
  badgeBg,
  isAdmin,
  onTap,
  onLongPressAdmin,
}) => {
  const rating = item.suggested_capacity
    ? `${(4.5 + (item.suggested_capacity % 5) * 0.1).toFixed(1)}`
    : "4.8";
  const distance = item.suggested_capacity
    ? `${(1.2 + (item.suggested_capacity % 3) * 0.4).toFixed(1)} km`
    : "2.5 km";

  const longPress = useLongPress(() => {
    if (isAdmin) onLongPressAdmin();
  }, { threshold: 500 });

  return (
    <div
      {...(isAdmin ? longPress : {})}
      onClick={onTap}
      className="w-[230px] h-[310px] shrink-0 rounded-3xl relative overflow-hidden bg-zinc-950 border border-white/[0.04] shadow-2xl flex flex-col justify-end p-5 cursor-pointer hover:border-white/10 transition-all duration-300 group select-none"
    >
      {item.cover_image_url && (
        <img
          src={item.cover_image_url}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-[1.03] transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/50 to-transparent z-0" />

      {/* Top corner: category badge + rating */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border flex items-center gap-0.5 backdrop-blur-md shadow-sm ${colorAccent} ${badgeBg}`}>
          {item.category?.toUpperCase() || "VIBE"}
        </span>
        <span className="bg-black/40 border border-white/[0.05] px-2.5 py-0.5 rounded-full font-mono text-[9px] text-zinc-300 flex items-center gap-0.5 backdrop-blur-md font-bold shadow-sm">
          <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
          {rating}
        </span>
      </div>

      {/* Content */}
      <div className="z-10 space-y-1.5 text-left">
        <h4 className="text-sm font-bold text-white leading-tight uppercase tracking-wide truncate">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-[10.5px] text-zinc-400 font-normal line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
        <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
            <span className="truncate">{item.location || "TBD Location"}</span>
          </div>
          <span className="shrink-0">{distance}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Discovery Screen ────────────────────────────────────────────────────

export const BrowseExperiencesStep: React.FC<DiscoveryProps> = ({
  userProfile: propUserProfile,
  setActiveTab,
  notifications,
  onSelectDiscoveryItem,
  onSelectCustomPlan,
}) => {
  const { isAdmin, userProfile: storeUserProfile } = useProfileStore();
  const userProfile = propUserProfile || storeUserProfile;
  const adminToken = userProfile?.token || storeUserProfile?.token;
  const [searchQuery, setSearchQuery] = useState("");
  const [sections, setSections] = useState<DiscoverySectionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [discoveryVersion, setDiscoveryVersion] = useState(0);

  // Admin overlay state
  type ContextTarget = { item: any; config: ContentConfig } | null;
  const [contextTarget, setContextTarget] = useState<ContextTarget>(null);
  const [editTarget, setEditTarget] = useState<ContextTarget>(null);
  const [addConfig, setAddConfig] = useState<ContentConfig | null>(null);

  const refresh = () => setDiscoveryVersion((v) => v + 1);

  // Load discovery sections
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getSectionsByCategory("all")
      .then((data) => {
        if (active) { setSections(data); setIsLoading(false); }
      })
      .catch((err) => {
        console.error("Error loading discovery sections:", err);
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [discoveryVersion]);

  // Filter by search query
  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q)) ||
          (item.subcategory && item.subcategory.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((s) => s.items.length > 0);

  // Resolve CMS config for a section
  const getAdminConfig = (section: DiscoverySectionType): ContentConfig | null => {
    const cat = section.category?.toUpperCase();
    if (cat === "SPORTS") return ADMIN_CONFIGS.turfs;
    if (cat === "MOVIES") return ADMIN_CONFIGS.movies;
    return null;
  };

  return (
    <div
      className="flex-1 flex flex-col h-full bg-[#000000] overflow-y-auto no-scrollbar pb-24 text-left select-none"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}
    >

      {/* ── 1. HOME HEADER ── */}
      {userProfile && (
        <HomeHeader
          userProfile={userProfile}
          setActiveTab={setActiveTab}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications || []}
          pendingMemoryCount={0}
        />
      )}

      {/* ── 2. SEARCH BAR ── */}
      <section className="px-6 py-2 shrink-0">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-zinc-500" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities, movies, restaurants..."
            className="w-full h-13 pl-11 pr-4 bg-[#111111] border border-white/[0.04] rounded-full text-sm font-normal text-white placeholder-zinc-500 focus:outline-none focus:border-white/10 transition-all duration-300 shadow-inner"
          />
        </div>
      </section>

      {/* ── 3. CATEGORY GRID ── */}
      <section className="px-6 py-4 shrink-0">
        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={() => setSearchQuery("sports")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-emerald-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">⚽</div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block uppercase tracking-wide">Sports</span>
              <span className="text-[9px] text-zinc-500 block font-normal">Turfs & Courts</span>
            </div>
          </button>

          <button
            onClick={() => setSearchQuery("movies")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-violet-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">🎬</div>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block uppercase tracking-wide">Movies</span>
              <span className="text-[9px] text-zinc-500 block font-normal">Trending Premieres</span>
            </div>
          </button>

          <button
            onClick={() => setSearchQuery("dining")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-rose-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">🍝</div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block uppercase tracking-wide">Dining</span>
              <span className="text-[9px] text-zinc-500 block font-normal">Popular Cafes</span>
            </div>
          </button>

          <button
            onClick={onSelectCustomPlan}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-zinc-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">✨</div>
            <div className="w-8 h-8 rounded-xl bg-zinc-500/10 border border-white/10 flex items-center justify-center text-zinc-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block uppercase tracking-wide">Custom</span>
              <span className="text-[9px] text-zinc-500 block font-normal">Create Scratch</span>
            </div>
          </button>

        </div>
      </section>

      {/* ── 4. DISCOVERY SECTIONS ── */}
      {isLoading ? (
        <div className="px-6 py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Coordinating matches...</span>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="px-6 py-16 text-center space-y-2">
          <p className="text-zinc-500 text-sm font-normal">No suggestions found matching your vibe.</p>
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-semibold text-[#FF6B2C] uppercase tracking-wider"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => {
            const categoryUpper = section.category?.toUpperCase() || "CUSTOM";
            let colorAccent = "text-amber-500";
            let badgeBg = "bg-amber-500/10 border-amber-500/20";
            if (categoryUpper === "SPORTS") {
              colorAccent = "text-emerald-500";
              badgeBg = "bg-emerald-500/10 border-emerald-500/20";
            } else if (categoryUpper === "MOVIES") {
              colorAccent = "text-violet-500";
              badgeBg = "bg-violet-500/10 border-violet-500/20";
            } else if (categoryUpper === "DINING") {
              colorAccent = "text-rose-500";
              badgeBg = "bg-rose-500/10 border-rose-500/20";
            }

            const adminConfig = getAdminConfig(section);

            return (
              <div key={section.title} className="space-y-3.5">

                {/* Section header — clean, no admin buttons */}
                <div className="px-6 flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-widest">
                    {section.title}
                  </h4>
                  <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider ${colorAccent}`}>
                    Suggestions →
                  </span>
                </div>

                {/* Horizontal card scroll */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2.5 scroll-smooth">
                  {section.items.map((item) => (
                    <DiscoveryCard
                      key={item.id}
                      item={item}
                      colorAccent={colorAccent}
                      badgeBg={badgeBg}
                      isAdmin={isAdmin && !!adminConfig}
                      onTap={() => onSelectDiscoveryItem(item)}
                      onLongPressAdmin={() => {
                        if (adminConfig) {
                          setContextTarget({ item, config: adminConfig });
                        }
                      }}
                    />
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── ADMIN: CONTEXT ACTION SHEET ── */}
      {isAdmin && contextTarget && (
        <AdminContextSheet
          item={contextTarget.item}
          config={contextTarget.config}
          token={adminToken}
          onClose={() => setContextTarget(null)}
          onEdit={(item) => {
            setEditTarget({ item, config: contextTarget.config });
            setContextTarget(null);
          }}
          onAdd={() => {
            setAddConfig(contextTarget.config);
            setContextTarget(null);
          }}
          onDeleted={() => {
            setContextTarget(null);
            refresh();
          }}
        />
      )}

      {/* ── ADMIN: EDIT CARD SCREEN ── */}
      {isAdmin && editTarget && (
        <EditCard
          item={editTarget.item}
          config={editTarget.config}
          token={adminToken}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            refresh();
          }}
        />
      )}

      {/* ── ADMIN: ADD CARD DRAWER ── */}
      {isAdmin && addConfig && (
        <AdminDrawer
          config={addConfig}
          token={adminToken}
          onClose={() => setAddConfig(null)}
          onMutated={() => {
            setAddConfig(null);
            refresh();
          }}
        />
      )}

    </div>
  );
};
