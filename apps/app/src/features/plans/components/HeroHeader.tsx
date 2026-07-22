import React from "react";
import { ChevronLeft, Edit, MoreVertical } from "lucide-react";
import { UserAvatar } from "../../../IMGfromDB/UserAvatar";

interface OverflowMenuItem {
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

export interface HostInfo {
  id: string;
  name: string;
  avatar?: string;
  isCreator?: boolean;
}

interface HeroHeaderProps {
  title: string;
  creatorName?: string;
  creatorAvatar?: string;
  hosts?: HostInfo[];
  viewerId?: string;
  onClose: () => void;
  /** @deprecated — no longer used, kept for back-compat */
  isInfoOpen?: boolean;
  /** @deprecated — no longer used, kept for back-compat */
  onToggleInfo?: () => void;
  /** @deprecated — no longer used, kept for back-compat */
  showInfoButton?: boolean;
  isHost?: boolean;
  onEdit?: () => void;
  /** Items to show in the ⋮ overflow menu */
  overflowMenuItems?: OverflowMenuItem[];
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({
  title,
  creatorName,
  creatorAvatar,
  hosts,
  viewerId,
  onClose,
  isHost = false,
  onEdit,
  overflowMenuItems = [],
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on outside click
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const showOverflow = overflowMenuItems.length > 0;

  // Fall back to single creator host if hosts prop is not passed
  const hostList: HostInfo[] = React.useMemo(() => {
    if (hosts && hosts.length > 0) return hosts;
    return [{ id: "", name: creatorName || "Host", avatar: creatorAvatar, isCreator: true }];
  }, [hosts, creatorName, creatorAvatar]);

  const creatorHost = hostList.find(h => h.isCreator) || hostList[0];
  const additionalHosts = hostList.filter(h => h !== creatorHost);

  const isViewerCreator = viewerId ? creatorHost.id === viewerId : false;
  const viewerAdditionalHost = viewerId ? additionalHosts.find(h => h.id === viewerId) : undefined;

  // Rule-based Host Ordering
  const orderedHosts: HostInfo[] = React.useMemo(() => {
    if (hostList.length <= 1) return hostList;

    if (isViewerCreator) {
      // Rule 1: Creator Host ("you") comes first, then additional hosts
      return [creatorHost, ...additionalHosts];
    } else if (viewerAdditionalHost) {
      // Rule 2: Additional Host viewing -> viewing user ("you") comes first, then Creator Host, then remaining additional hosts
      const remainingAdditional = additionalHosts.filter(h => h.id !== viewerId);
      return [viewerAdditionalHost, creatorHost, ...remainingAdditional];
    } else {
      // Rule 3: Participant viewing -> Creator Host comes first, then additional hosts
      return [creatorHost, ...additionalHosts];
    }
  }, [hostList, creatorHost, additionalHosts, isViewerCreator, viewerAdditionalHost, viewerId]);

  const hostedByText = React.useMemo(() => {
    const formattedNames = orderedHosts.map(h => (h.id && h.id === viewerId ? "You" : h.name || "Host"));
    return formattedNames.join(", ");
  }, [orderedHosts, viewerId]);

  return (
    <div
      id="immersive-plan-glass-header"
      className="absolute top-0 left-0 right-0 z-30 bg-black/30 backdrop-blur-xl border-b border-white/10 shadow-lg pb-3 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] rounded-b-2xl"
    >
      <div className="w-full flex flex-col items-center relative px-4">
        {/* Back button — top-left */}
        <button
          id="immersive-plan-back-btn"
          type="button"
          onClick={onClose}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer pointer-events-auto"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right action buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-auto">
          {/* ⋮ overflow menu */}
          {showOverflow && (
            <div ref={menuRef} className="relative">
              <button
                id="immersive-plan-overflow-btn"
                type="button"
                onClick={() => setMenuOpen(v => !v)}
                className={`w-9 h-9 rounded-full backdrop-blur-sm border flex items-center justify-center active:scale-95 transition duration-200 cursor-pointer ${
                  menuOpen
                    ? "bg-white/20 border-white/20 text-white"
                    : "bg-white/10 border-white/10 text-white hover:bg-white/20"
                }`}
              >
                <MoreVertical className="w-4.5 h-4.5" />
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div
                  className="absolute top-full right-0 mt-2 min-w-[160px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-50"
                  style={{ background: "rgba(28,28,30,0.96)", backdropFilter: "blur(20px)" }}
                >
                  {overflowMenuItems.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        item.onClick();
                      }}
                      className={`w-full flex items-center px-4 py-3.5 text-left text-[14px] font-medium transition-colors active:bg-white/10 ${
                        item.destructive
                          ? "text-red-400 hover:bg-red-500/10"
                          : "text-white/90 hover:bg-white/8"
                      } ${idx > 0 ? "border-t border-white/[0.06]" : ""}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Centered Title */}
        <h1 className="text-[17px] font-bold text-white tracking-[0.08em] leading-tight select-text text-center px-10">
          {title}
        </h1>

        {/* Centered Hosted By with Overlapping Avatars */}
        <div className="flex items-center gap-2 mt-1 select-none">
          <div className="flex items-center -space-x-1.5 flex-shrink-0">
            {orderedHosts.map((h, idx) => (
              <UserAvatar
                key={h.id || idx}
                src={h.avatar}
                alt={h.name || "Host"}
                size="w-4.5 h-4.5"
                className="border border-black/80 rounded-full relative"
                style={{ zIndex: orderedHosts.length - idx }}
              />
            ))}
          </div>
          <span id="immersive-host-attribution" className="text-[12px] text-white/60 font-medium select-none">
            Hosted by <span className="text-white/90 font-semibold">{hostedByText}</span>
          </span>
        </div>
      </div>
    </div>
  );
};