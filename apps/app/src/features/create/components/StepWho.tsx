import React from 'react';
import { Search, X, Check, ChevronRight } from 'lucide-react';

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
}) => {
  const filteredCircles = React.useMemo(() => {
    return AVAILABLE_CIRCLES.filter((c) =>
      c.name.toLowerCase().includes(searchPeopleQuery.toLowerCase())
    );
  }, [AVAILABLE_CIRCLES, searchPeopleQuery]);

  return (
    <div className="flex-1 flex flex-col px-5 pt-0 pb-6 justify-between animate-fade-in overflow-y-auto scrollbar-none">
      <div className="space-y-4">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-white leading-none font-display">Who's invited?</h2>
          <p className="text-zinc-500 text-[11px] mt-1.5 font-medium">Invite circles or individual friends.</p>
        </div>

        {/* SEARCH INPUT */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-555" />
          <input 
            type="text"
            placeholder="Invite people..."
            value={searchPeopleQuery}
            onChange={(e) => setSearchPeopleQuery(e.target.value)}
            className="w-full bg-[#111115] border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#FF6B2C]/30 transition placeholder-zinc-555 font-medium"
          />
          {searchPeopleQuery && (
            <button type="button" onClick={() => setSearchPeopleQuery('')} className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CIRCLES - HORIZONTAL SCROLL CARD LIST */}
        <div>
          <h3 className="text-[13px] font-extrabold text-[#E4E4E7] tracking-tight block mb-2 px-0.5 text-left">Circles</h3>
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2 px-0.5 snap-x">
            {filteredCircles.map((circle) => {
              const isAlreadyInvited = disabledCircleIds?.has(circle.id);
              const isChecked = isAlreadyInvited || selectedCircles.includes(circle.id);
              return (
                <button 
                  key={circle.id}
                  type="button"
                  disabled={isAlreadyInvited}
                  onClick={() => toggleCircleSelection(circle.id)}
                  className={`flex-shrink-0 snap-start w-[110px] h-[110px] rounded-[20px] border p-3 flex flex-col justify-between text-left transition-all duration-150 relative ${
                    isChecked 
                      ? 'bg-[#FF6B2C]/5 border-[#FF6B2C] shadow-[0_0_12px_rgba(255,107,44,0.12)]' 
                      : 'bg-[#111115] border-white/5 hover:border-white/10'
                  } ${isAlreadyInvited ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="text-xl bg-zinc-800/40 w-8 h-8 rounded-xl flex items-center justify-center select-none">{circle.emoji}</span>
                    {isChecked && (
                      <span className="w-4 h-4 rounded-full bg-[#FF6B2C] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#050505] stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-white truncate leading-tight mb-0.5">{circle.name}</h4>
                    <span className="text-[8.5px] font-mono font-medium text-zinc-555 block leading-none">{circle.membersCount} members</span>
                  </div>
                </button>
              );
            })}
            {filteredCircles.length === 0 && <span className="text-[11px] text-zinc-600 block pl-1">No matches</span>}
          </div>
        </div>

        {/* UNIFIED SEARCH RESULTS / FRIENDS & RECENTS */}
        <div className="flex flex-col space-y-2 text-left">
          <h3 className="text-[13px] font-extrabold text-[#E4E4E7] tracking-tight block px-0.5">
            {searchPeopleQuery ? 'Search Results' : 'Friends & Recents'}
          </h3>
          <div className="overflow-y-auto scrollbar-none space-y-1.5 max-h-[160px] pr-0.5">
            {unifiedSearchResults
              .filter((item) => item.type !== 'circle')
              .map((item) => {
                const isAlreadyInvited = disabledUserIds?.has(item.id) || (item.rawFriend?.dbUuid && disabledUserIds?.has(item.rawFriend.dbUuid));
                const isSelected = isAlreadyInvited || selectedFriends.some(f => f.id === item.id);
                
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    disabled={isAlreadyInvited}
                    onClick={() => {
                      toggleFriendSelection(item.rawFriend);
                    }}
                    className={`w-full p-2.5 rounded-xl border select-none text-left flex items-center justify-between transition-all duration-150 text-xs font-semibold ${
                      isSelected 
                        ? 'bg-[#111115] border-[#FF6B2C] shadow-[0_0_12px_rgba(255,107,44,0.08)] text-white' 
                        : 'bg-[#111115]/50 border-white/5 text-zinc-350 hover:border-white/10'
                    } ${isAlreadyInvited ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.avatar && (
                        <img src={item.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                      )}
                      <div className="truncate text-left leading-none">
                        <span className="block truncate text-xs font-bold leading-tight text-zinc-200">{item.name}</span>
                        <span className="block text-[8px] text-zinc-555 font-medium font-mono leading-none mt-0.5 uppercase tracking-wider">
                          {isAlreadyInvited ? 'Already Invited' : (item.type === 'recent' ? 'Recent Invite' : 'Friend')}
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

            {unifiedSearchResults.length === 0 && (
              <span className="text-[11px] text-zinc-650 block pl-1 text-center py-4">No matches found</span>
            )}
          </div>
        </div>

        {/* SELECTED GUESTS PILLS */}
        {selectedItems.length > 0 && (
          <div className="space-y-2 text-left">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#FF6B2C] font-bold block">Selected</span>
            <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto scrollbar-none py-0.5">
              {selectedItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => handleRemoveSelectedItem(item)}
                  className="flex items-center gap-1.5 bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 text-white rounded-full py-1 pl-2.5 pr-2 text-xs font-semibold hover:bg-[#FF6B2C]/20 transition cursor-pointer select-none"
                >
                  {item.type === 'friend' && item.avatar && (
                    <img src={item.avatar} alt="Avatar" className="w-3.5 h-3.5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  )}
                  {item.type === 'circle' && (
                    <span className="text-xs">{item.emoji || '👥'}</span>
                  )}
                  <span className="truncate max-w-[100px]">{item.name}</span>
                  <span className="text-zinc-500 hover:text-white ml-0.5 font-bold">✕</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ATTENDANCE SECTION */}
        {!hideCapacity && (
          <div className="bg-[#111115]/55 border border-white/5 rounded-[22px] p-4 text-left space-y-3.5 mt-2 select-none">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-bold leading-none block">Attendance</span>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">{totalInvitedCount} Invited</span>
              <button
                type="button"
                onClick={() => setWaitlistEnabled(!waitlistEnabled)}
                className="flex items-center gap-2 cursor-pointer select-none"
              >
                <span className="text-xs text-zinc-400">Waitlist Enabled</span>
                <div className={`w-8 h-4 rounded-full p-0.5 transition duration-200 flex items-center shrink-0 ${waitlistEnabled ? 'bg-[#FF6B2C]' : 'bg-zinc-800'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${waitlistEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

            {waitlistEnabled && (
              <>
                <div className="h-px bg-white/[0.04] w-full" />
                
                <div className="flex justify-between items-center animate-fade-in">
                  <span className="text-xs font-semibold text-zinc-300">Available Spots</span>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setWaitlistCapacity(Math.max(1, waitlistCapacity - 1))}
                      className="w-7.5 h-7.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-white transition font-bold cursor-pointer"
                    >
                      <span className="text-sm select-none leading-none">-</span>
                    </button>
                    <span className="text-xs font-bold text-white font-mono w-4 text-center">{waitlistCapacity}</span>
                    <button 
                      type="button"
                      onClick={() => setWaitlistCapacity(waitlistCapacity + 1)}
                      className="w-7.5 h-7.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 flex items-center justify-center text-white transition font-bold cursor-pointer"
                    >
                      <span className="text-sm select-none leading-none">+</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2 animate-fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Invited:</span>
                    <span className="font-bold text-zinc-200">{totalInvitedCount}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Going:</span>
                    <span className="font-bold text-emerald-400">{Math.min(totalInvitedCount, waitlistCapacity)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Waitlisted:</span>
                    <span className="font-bold text-amber-400">{Math.max(0, totalInvitedCount - waitlistCapacity)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
            className="w-full bg-[#FF6B2C] hover:bg-[#FF8552] text-[#050505] py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5 shadow-lg shadow-[#FF6B2C]/10 cursor-pointer"
          >
            <span>{confirmLabel || `Inviting ${totalInvitedCount} people → Continue`}</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}
    </div>
  );
};
