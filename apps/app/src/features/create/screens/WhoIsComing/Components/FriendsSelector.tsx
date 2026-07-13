import React from 'react';
import { Search, X, Check, ChevronRight, Users, Crown } from 'lucide-react';
import { useProfileStore } from '../../../../profile/state/ProfileContext';
import { useCirclesStore } from '../../../../circles/state/CirclesContext';
import { UserAvatar } from '../../../../../IMGfromDB/UserAvatar';

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
  hideConfirmButton?: boolean;
  isHostSelected?: boolean;
  onToggleHostSelection?: () => void;

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
  hideConfirmButton = false,
  isHostSelected = true,
  onToggleHostSelection,
  localTitle,
  localLocation,
  eventDateTime,
  category,
  subcategory,
}) => {
  const { dbUsers } = useProfileStore();
  const { circles } = useCirclesStore();
  const totalParticipantsCount = totalInvitedCount + (isHostSelected ? 1 : 0);

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

    // Build friend entries, excluding those who are already members of a selected Circle (except the host)
    const friendEntries: ParticipantItem[] = dbUsers
      .filter(u => {
        const isHost = u.id === activeUserId || u.id === userProfile?.dbUuid;
        if (isHost) return true;
        return !selectedCircleMemberUserIds.has(u.id);
      })
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
    if (item.id === activeUserId || item.id === userProfile?.dbUuid) return !!isHostSelected;
    if (item.itemType === 'circle') return selectedCircles.includes(item.id);
    return selectedFriends.some(f => f.id === item.id);
  };

  const isItemDisabled = (item: ParticipantItem): boolean => {
    if (item.itemType === 'circle') return !!disabledCircleIds?.has(item.id);
    return !!disabledUserIds?.has(item.id);
  };

  const handleToggleItem = (item: ParticipantItem) => {
    const isHost = item.itemType !== 'circle' && (item.id === activeUserId || item.id === userProfile?.dbUuid);
    if (isHost) {
      if (onToggleHostSelection) onToggleHostSelection();
    } else if (item.itemType === 'circle') {
      toggleCircleSelection(item.id);
    } else {
      toggleFriendSelection(item.rawFriend);
    }
  };

  const hostItem = (userProfile && isHostSelected) ? {
    id: activeUserId || userProfile.dbUuid,
    type: 'friend',
    displayName: userProfile.name || 'You',
    avatar: userProfile.avatar,
    isHost: true
  } : null;

  const displaySelectedItems = hostItem ? [hostItem, ...selectedItems] : selectedItems;

  return (
    <div className="flex-1 flex flex-col px-5 pt-0 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none relative">
      <div className="space-y-4">

        {/* Selected Items Preview at the top (blank unless items are selected) */}
        {displaySelectedItems.length > 0 && (
          <div className="bg-transparent border-b border-white/[0.08] pb-4 flex items-center justify-between gap-3 animate-fade-in select-none">
            {/* Horizontal scroll list of selected items styled exactly like the screenshot */}
            <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-none py-1">
              {displaySelectedItems.map((item) => {
                const isCircle = item.type === 'circle' || !!item.rawCircle;
                const photo = isCircle ? item.groupImage : (item.profilePhoto || item.avatar);
                const name = isCircle ? item.displayName : (item.displayName || item.name || 'Friend');
                const isHostItem = (item as any).isHost;

                return (
                  <div key={item.id} className="flex flex-col items-center shrink-0 relative w-14">
                    {/* Avatar Container with overlapping close button */}
                    <div className="relative">
                      {isCircle ? (
                        item.groupImage ? (
                          <img src={item.groupImage} alt={name} className="w-12 h-12 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-sm text-zinc-400 font-bold border border-white/10">
                            {item.emoji || '👥'}
                          </span>
                        )
                      ) : (
                        <UserAvatar
                          src={photo}
                          alt={name}
                          size="w-12 h-12"
                          className="border border-white/10"
                        />
                      )}

                      {/* Floating Host Crown Badge */}
                      {isHostItem && (
                        <div className="absolute -top-1 -right-1 bg-[#FFD700] text-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black font-bold shadow-md">
                          <Crown className="w-2.5 h-2.5 text-black" fill="currentColor" />
                        </div>
                      )}

                      {/* Overlapping 'x' remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isHostItem && onToggleHostSelection) {
                            onToggleHostSelection();
                          } else {
                            handleRemoveSelectedItem(item);
                          }
                        }}
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition shadow-md"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Name underneath */}
                    <div className="flex flex-col items-center w-full mt-1.5 min-h-[24px]">
                      <span className="text-[10px] font-semibold text-zinc-400 truncate w-full text-center">
                        {(name || 'Friend').split(' ')[0]}
                      </span>
                      {isHostItem && (
                        <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider text-center">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Selected count bubble on the rightmost side */}
            <div className="shrink-0 flex items-center justify-center bg-[#FFFFFF] text-[#000000] text-xs font-black rounded-full w-8 h-8">
              {totalParticipantsCount}
            </div>
          </div>
        )}

        {/* ── 3. UNIFIED FLAT LIST ──────── */}
        <div className="flex flex-col select-none space-y-1 max-h-[380px] overflow-y-auto scrollbar-none pr-1">
          {(() => {
            const flatItems: ParticipantItem[] = [];
            Object.keys(mergedAlphabetGroups).sort().forEach((letter) => {
              flatItems.push(...mergedAlphabetGroups[letter]);
            });

            const hostIndex = flatItems.findIndex(
              (item) => item.itemType !== 'circle' && (item.id === activeUserId || item.id === userProfile?.dbUuid)
            );
            if (hostIndex > -1) {
              const [hostItem] = flatItems.splice(hostIndex, 1);
              flatItems.unshift(hostItem);
            }

            if (flatItems.length === 0) {
              return (
                <div className="w-full py-8 text-center text-zinc-600 text-xs font-semibold select-none">
                  No friends or circles matched your search
                </div>
              );
            }

            return flatItems.map((item) => {
              const disabled = isItemDisabled(item);
              const selected = disabled || isItemSelected(item);
              const isCircle = item.itemType === 'circle';
              const isHost = !isCircle && (item.id === activeUserId || item.id === userProfile?.dbUuid);

              return (
                <button
                  key={`${item.itemType}-${item.id}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleItem(item)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: selected ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.04)',
                    background: selected ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    cursor: isHost ? 'default' : (disabled ? 'not-allowed' : 'pointer'),
                    opacity: isHost ? 1 : (disabled ? 0.4 : 1),
                    outline: 'none'
                  }}
                >
                  <div className="flex items-center gap-3 truncate">
                    {/* Avatar */}
                    {isCircle ? (
                      item.groupImage ? (
                        <img src={item.groupImage} alt={item.displayName} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-sm shrink-0 border border-white/5">
                          {item.emoji || '👥'}
                        </span>
                      )
                    ) : (
                      <UserAvatar
                        src={item.profilePhoto}
                        alt="Avatar"
                        size="w-8 h-8"
                        className="shrink-0"
                      />
                    )}

                    {/* Label */}
                    <div className="truncate text-left leading-none">
                      <span className="block truncate text-xs font-bold text-white">
                        {item.displayName}
                      </span>
                      {isCircle ? (
                        item.membersCount !== 4 ? (
                          <span className="text-[8px] font-semibold text-zinc-500 font-mono flex items-center gap-0.5 mt-0.5 uppercase tracking-wider">
                            <Users className="w-2.5 h-2.5 inline-block text-zinc-500" />
                            {item.membersCount ?? 0} Members
                          </span>
                        ) : null
                      ) : (
                        item.username ? (
                          <span className="text-[8px] font-semibold text-zinc-500 font-mono block mt-0.5 uppercase tracking-wider">
                            @{item.username}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>

                  {/* Selection indicator (Clean white checkmark inside solid capsule) */}
                  {selected ? (
                    <span className="w-4.5 h-4.5 rounded-full bg-[#FFFFFF] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#000000] stroke-[3.5]" />
                    </span>
                  ) : (
                    <span className="w-4.5 h-4.5 rounded-full border border-white/10 shrink-0" />
                  )}
                </button>
              );
            });
          })()}
        </div>


      </div>

      {!cameFromReview && !hideConfirmButton && (
        <div className="pt-4 mt-auto space-y-4" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={() => {
              if (onConfirmEdit) {
                onConfirmEdit();
              } else {
                setCustomizerStep(3);
              }
            }}
            style={{
              width: '100%',
              background: '#FFFFFF', // color-action-primary
              color: '#000000',
              padding: '14px 0',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              transition: 'opacity 0.2s, transform 0.1s',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
            }}
          >
            <span>{confirmLabel || "Continue"}</span>
          </button>
        </div>
      )}

    </div>
  );
};
