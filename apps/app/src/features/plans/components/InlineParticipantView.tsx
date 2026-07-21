import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plan } from '../../../core/types';
import { normalizeStatus } from '../../../../lib/participantStatus';
import { UserAvatar } from '../../../IMGfromDB/UserAvatar';

type InlineTab = 'going' | 'invited' | 'waitlist';

interface InlineParticipantViewProps {
  plan: Plan;
}

export function InlineParticipantView({ plan }: InlineParticipantViewProps) {
  const members = plan.members || [];
  const hostId = plan.hostId;

  const [activeTab, setActiveTab] = React.useState<InlineTab>('going');
  const [isExpanded, setIsExpanded] = React.useState(false);

  const groups = useMemo(() => {
    const going: { name: string; avatar: string; userId: string; isHost: boolean }[] = [];
    const invited: { name: string; avatar: string; userId: string; isHost: boolean }[] = [];
    const waitlist: { name: string; avatar: string; userId: string; isHost: boolean }[] = [];

    if (plan.creatorName) {
      going.push({
        name: plan.creatorName,
        avatar: plan.creatorAvatar || '',
        userId: hostId,
        isHost: true,
      });
    }

    for (const m of members) {
      if (m.userUuid === hostId || m.userId === hostId) continue;
      const entry = {
        name: m.name || 'Unknown',
        avatar: m.avatar || '',
        userId: m.userUuid || m.userId,
        isHost: false,
      };
      const status = normalizeStatus(m.joinState);
      if (status === 'JOINED') going.push(entry);
      else if (status === 'INVITED') invited.push(entry);
      else if (status === 'WAITLISTED') waitlist.push(entry);
    }

    return { going, invited, waitlist };
  }, [members, hostId, plan.creatorName, plan.creatorAvatar]);

  const tabs = useMemo(() => {
    const t: { key: InlineTab; label: string; count: number }[] = [];
    if (groups.going.length > 0) t.push({ key: 'going', label: 'Going', count: groups.going.length });
    if (groups.invited.length > 0) t.push({ key: 'invited', label: 'Invited', count: groups.invited.length });
    if (groups.waitlist.length > 0) t.push({ key: 'waitlist', label: 'Waitlist', count: groups.waitlist.length });
    return t;
  }, [groups]);

  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [tabs, activeTab]);

  const activeList = groups[activeTab] || [];
  const allForStrip = [...groups.going, ...groups.invited, ...groups.waitlist];
  const maxAvatars = 5;
  const visibleAvatars = allForStrip.slice(0, maxAvatars);
  const overflowCount = allForStrip.length - maxAvatars;

  return (
    <div className="w-full bg-[#111111] rounded-3xl border border-white/[0.08] overflow-hidden">
      {/* Header — always visible, tap to expand */}
      <button
        type="button"
        id="inline_participant_toggle"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
      >
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-sans font-semibold tracking-wider text-white/60 uppercase">Participants</h3>
          {/* Overlapping avatar strip */}
          <div className="flex -space-x-2.5 overflow-hidden">
            {visibleAvatars.map((p, i) => (
              <div
                key={p.userId || i}
                className="w-8 h-8 rounded-full border-2 border-[#000000] bg-[#111111] overflow-hidden flex-shrink-0"
                style={{ zIndex: maxAvatars - i }}
              >
                <UserAvatar src={p.avatar} alt={p.name} size="w-full h-full" />
              </div>
            ))}
            {overflowCount > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-[#000000] bg-[#1A1A1A] flex items-center justify-center text-[11px] font-sans font-medium text-white/90 z-10 flex-shrink-0">
                +{overflowCount}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start mt-0.5">
          <span className="text-xs font-mono font-medium text-white/50">{allForStrip.length}</span>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="text-white/35 text-[10px] font-bold inline-block"
          >
            ▼
          </motion.span>
        </div>
      </button>

      {/* Inline expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="inline-participant-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.8 }}
            className="overflow-hidden"
          >
            <div className="w-full h-px bg-white/[0.06]" />

            {/* Segmented tab toggle — only render if more than one non-empty tab */}
            {tabs.length > 1 && (
              <div className="px-4 pt-4">
                <div
                  className="flex rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.05)', padding: '3px', gap: '2px' }}
                >
                  {tabs.map(tab => {
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[10px] text-[12px] font-semibold transition-all duration-200 select-none"
                        style={{
                          background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.38)',
                        }}
                      >
                        {tab.label}
                        <span
                          className="text-[10px] font-mono font-bold tabular-nums"
                          style={{ opacity: isActive ? 0.7 : 0.45 }}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Single-tab label when only one tab exists */}
            {tabs.length === 1 && (
              <div className="px-5 pt-4">
                <span className="text-[10px] font-sans font-black tracking-[0.14em] text-zinc-500 uppercase">
                  {tabs[0].label} ({tabs[0].count})
                </span>
              </div>
            )}

            {/* Participant list */}
            <div className="px-4 pb-5 pt-3 max-h-[260px] overflow-y-auto scrollbar-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  className="space-y-0.5"
                >
                  {activeList.length === 0 ? (
                    <p className="text-[12px] text-white/30 font-sans py-2 px-1">No one here yet.</p>
                  ) : (
                    activeList.map((person, idx) => (
                      <div
                        key={person.userId || idx}
                        className="flex items-center gap-3 py-2 px-1 rounded-xl"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800">
                            <UserAvatar src={person.avatar} alt={person.name} size="w-full h-full" />
                          </div>
                          {person.isHost && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold"
                              style={{ background: '#FF6B2C', color: '#fff' }}
                            >
                              ★
                            </span>
                          )}
                        </div>
                        <span className="font-sans text-[13.5px] text-white/90 font-medium leading-none truncate flex-1">
                          {person.name}
                        </span>
                        {person.isHost && (
                          <span className="text-[10px] font-bold text-white/25 tracking-wider flex-shrink-0 uppercase">
                            Host
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
