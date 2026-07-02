import React from 'react';
import { Search, X, Check, ChevronRight, Users } from 'lucide-react';
import { useProfileStore } from '../../profile/state/ProfileContext';
import { useCirclesStore } from '../../circles/state/CirclesContext';

interface StepWhoProps {
  searchPeopleQuery: string;
  setSearchPeopleQuery: (q: string) => void;
  selectedCircles: string[];
  toggleCircleSelection: (id: string) => void;
  selectedFriends: any[];
  toggleFriendSelection: (friend: any) => void;
  waitlistEnabled: boolean;
  setWaitlistEnabled: (enabled: boolean) => void;
  waitlistCapacity: number;
  setWaitlistCapacity: (cap: number) => void;
  totalInvitedCount: number;
  selectedItems: any[];
  handleRemoveSelectedItem: (item: any) => void;
  unifiedSearchResults: any[];
  AVAILABLE_CIRCLES: any[];
  setCustomizerStep: (step: number) => void;
  disabledUserIds?: Set<string>;
  disabledCircleIds?: Set<string>;
  confirmLabel?: string;
  onConfirmEdit?: () => void;
  hideCapacity?: boolean;
  cameFromReview?: boolean;
  userProfile?: any;
  activeUserId?: string;

  // Optional plan details for the compact header
  localTitle?: string;
  localLocation?: string;
  eventDateTime?: Date;
  category?: string;
  subcategory?: string | null;
}

// Represents a single item in the merged participant list
interface ParticipantItem {
  id: string;
  itemType: 'friend' | 'circle';
  displayName: string;
  // Friend-specific
  fullName?: string;
  username?: string;
  profilePhoto?: string;
  rawFriend?: any;
  // Circle-specific
  circleName?: string;
  groupImage?: string;
  emoji?: string;
  membersCount?: number;
}

