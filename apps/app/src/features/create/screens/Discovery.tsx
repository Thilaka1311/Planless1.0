import React, { useState, useEffect } from "react";
import { Search, Compass, Film, UtensilsCrossed, CalendarDays, Star, MapPin } from "lucide-react";
import { getSectionsByCategory } from "../../../services/discoveryService";
import { DiscoverySection as DiscoverySectionType, DiscoveryItem } from "../../../core/types/discovery";
import { HomeHeader } from "../../../components/HomeHeader";

interface DiscoveryProps {
  userProfile: any;
  setActiveTab: (tab: any) => void;
  notifications: any[];
  onSelectDiscoveryItem: (item: DiscoveryItem) => void;
  onSelectCustomPlan: () => void;
}

export const BrowseExperiencesStep: React.FC<DiscoveryProps> = ({
  userProfile,
  setActiveTab,
  notifications,
  onSelectDiscoveryItem,
  onSelectCustomPlan,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sections, setSections] = useState<DiscoverySectionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load all discovery data once to power our redesigned grid and list
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    getSectionsByCategory("all")
      .then((data) => {
        if (active) {
          setSections(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading discovery sections:", err);
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  // Filter sections and items based on search query
  const filteredSections = sections.map((section) => {
    const items = section.items || [];
    const filtered = items.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.subcategory && item.subcategory.toLowerCase().includes(query))
      );
    });
    return { ...section, items: filtered };
  }).filter((section) => section.items.length > 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-y-auto no-scrollbar pb-24 text-left select-none" style={{ fontFamily: "Inter, sans-serif" }}>
      
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

      {/* ── 2. FLOATING SEARCH BAR ── */}
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
            className="w-full h-13 pl-11 pr-4 bg-[#111111] border border-white/[0.04] rounded-full text-sm font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-white/10 transition-all duration-300 shadow-inner"
          />
        </div>
      </section>

      {/* ── 3. CATEGORY GRID ── */}
      <section className="px-6 py-4 shrink-0">
        <div className="grid grid-cols-2 gap-3">
          {/* Sports */}
          <button
            onClick={() => setSearchQuery("sports")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-emerald-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">⚽</div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Sports</span>
              <span className="text-[9px] text-zinc-500 block font-medium">Turfs & Courts</span>
            </div>
          </button>

          {/* Movies */}
          <button
            onClick={() => setSearchQuery("movies")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-violet-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">🎬</div>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Movies</span>
              <span className="text-[9px] text-zinc-500 block font-medium">Trending Premieres</span>
            </div>
          </button>

          {/* Restaurants */}
          <button
            onClick={() => setSearchQuery("dining")}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-rose-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">🍝</div>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Dining</span>
              <span className="text-[9px] text-zinc-500 block font-medium">Popular Cafes</span>
            </div>
          </button>

          {/* Custom Plan */}
          <button
            onClick={onSelectCustomPlan}
            className="h-[100px] rounded-2xl bg-[#111111] hover:bg-[#151515] border border-white/[0.04] hover:border-zinc-500/20 p-4 flex flex-col justify-between text-left transition duration-300 active:scale-97 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute -right-3 -bottom-3 text-4xl opacity-10 group-hover:scale-110 transition duration-300">✨</div>
            <div className="w-8 h-8 rounded-xl bg-zinc-500/10 border border-white/10 flex items-center justify-center text-zinc-400">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-white block uppercase tracking-wide">Custom</span>
              <span className="text-[9px] text-zinc-500 block font-medium">Create Scratch</span>
            </div>
          </button>
        </div>
      </section>

      {/* ── 5. DISCOVERY SECTIONS ── */}
      {isLoading ? (
        <div className="px-6 py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-zinc-550 uppercase tracking-widest">Coordinating matches...</span>
        </div>
      ) : filteredSections.length === 0 ? (
        <div className="px-6 py-16 text-center space-y-2">
          <p className="text-zinc-500 text-sm">No coordinate suggestions found matching your vibe.</p>
          <button onClick={() => setSearchQuery("")} className="text-xs font-bold text-[#FF6B2C] uppercase tracking-wider">
            Clear Search Filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSections.map((section) => {
            // Derive Section Vibe color tag based on category
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

            return (
              <div key={section.title} className="space-y-3.5">
                <div className="px-6 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-widest">
                    {section.title}
                  </h4>
                  <span className={`text-[8.5px] font-mono font-black uppercase tracking-wider ${colorAccent}`}>
                    Suggestions →
                  </span>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-2.5 scroll-smooth">
                  {section.items.map((item) => {
                    const rating = item.suggested_capacity ? `★ ${(4.5 + (item.suggested_capacity % 5) * 0.1).toFixed(1)}` : "★ 4.8";
                    const distance = item.suggested_capacity ? `${(1.2 + (item.suggested_capacity % 3) * 0.4).toFixed(1)} km` : "2.5 km";

                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectDiscoveryItem(item)}
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

                        {/* Top corner: rating and distance metrics */}
                        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold border flex items-center gap-0.5 backdrop-blur-md shadow-sm ${colorAccent} ${badgeBg}`}>
                            {item.category?.toUpperCase() || "VIBE"}
                          </span>
                          <span className="bg-black/40 border border-white/[0.05] px-2.5 py-0.5 rounded-full font-mono text-[9px] text-zinc-300 flex items-center gap-0.5 backdrop-blur-md font-bold shadow-sm">
                            <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                            {rating.replace("★", "")}
                          </span>
                        </div>

                        {/* Content section */}
                        <div className="z-10 space-y-1.5 text-left">
                          <h4 className="text-sm font-black text-white leading-tight uppercase tracking-wide truncate">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-[10.5px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {/* Metadata row */}
                          <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-550 font-bold uppercase tracking-wider">
                            <div className="flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{item.location || "TBD Location"}</span>
                            </div>
                            <span className="shrink-0">{distance}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