export const StepWho: React.FC<StepWhoProps> = ({
  searchPeopleQuery,
  setSearchPeopleQuery,
  selectedCircles,
  toggleCircleSelection,
  selectedFriends,
  toggleFriendSelection,
  waitlistEnabled,
  setWaitlistEnabled,
  waitlistCapacity,
  setWaitlistCapacity,
  totalInvitedCount,
  selectedItems,
  handleRemoveSelectedItem,
  unifiedSearchResults,
  AVAILABLE_CIRCLES,
  setCustomizerStep,
  disabledUserIds,
  disabledCircleIds,
  confirmLabel,
  onConfirmEdit,
  hideCapacity = false,
  cameFromReview = false,
  userProfile,
  activeUserId,
  localTitle,
  localLocation,
  eventDateTime,
  category,
  subcategory,
}) => {
  const { dbUsers } = useProfileStore();
  const { circles } = useCirclesStore();

  // ─── Recents (mixed friends + circles from unifiedSearchResults) ─────────────
  const recents = React.useMemo(() => {
    return unifiedSearchResults.filter(item => item.type === 'recent');
  }, [unifiedSearchResults]);

  // ─── Merged unified alphabetical groups ──────────────────────────────────────
  const mergedAlphabetGroups = React.useMemo(() => {
    const q = searchPeopleQuery.toLowerCase();

    // Compute set of user IDs belonging to selected circles
    const selectedCircleMemberUserIds = new Set<string>();
    selectedCircles.forEach((circleId) => {
      const circleObj = circles.find((c) => c.id === circleId);
      if (circleObj && circleObj.membersList) {
        circleObj.membersList.forEach((m) => {
          if (m.userId) selectedCircleMemberUserIds.add(m.userId);
        });
      }
    });

    // Build friend entries, excluding those who are already members of a selected Circle
    const friendEntries: ParticipantItem[] = dbUsers
      .filter(u => u.id !== activeUserId && u.id !== userProfile?.dbUuid)
      .filter(u => !selectedCircleMemberUserIds.has(u.id))
      .filter(u => {
        if (!q) return true;
        return (
          (u.full_name || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q)
        );
      })
      .map(u => ({
        id: u.id,
        itemType: 'friend' as const,
        displayName: u.full_name || '',
        fullName: u.full_name,
        username: u.username,
        profilePhoto: u.profile_photo || (u as any).profile_url,
        rawFriend: {
          id: u.id,
          dbUuid: u.id,
          name: u.full_name,
          avatar: u.profile_photo || (u as any).profile_url,
        },
      }));

    // Build circle entries
    const circleEntries: ParticipantItem[] = AVAILABLE_CIRCLES
      .filter(c => {
        if (!q) return true;
        return (c.name || '').toLowerCase().includes(q);
      })
      .map(c => ({
        id: c.id,
        itemType: 'circle' as const,
        displayName: c.name || '',
        circleName: c.name,
        groupImage: c.groupImage,
        emoji: c.emoji,
        membersCount: c.membersCount,
      }));

    // Merge and sort alphabetically by displayName
    const merged = [...friendEntries, ...circleEntries].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

    // Group by first letter
    const groups: { [key: string]: ParticipantItem[] } = {};
    for (const item of merged) {
      const firstLetter = (item.displayName || '#').charAt(0).toUpperCase();
      const groupKey = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    }

    return groups;
  }, [dbUsers, AVAILABLE_CIRCLES, activeUserId, userProfile, searchPeopleQuery, selectedCircles, circles]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');
  const hasResults = Object.keys(mergedAlphabetGroups).length > 0;

  const handleAlphabetJump = (letter: string) => {
    const el = document.getElementById(`participant-group-${letter}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPlanEmoji = () => {
    if (category === 'sports') return subcategory === 'football' ? '⚽' : '🏸';
    if (category === 'movies') return '🎬';
    if (category === 'dining' || category === 'restaurants') return '🍝';
    return '📅';
  };

  const isItemSelected = (item: ParticipantItem): boolean => {
    if (item.itemType === 'circle') return selectedCircles.includes(item.id);
    return selectedFriends.some(f => f.id === item.id);
  };

  const isItemDisabled = (item: ParticipantItem): boolean => {
    if (item.itemType === 'circle') return !!disabledCircleIds?.has(item.id);
    return !!disabledUserIds?.has(item.id);
  };

  const handleToggleItem = (item: ParticipantItem) => {
    if (item.itemType === 'circle') {
      toggleCircleSelection(item.id);
    } else {
      toggleFriendSelection(item.rawFriend);
    }
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-0 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none relative">
      <div className="space-y-4">

        {/* ── 1. CONDENSED PLAN HEADER ──────────────────────────────────────── */}
        {(localTitle || eventDateTime) && (
          <div className="w-full bg-[#111115]/50 border border-white/5 rounded-2xl p-3 flex items-center gap-3 select-none backdrop-blur-md">
            <span className="w-10 h-10 rounded-full bg-zinc-800/40 border border-white/5 flex items-center justify-center text-lg shrink-0">
              {getPlanEmoji()}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">
                {localTitle || 'NEW EVENT'}
              </h4>
              {localLocation && (
                <p className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
                  📍 {localLocation}
                </p>
              )}
              {eventDateTime && (
                <p className="text-[10px] text-[#FF6B2C] font-semibold leading-none mt-0.5">
                  🕒 {eventDateTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {eventDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── 2. SEARCH INPUT ──────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-555" />
          <input
            type="text"
            placeholder="Search friends or circles..."
            value={searchPeopleQuery}
            onChange={(e) => setSearchPeopleQuery(e.target.value)}
            className="w-full bg-[#111115] border border-white/5 rounded-2xl py-3 pl-11 pr-10 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-555 font-medium"
          />
          {searchPeopleQuery && (
            <button
              type="button"
              onClick={() => setSearchPeopleQuery('')}
              className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── 3. RECENTS GRID (mixed friends + circles) ────────────────────── */}
        {!searchPeopleQuery && recents.length > 0 && (
          <div>
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 select-none text-left">
              Recents
            </h3>
            <div className="grid grid-cols-2 gap-2 select-none">
              {recents.map((item) => {
                const isCircle = !!item.rawCircle;
                const isDisabled = isCircle
                  ? !!disabledCircleIds?.has(item.id)
                  : !!(disabledUserIds?.has(item.id) || (item.rawFriend?.dbUuid && disabledUserIds?.has(item.rawFriend.dbUuid)));
                const isSelected = isDisabled || (isCircle
                  ? selectedCircles.includes(item.id)
                  : selectedFriends.some(f => f.id === item.id));

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isCircle) toggleCircleSelection(item.id);
                      else toggleFriendSelection(item.rawFriend);
                    }}
                    className={`p-2.5 rounded-2xl border select-none text-left flex items-center justify-between transition-all duration-150 ${
                      isSelected
                        ? 'bg-[#FF6B2C]/5 border-[#FF6B2C]/35'
                        : 'bg-[#111115]/50 border-white/5 hover:border-white/10'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {isCircle ? (
                        item.rawCircle?.groupImage ? (
                          <img src={item.rawCircle.groupImage} alt={item.name} className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                            {item.emoji || '👥'}
                          </span>
                        )
                      ) : item.avatar ? (
                        <img src={item.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                          {(item.name || '').charAt(0)}
                        </span>
                      )}
                      <div className="truncate text-left leading-none">
                        <span className="block truncate text-xs font-bold text-zinc-200">{item.name}</span>
                        <span className="text-[8px] font-semibold text-zinc-500 font-mono block mt-0.5 uppercase tracking-wider">
                          {isCircle ? `${item.membersCount ?? 0} Members` : 'Recent Invite'}
                        </span>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="w-4 h-4 rounded-full bg-[#FF6B2C] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#050505] stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 4. UNIFIED ALPHABETICAL LIST (Friends + Circles merged) ──────── */}
        <div>
          <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 select-none text-left">
            {searchPeopleQuery ? 'Results' : 'All'}
          </h3>
          <div className="flex select-none">

            {/* Main scroll list */}
            <div className="flex-1 space-y-4 max-h-[320px] overflow-y-auto scrollbar-none pr-3">
              {Object.keys(mergedAlphabetGroups).sort().map((letter) => (
                <div key={letter} id={`participant-group-${letter}`} className="space-y-1">
                  <span className="text-[10px] font-black text-[#FF6B2C] font-mono block text-left mb-1.5 uppercase tracking-widest pl-1">
                    {letter}
                  </span>

                  <div className="space-y-1">
                    {mergedAlphabetGroups[letter].map((item) => {
                      const disabled = isItemDisabled(item);
                      const selected = disabled || isItemSelected(item);
                      const isCircle = item.itemType === 'circle';

                      return (
                        <button
                          key={`${item.itemType}-${item.id}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleToggleItem(item)}
                          className={`w-full p-2.5 rounded-xl border select-none text-left flex items-center justify-between transition-all duration-150 ${
                            selected
                              ? 'bg-[#FF6B2C]/5 border-[#FF6B2C]/30'
                              : 'bg-[#111115]/30 border-white/5 hover:border-white/10'
                          } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {/* Avatar */}
                            {isCircle ? (
                              item.groupImage ? (
                                <img src={item.groupImage} alt={item.displayName} className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-sm shrink-0">
                                  {item.emoji || '👥'}
                                </span>
                              )
                            ) : (
                              item.profilePhoto ? (
                                <img src={item.profilePhoto} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                                  {(item.displayName || '').charAt(0)}
                                </span>
                              )
                            )}

                            {/* Label */}
                            <div className="truncate text-left leading-none">
                              <span className="block truncate text-xs font-bold text-zinc-200">
                                {item.displayName}
                              </span>
                              {isCircle ? (
                                <span className="text-[8px] font-semibold text-zinc-500 font-mono flex items-center gap-0.5 mt-0.5 uppercase tracking-wider">
                                  <Users className="w-2.5 h-2.5 inline-block" />
                                  {item.membersCount ?? 0} Members
                                </span>
                              ) : (
                                <span className="text-[8px] font-semibold text-zinc-555 font-mono block mt-0.5 uppercase tracking-wider">
                                  @{item.username || 'friend'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selection indicator */}
                          {selected ? (
                            <span className="w-4 h-4 rounded-full bg-[#FF6B2C] flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-[#050505] stroke-[3]" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-white/10 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!hasResults && (
                <div className="w-full py-8 text-center text-zinc-650 text-xs font-semibold select-none">
                  No friends or circles matched your search
                </div>
              )}
            </div>

            {/* A-Z Gutter — only shown when not searching */}
            {!searchPeopleQuery && (
              <div className="w-5 flex flex-col items-center justify-start text-[8px] text-zinc-550 font-bold font-mono select-none pr-0.5 space-y-0.5">
                {alphabet.map((letter) => {
                  const hasItems = !!mergedAlphabetGroups[letter];
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!hasItems}
                      onClick={() => handleAlphabetJump(letter)}
                      className={`w-full text-center py-0.5 rounded transition select-none ${
                        hasItems
                          ? 'text-zinc-400 hover:text-[#FF6B2C] font-black cursor-pointer'
                          : 'text-zinc-800 opacity-20 cursor-default'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* ── 5. CAPACITY CONTROLS ─────────────────────────────────────────── */}
        {!hideCapacity && (
          <div className="bg-[#111115]/55 border border-white/5 rounded-2xl p-4 text-left space-y-3 mt-2 select-none">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold block">
              Attendance Limits
            </span>

            {/* Participant Summary */}
            <div className="grid grid-cols-2 gap-4 bg-[#111115]/30 p-3 rounded-xl border border-white/[0.02] mb-1">
              <div>
                <span className="text-[8.5px] font-mono uppercase text-zinc-550 font-bold block mb-1">Invited</span>
                <span className="text-xs font-bold text-zinc-200">You + {totalInvitedCount} = {totalInvitedCount + 1}</span>
              </div>
              <div>
                <span className="text-[8.5px] font-mono uppercase text-zinc-550 font-bold block mb-1">Plan Spots</span>
                <span className="text-xs font-bold text-zinc-200">{waitlistCapacity}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white">Waitlist Queue</span>
              <button
                type="button"
                onClick={() => setWaitlistEnabled(!waitlistEnabled)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Waitlist Enabled</span>
                <div className={`w-8 h-4 rounded-full p-0.5 transition duration-200 flex items-center shrink-0 ${waitlistEnabled ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${waitlistEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {waitlistEnabled && (
              <>
                <div className="h-px bg-white/[0.04] w-full" />
                <div className="flex justify-between items-center animate-fade-in">
                  <span className="text-xs font-semibold text-zinc-300">Capacity (including the Host)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={waitlistCapacity <= 1}
                      onClick={() => setWaitlistCapacity(Math.max(1, waitlistCapacity - 1))}
                      className="w-7.5 h-7.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-white transition font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>-</span>
                    </button>
                    <span className="text-xs font-bold text-white font-mono w-4 text-center">{waitlistCapacity}</span>
                    <button
                      type="button"
                      onClick={() => setWaitlistCapacity(waitlistCapacity + 1)}
                      className="w-7.5 h-7.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-white transition font-bold"
                    >
                      <span>+</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 6. FOOTER CONFIRM BUTTON ─────────────────────────────────────────── */}
      {!cameFromReview && (
        <div className="pt-4 mt-auto">
          <button
            type="button"
            onClick={() => {
              if (onConfirmEdit) {
                onConfirmEdit();
              } else {
                setCustomizerStep(3);
              }
            }}
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 cursor-pointer select-none"
          >
            <span>{confirmLabel || "Continue"}</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}

    </div>
  );
};
