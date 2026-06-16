import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Users, 
  Trophy, 
  Award, 
  Minus, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  X, 
  Trash2, 
  Check,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface MemoryAttendee {
  name: string;
  avatar: string;
  isHost?: boolean;
  contributionTag?: string;
}

export interface MemoryRecord {
  id: string; // Matches planId
  title: string;
  category: 'sports' | 'movies' | 'dining' | 'custom';
  subcategory: string | null;
  image: string;
  location: string;
  time: string;
  completedAt: string; // ISO string
  editableUntil: string; // ISO string (completedAt + 24 hours)
  memory_attendees: MemoryAttendee[];
  // Outcome/Recap results
  recapTitle: string;
  recapMetrics: {
    label: string;
    value: string;
    icon?: string;
  }[];
  // Contribution votes/highlights
  mvpVotes: Record<string, number>; // attendee name -> vote count
  votedUserMvp?: string; // name of person the current user voted for
  funFactorCount: number; // overall count
  userClickedFunFactor: boolean;
  highlights: string[];
  footballScore?: { teamA: number; teamB: number };
  footballTeams?: { teamA: string[]; teamB: string[]; locked: boolean };
  badmintonStats?: Record<string, { wins: number; losses: number }>;
  movieRatings?: Record<string, { rating: number; review?: string }>;
  diningRatings?: Record<string, { rating: number; review?: string }>;
}

interface MemoryScreenProps {
  planId: string;
  onBack: () => void;
  onOpenThread?: (planId: string) => void;
  memories: MemoryRecord[];
  setMemories: React.Dispatch<React.SetStateAction<MemoryRecord[]>>;
  circleId?: string;
  footballLeaderboards?: Record<string, Record<string, { wins: number; losses: number; avatar: string }>>;
  onAwardFootballStandings?: (circleId: string, teamA: string[], teamB: string[], scoreA: number, scoreB: number) => void;
}

export const MemoryScreen: React.FC<MemoryScreenProps> = ({
  planId,
  onBack,
  onOpenThread,
  memories,
  setMemories,
  circleId = 'c1',
  footballLeaderboards,
  onAwardFootballStandings,
}) => {
  // Find current memory or fallback
  const memory = memories.find(m => m.id === planId) || {
    id: planId || 'p0',
    title: 'Saturday Badminton Session',
    category: 'sports',
    subcategory: 'badminton',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800',
    location: 'Play Arena Turf HSR',
    time: 'Wed, 27 May • 8:30 PM',
    completedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    editableUntil: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    memory_attendees: [
      { name: 'Thilaka Sundar', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120', isHost: true },
      { name: 'Marcus Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120' },
      { name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120' },
      { name: 'Rahul Prasad', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120' }
    ],
    recapTitle: 'Badminton Session',
    recapMetrics: [],
    mvpVotes: {
      'Alex Rivera': 1,
      'Marcus Chen': 0,
    },
    votedUserMvp: 'Alex Rivera',
    funFactorCount: 14,
    userClickedFunFactor: false,
    highlights: [],
    badmintonStats: {
      'Marcus Chen': { wins: 4, losses: 1 },
      'Thilaka Sundar': { wins: 3, losses: 2 },
      'Alex Rivera': { wins: 1, losses: 4 },
      'Rahul Prasad': { wins: 2, losses: 3 }
    }
  } as MemoryRecord;

  // Determine category specific flags
  const isFootball = memory.subcategory === 'football' || memory.title.toLowerCase().includes('football');
  const isMovie = memory.category === 'movies';
  const isDining = memory.category === 'dining';
  const myKey = 'Thilaka Sundar';
  const attendeesList = memory.memory_attendees || [];
  const isHost = attendeesList.find(a => a.name === myKey)?.isHost || false;

  const activeRatingObj = isMovie 
    ? (memory.movieRatings?.[myKey])
    : isDining
      ? (memory.diningRatings?.[myKey])
      : undefined;

  const hasSubmittedReview = !!activeRatingObj;

  // Movie & Dining local states
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [isEditingReview, setIsEditingReview] = useState<boolean>(false);

  // Lock status and force simulation for manual review
  const [forceLockSimulation, setForceLockSimulation] = useState<boolean | null>(null);
  const isLocked = forceLockSimulation !== null 
    ? forceLockSimulation 
    : (new Date() > new Date(memory.editableUntil));

  // Shared status states
  const [isResultsSubmitted, setIsResultsSubmitted] = useState(false);
  const [isMvpSubmitted, setIsMvpSubmitted] = useState(!!memory.votedUserMvp);

  // Football Score inputs (initially defaulted or populated from saved)
  const [teamAScore, setTeamAScore] = useState(memory.footballScore?.teamA ?? 3);
  const [teamBScore, setTeamBScore] = useState(memory.footballScore?.teamB ?? 2);

  const handleRemoveReview = () => {
    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;
      const updated = { ...(isMovie ? m.movieRatings : m.diningRatings) || {} };
      delete updated[myKey];
      return {
        ...m,
        movieRatings: isMovie ? updated : m.movieRatings,
        diningRatings: isDining ? updated : m.diningRatings,
      };
    }));
    setSelectedRating(0);
    setReviewText('');
    setIsEditingReview(false);
  };

  // Sync state when memory switches
  useEffect(() => {
    setIsMvpSubmitted(!!memory.votedUserMvp);
    setIsEditingReview(false);
    if (isFootball) {
      setIsResultsSubmitted(!!memory.footballScore);
      setTeamAScore(memory.footballScore?.teamA ?? 3);
      setTeamBScore(memory.footballScore?.teamB ?? 2);
    } else if (!isMovie && !isDining) {
      setIsResultsSubmitted(true);
    } else {
      setIsResultsSubmitted(false);
    }
  }, [planId, memory.id, memory.votedUserMvp, memory.footballScore, isFootball, isMovie, isDining]);

  useEffect(() => {
    if (isMovie || isDining) {
      const existing = isMovie 
        ? memory.movieRatings?.[myKey] 
        : memory.diningRatings?.[myKey];
      if (existing) {
        setSelectedRating(existing.rating);
        setReviewText(existing.review || '');
      } else {
        setSelectedRating(0);
        setReviewText('');
      }
    }
  }, [planId, memory.id, isMovie, isDining]);

  // Participant Sheet/Modal State
  const [isParticipantSheetOpen, setIsParticipantSheetOpen] = useState(false);
  const [attendeeToRemove, setAttendeeToRemove] = useState<{ name: string; avatar: string } | null>(null);
  const [floatingToast, setFloatingToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setFloatingToast(message);
    setTimeout(() => {
      setFloatingToast(null);
    }, 4000);
  };

  // Leaderboard Expandable state (Badminton)
  const [isFullLeaderboardExpanded, setIsFullLeaderboardExpanded] = useState(false);

  // Win/Loss statistics for Badminton
  const leaderboardStats = memory.badmintonStats || {};

  // Build dynamic Badminton leaderboard from ALL current attendees
  const sortedLeaderboard = attendeesList.map(member => {
    const stats = leaderboardStats[member.name] || { wins: 0, losses: 0 };
    return {
      name: member.name,
      wins: stats.wins,
      losses: stats.losses,
      avatar: member.avatar,
      isHost: member.isHost
    };
  }).sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : a.losses - b.losses);

  // Leading Badminton player for celebration
  const currentWinner = sortedLeaderboard[0];
  const hasEnoughResults = !isFootball && sortedLeaderboard.some(p => p.wins > 0);

  // Vote Counts for MVP Display (Active Attendees only)
  const mvpLeader = (Object.entries(memory.mvpVotes || {}) as [string, number][])
    .filter(([name]) => attendeesList.some(a => a.name === name))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)[0] || { name: 'Marcus Chen', count: 1 };

  // Calculate MVP Winner(s)
  const getMvpWinners = () => {
    const votesObj = memory.mvpVotes || {};
    const activeAttendeesNames = attendeesList.map(a => a.name);
    const validVotes = (Object.entries(votesObj) as [string, number][])
      .filter(([name]) => activeAttendeesNames.includes(name));
    
    if (validVotes.length === 0) {
      if (memory.votedUserMvp) {
        return [memory.votedUserMvp];
      }
      return [attendeesList[0]?.name || 'Alex Rivera'];
    }
    
    const maxVal = Math.max(...validVotes.map(([_, count]) => count), 0);
    if (maxVal === 0) {
      if (memory.votedUserMvp) {
        return [memory.votedUserMvp];
      }
      return [attendeesList[0]?.name || 'Alex Rivera'];
    }
    return validVotes.filter(([_, count]) => count === maxVal).map(([name]) => name);
  };
  const mvpWinners = getMvpWinners();

  // Helper to resolve player avatar URL
  const getPlayerAvatar = (name: string) => {
    const found = attendeesList.find(a => 
      a.name.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(a.name.toLowerCase())
    );
    return found?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120';
  };

  // Vote on MVP handler
  const handleVoteMvp = (name: string) => {
    if (isMvpSubmitted) return;

    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;

      const currentVote = m.votedUserMvp;
      const updatedVotes = { ...m.mvpVotes };

      if (currentVote && updatedVotes[currentVote]) {
        updatedVotes[currentVote] = Math.max(0, updatedVotes[currentVote] - 1);
      }

      updatedVotes[name] = (updatedVotes[name] || 0) + 1;

      return {
        ...m,
        mvpVotes: updatedVotes,
        votedUserMvp: name
      };
    }));

    setIsMvpSubmitted(true);
  };

  // Badminton win/loss updates
  const handleUpdateStats = (type: 'wins' | 'losses', increment: number) => {
    if (isResultsSubmitted) return;

    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;

      const stats = m.badmintonStats || {
        'Marcus Chen': { wins: 4, losses: 1 },
        'Thilaka Sundar': { wins: 3, losses: 2 },
        'Alex Rivera': { wins: 1, losses: 4 },
        'Rahul Prasad': { wins: 2, losses: 3 }
      };

      const userStat = stats[myKey] || { wins: 0, losses: 0 };
      const newVal = Math.max(0, userStat[type] + increment);

      return {
        ...m,
        badmintonStats: {
          ...stats,
          [myKey]: {
            ...userStat,
            [type]: newVal
          }
        }
      };
    }));
  };

  // Host-only Action: Save final Football score
  const handleConfirmFootballScore = () => {
    if (!isHost) return;

    const teams = memory.footballTeams || {
      teamA: ['Marcus Chen', 'Alex Rivera', 'Rahul Prasad', 'Akash'],
      teamB: ['Thilaka Sundar', 'Bhaavya', 'Zara Patel', 'Chloe Jenkins'],
      locked: true
    };

    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;
      return {
        ...m,
        footballScore: { teamA: teamAScore, teamB: teamBScore },
        footballTeams: teams
      };
    }));

    setIsResultsSubmitted(true);

    // Dynamic point allocation: Winner gets +1 win, loser gets +1 loss
    onAwardFootballStandings?.(
      circleId,
      teams.teamA,
      teams.teamB,
      teamAScore,
      teamBScore
    );
  };

  // Host-only Action: Remove Attendee from all calculations
  const handleRemoveAttendee = (nameToRemove: string) => {
    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;

      // 1. Filter attendee list
      const filteredAttendees = (m.memory_attendees || []).filter(a => a.name !== nameToRemove);

      // 2. Remove from stats
      const updatedStats = { ...(m.badmintonStats || {}) };
      delete updatedStats[nameToRemove];

      // 3. Remove votes & eligibility
      const updatedVp = { ...(m.mvpVotes || {}) };
      delete updatedVp[nameToRemove];

      let newVotedUserMvp = m.votedUserMvp;
      if (m.votedUserMvp === nameToRemove) {
        newVotedUserMvp = undefined;
        setIsMvpSubmitted(false);
      }

      return {
        ...m,
        memory_attendees: filteredAttendees,
        badmintonStats: updatedStats,
        mvpVotes: updatedVp,
        votedUserMvp: newVotedUserMvp
      };
    }));
    
    showToast('Participant removed');
  };

  // Submit Movie or Dining review
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating === 0) return;
    
    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;
      const ratings = isMovie ? (m.movieRatings || {}) : (m.diningRatings || {});
      const updatedRatings = {
        ...ratings,
        [myKey]: { rating: selectedRating, review: reviewText }
      };
      return {
        ...m,
        movieRatings: isMovie ? updatedRatings : m.movieRatings,
        diningRatings: isDining ? updatedRatings : m.diningRatings,
      };
    }));
    setIsEditingReview(false);
  };

  const handleUpdateFunFactor = () => {
    if (isLocked) return;
    setMemories(prev => prev.map(m => {
      if (m.id !== memory.id) return m;
      const clicked = !m.userClickedFunFactor;
      return {
        ...m,
        userClickedFunFactor: clicked,
        funFactorCount: clicked ? m.funFactorCount + 1 : Math.max(0, m.funFactorCount - 1)
      };
    }));
  };

  // Determine user's active name in records (Badminton)
  const myCurrentStats = (memory.badmintonStats || {})[myKey] || { wins: 3, losses: 2 };

  // Calculate closed/successful contribution state
  const isContributionComplete = (isMovie || isDining)
    ? hasSubmittedReview
    : isFootball
      ? (isHost ? (isResultsSubmitted && isMvpSubmitted) : isMvpSubmitted)
      : (isResultsSubmitted && isMvpSubmitted);

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative overflow-y-auto scrollbar-none pb-24 h-full text-zinc-100 font-sans">
      
      {/* HEADER BAR (Clutter-free and compact) */}
      <div className="sticky top-0 z-30 flex justify-between items-center px-5 py-3 bg-[#050505]/95 backdrop-blur-md select-none border-b border-white/[0.02]">
        <button 
          onClick={onBack}
          id="back_to_plans_btn"
          className="p-1.5 -ml-1 rounded-full hover:bg-white/5 active:scale-95 transition-all outline-none animate-fade-in"
        >
          <ArrowLeft className="w-5 h-5 text-zinc-300" />
        </button>
        
        <div className="flex items-center gap-1.5 animate-fade-in">
          <button
            type="button"
            onClick={() => setForceLockSimulation(prev => prev === null ? !isLocked : (prev === true ? false : null))}
            title="Toggle between active 24h window and locked state for testing."
            className={`text-[9.5px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full border transition-all active:scale-95 cursor-pointer ${
              isLocked 
                ? 'bg-red-500/10 text-red-500/80 border-red-500/15' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            {isLocked ? '🔒 Force Locked' : '🔓 Active Window'}
          </button>

          <button 
            type="button"
            onClick={() => {
              setIsResultsSubmitted(false);
              setIsMvpSubmitted(false);
              if (isFootball) {
                setTeamAScore(3);
                setTeamBScore(2);
              }
              if (isMovie || isDining) {
                setMemories(prev => prev.map(m => {
                  if (m.id !== memory.id) return m;
                  const updatedRatings = { ...(isMovie ? m.movieRatings : m.diningRatings) || {} };
                  delete updatedRatings[myKey];
                  return {
                    ...m,
                    movieRatings: isMovie ? updatedRatings : m.movieRatings,
                    diningRatings: isDining ? updatedRatings : m.diningRatings,
                  };
                }));
              }
            }}
            id="reset_states_btn"
            className="text-[9px] font-mono font-bold tracking-wider text-zinc-555 hover:text-zinc-300 bg-zinc-900 border border-white/5 px-2 py-1 rounded-full transition-colors active:scale-95"
          >
            Reset Form
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-5 py-4 space-y-5">

        {/* SECTION 1: COMPLETED PLAN CARD */}
        <div id="completed_hero_card" className="relative w-full aspect-[16/10] rounded-[22px] overflow-hidden border border-white/5 shadow-2xl">
          <img 
            src={memory.image} 
            alt={memory.title}
            className="w-full h-full object-cover grayscale-[15%] brightness-[85%]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent z-10" />

          {/* Core Info Overlay */}
          <div className="absolute inset-0 p-4.5 flex flex-col justify-end z-20 text-left">
            <div className="flex items-center gap-1.5 self-start mb-1.5">
              <span className="px-2.5 py-0.5 text-[8.5px] uppercase font-mono tracking-widest bg-emerald-500/20 text-emerald-400 font-bold rounded-full border border-emerald-500/10 backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Completed
              </span>
            </div>

            <h1 className="text-[20px] font-black text-white leading-tight tracking-tight select-none">
              {memory.title}
            </h1>

            <div className="flex items-center gap-3 text-zinc-400 text-[11px] mt-1.5 font-medium">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                <span className="truncate max-w-[125px]">{memory.location.split(',')[0]}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500 shrink-0" />
                <span>{memory.time.split('•')[0]}</span>
              </div>
              
              {/* Interactive Attendees Badge */}
              <button
                onClick={() => setIsParticipantSheetOpen(true)}
                id="view_attendees_sheet_btn"
                className="flex items-center gap-1 font-mono font-bold text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20 ml-auto transition-all cursor-pointer text-[10.5px] active:scale-95 shadow-sm"
              >
                <Users className="w-3 h-3 shrink-0" />
                <span>{attendeesList.length} Attended</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: MEMORY CONTRIBUTION COMPLETE STATE SUCCESS BANNER */}
        <AnimatePresence>
          {isContributionComplete && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              id="contribution_complete_banner"
              className="bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.08)]"
            >
              <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-emerald-400 font-mono tracking-wide uppercase">
                  ✓ Memory Contribution Complete
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {(isMovie || isDining) 
                    ? "Your rating and written review have been successfully recorded."
                    : "Your session record and MVP vote have been successfully recorded."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================
            FOOTBALL SPECIFIC RECAP LAYOUT SECTION
           ========================================= */}
        {isFootball && (
          <>
            {/* 1. MATCH RESULT */}
            <div id="football_match_result_card" className="bg-[#0B0B0D] border border-orange-500/15 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,107,44,0.03)] text-left">
              <div className="flex justify-between items-center mb-3 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-extrabold">
                    {isLocked ? '🔒 Final Score' : '⚽ MATCH RESULT'}
                  </span>
                  {!isLocked && (
                    <span className="text-[8.5px] bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1.5 py-0.5 uppercase font-mono font-black">
                      Host Only
                    </span>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!isResultsSubmitted && !isLocked ? (
                  <motion.div 
                    key="editable-football-score"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {isHost ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                            <span className="text-[10.5px] font-mono font-bold text-zinc-500 pl-1 uppercase">Team A</span>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => setTeamAScore(prev => Math.max(0, prev - 1))}
                                className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center hover:bg-zinc-850 active:scale-95 transition-all text-zinc-400"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold text-white w-4 text-center">
                                {teamAScore}
                              </span>
                              <button 
                                type="button"
                                onClick={() => setTeamAScore(prev => prev + 1)}
                                className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center hover:bg-zinc-850 active:scale-95 transition-all text-zinc-350"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="bg-zinc-950/60 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                            <span className="text-[10.5px] font-mono font-bold text-zinc-500 pl-1 uppercase">Team B</span>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button"
                                onClick={() => setTeamBScore(prev => Math.max(0, prev - 1))}
                                className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center hover:bg-zinc-850 active:scale-95 transition-all text-zinc-400"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-bold text-white w-4 text-center">
                                {teamBScore}
                              </span>
                              <button 
                                type="button"
                                onClick={() => setTeamBScore(prev => prev + 1)}
                                className="w-7 h-7 bg-zinc-900 border border-white/5 rounded-lg flex items-center justify-center hover:bg-zinc-850 active:scale-95 transition-all text-zinc-350"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleConfirmFootballScore}
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-zinc-950 font-black text-xs font-mono py-2.5 rounded-xl shadow-lg active:scale-98 transition-all uppercase tracking-wider"
                        >
                          Confirm & Submit Score
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-zinc-950/40 border border-dashed border-zinc-850 rounded-xl text-center">
                        <span className="text-xl animate-pulse block mb-1">⏳</span>
                        <p className="text-xs font-mono text-zinc-400">Waiting for host to submit match score...</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="submitted-football-score"
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-zinc-950/40 p-4 rounded-xl border border-emerald-500/20 text-center relative overflow-hidden"
                  >
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-1">
                        {isLocked ? <span className="text-sm">🔒</span> : <Check className="w-4.5 h-4.5 text-emerald-400" />}
                      </div>
                      
                      <span className="text-xs font-mono font-black text-emerald-400 uppercase tracking-wide">
                        {isLocked ? '✓ Final Score' : '✓ Match Score Submitted'}
                      </span>

                      <div className="flex items-center gap-10 justify-center py-2 px-6 bg-zinc-950/60 rounded-xl border border-white/5 mt-1.5 w-full">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-zinc-400 font-bold tracking-wider">TEAM A</span>
                          <span className="text-xl font-black font-mono text-white mt-1">{teamAScore}</span>
                        </div>
                        <span className="text-zinc-700 font-black">—</span>
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] text-zinc-400 font-bold tracking-wider">TEAM B</span>
                          <span className="text-xl font-black font-mono text-white mt-1">{teamBScore}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. MATCH WINNER CARD */}
            {(isResultsSubmitted || isLocked) && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                id="football_match_winner_card" 
                className="bg-gradient-to-b from-amber-500/[0.12] to-amber-500/[0.01] border border-amber-500/25 rounded-2xl p-4.5 flex flex-col items-center justify-center text-center space-y-2 select-none shadow-md"
              >
                <span className="text-2xl animate-bounce">🏆</span>
                <div>
                  <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-amber-500 font-extrabold block">
                    🏆 MATCH WINNER
                  </span>
                  <h2 className="text-[20px] font-black text-white leading-tight mt-1">
                    {teamAScore > teamBScore ? 'Team A' : teamBScore > teamAScore ? 'Team B' : "It's a Draw!"}
                  </h2>
                </div>
              </motion.div>
            )}

            {/* 3. MVP VOTING */}
            {isLocked ? (
              <div className="bg-[#0B0B0D] border border-white/5 rounded-2xl p-5 flex flex-col space-y-4 text-left">
                <div className="flex items-center gap-1.5 border-b border-white/[0.03] pb-3">
                  <Award className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-mono font-black text-zinc-300 uppercase tracking-wider">
                    Session MVP Winner
                  </h3>
                </div>

                <div className="space-y-3">
                  {mvpWinners.map((winnerName) => (
                    <div key={winnerName} className="bg-gradient-to-r from-amber-500/10 via-zinc-950/40 to-transparent border border-white/[0.04] p-3.5 rounded-xl flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getPlayerAvatar(winnerName)} 
                          className="w-11 h-11 rounded-full object-cover border border-amber-500/30" 
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="text-[8px] font-mono uppercase text-amber-500 font-bold tracking-widest block leading-none">
                            MOST VALUABLE PLAYER
                          </span>
                          <span className="text-sm font-extrabold text-zinc-100 mt-1 block leading-tight">
                            {winnerName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : !isMvpSubmitted ? (
              <div className="bg-[#0B0B0D] border border-white/5 rounded-2xl p-4 flex flex-col space-y-3 text-left">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-350">
                    👑 Vote Session MVP
                  </h3>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {attendeesList.map((attendee) => {
                    const isSelf = attendee.name.toLowerCase().includes('thilaka');
                    const isSelected = memory.votedUserMvp === attendee.name;

                    return (
                      <button
                        key={attendee.name}
                        type="button"
                        disabled={isSelf}
                        onClick={() => handleVoteMvp(attendee.name)}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[#FF6B2C]/10 border-[#FF6B2C] text-[#FF6B2C]' 
                            : isSelf 
                              ? 'opacity-25 cursor-not-allowed'
                              : 'bg-zinc-950 border-white/5 text-zinc-400'
                        }`}
                      >
                        <img src={attendee.avatar} className="w-7.5 h-7.5 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                        <span className="text-[8.5px] font-bold mt-1.5 truncate max-w-full leading-none">
                          {isSelf ? 'Me' : attendee.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#0B0B0D] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
                <div>
                  <h3 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-300">
                    👑 Your MVP Vote
                  </h3>
                </div>
                <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/15 px-4 py-2.5 rounded-xl justify-center">
                  <img src={getPlayerAvatar(memory.votedUserMvp || 'Alex Rivera')} className="w-8 h-8 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                  <span className="text-xs font-extrabold text-zinc-200">
                    {memory.votedUserMvp || 'Alex Rivera'}
                  </span>
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================
            BADMINTON SPECIFIC RECAP LAYOUT SECTION
           ========================================= */}
        {!isFootball && !isMovie && !isDining && (
          <>
            {hasEnoughResults && (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-b from-amber-500/[0.12] to-amber-500/[0.01] border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <img src={getPlayerAvatar(currentWinner.name)} className="w-12 h-12 rounded-full object-cover border-2 border-amber-500" alt="" referrerPolicy="no-referrer" />
                  <div>
                    <span className="text-[8px] font-mono uppercase tracking-[0.15em] text-amber-500 font-extrabold block">🏆 SESSION WINNER</span>
                    <h2 className="text-[17px] font-black text-white mt-0.5">{currentWinner.name.split(' ')[0]}</h2>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{currentWinner.wins} Wins • {currentWinner.losses} Losses</p>
                  </div>
                </div>
                <span className="text-2xl animate-bounce">🏆</span>
              </motion.div>
            )}

            {/* LEADERBOARD STANDINGS */}
            <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4 text-left">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-455 mb-3">🏸 Standings</h3>
              <div className="space-y-2">
                {sortedLeaderboard.map((player, index) => (
                  <div key={player.name} className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-zinc-555">#{index + 1}</span>
                      <img src={player.avatar} className="w-6.5 h-6.5 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                      <span className="text-xs font-bold text-zinc-200">{player.name}</span>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">{player.wins}W - {player.losses}L</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RECORD RESULT PANEL */}
            {!isLocked && (
              <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-4 text-left space-y-3">
                <h3 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-455">✏️ Log Your Score</h3>
                <div className="flex justify-around items-center bg-black/40 p-3 rounded-xl border border-white/[0.02]">
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-555 block mb-1">WINS</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleUpdateStats('wins', -1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center">-</button>
                      <span className="text-xs font-bold text-white w-4">{myCurrentStats.wins}</span>
                      <button type="button" onClick={() => handleUpdateStats('wins', 1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center">+</button>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-mono text-zinc-555 block mb-1">LOSSES</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleUpdateStats('losses', -1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center">-</button>
                      <span className="text-xs font-bold text-white w-4">{myCurrentStats.losses}</span>
                      <button type="button" onClick={() => handleUpdateStats('losses', 1)} className="w-6 h-6 rounded bg-zinc-900 border border-white/5 flex items-center justify-center">+</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================
            MOVIES & DINING RECAP LAYOUT SECTION
           ========================================= */}
        {(isMovie || isDining) && (
          <div className="bg-[#0b0b0d] border border-white/5 rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.03] pb-3">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-zinc-300">
                {isMovie ? '🎬 Cinema Verdict' : '🍴 Dining Review'}
              </h3>
            </div>

            {hasSubmittedReview && !isEditingReview ? (
              <div className="space-y-4">
                <div className="bg-zinc-950/40 p-4 rounded-xl border border-[#FF6B2C]/20 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-zinc-555 uppercase tracking-widest">Your logged review</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Saved</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[#FF6B2C]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= (activeRatingObj?.rating || 0) ? 'fill-current' : 'opacity-25'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-350 italic mt-2.5 font-sans leading-relaxed">
                    "{activeRatingObj?.review || 'No written review provided.'}"
                  </p>
                  {!isLocked && (
                    <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-white/[0.03]">
                      <button
                        type="button"
                        onClick={() => setIsEditingReview(true)}
                        className="text-[9.5px] font-mono font-black uppercase text-orange-400 hover:text-orange-350 transition cursor-pointer"
                      >
                        ✏️ Edit Review
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveReview}
                        className="text-[9.5px] font-mono font-black uppercase text-red-500 hover:text-red-400 transition cursor-pointer ml-auto"
                      >
                        🗑 Delete Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono text-zinc-555 uppercase tracking-widest mb-2">Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        className="text-zinc-500 hover:text-[#FF6B2C] transition cursor-pointer"
                      >
                        <Star className={`w-6 h-6 ${star <= selectedRating ? 'text-[#FF6B2C] fill-current' : 'opacity-35'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-zinc-555 uppercase tracking-widest mb-1.5">Review</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Provide a short written review..."
                    className="w-full bg-zinc-950/60 border border-white/[0.08] focus:border-[#FF6B2C] rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none h-20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={selectedRating === 0}
                  className="w-full py-2.5 rounded-xl font-bold font-sans text-xs uppercase tracking-wider text-zinc-950 bg-[#FF6B2C] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        )}

        {/* FUN FACTOR ROW */}
        {!isLocked && (
          <div className="flex justify-between items-center p-4 bg-[#0b0b0d] border border-white/5 rounded-2xl select-none text-left">
            <div>
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Fun Rating</h4>
              <p className="text-[10px] text-zinc-650 mt-0.5">Increment general meetup vibe rating</p>
            </div>
            <button
              onClick={handleUpdateFunFactor}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black transition active:scale-95 border cursor-pointer ${
                memory.userClickedFunFactor 
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-500' 
                  : 'bg-zinc-900 border-white/5 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              🔥 {memory.funFactorCount}
            </button>
          </div>
        )}

      </div>

      {/* VIEW PARTICIPANTS OVERLAY MODAL */}
      {isParticipantSheetOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-5 text-left select-none">
          <div className="bg-[#0D0D10]/95 border border-white/[0.08] rounded-2.5xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-black/45">
              <h3 className="text-xs font-black font-sans uppercase text-white tracking-widest">
                MEMBERS ATTENDED ({attendeesList.length})
              </h3>
              <button 
                type="button" 
                onClick={() => setIsParticipantSheetOpen(false)}
                className="text-zinc-500 hover:text-white transition duration-150 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {attendeesList.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <img src={p.avatar} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <span className="text-xs font-bold text-white block leading-tight">{p.name}</span>
                      {p.isHost && (
                        <span className="text-[9px] text-[#FF6B2C] font-mono uppercase tracking-wider font-bold">HOST</span>
                      )}
                    </div>
                  </div>
                  {isHost && p.name !== myKey && !isLocked && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAttendee(p.name)}
                      className="p-1 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION NOTIFICATION TOAST */}
      <AnimatePresence>
        {floatingToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] bg-[#121218] border border-white/10 px-4.5 py-3 rounded-2xl flex items-center gap-3 shadow-2xl max-w-xs w-full pointer-events-none text-left"
          >
            <div className="w-6 h-6 rounded-full bg-[#FF6B2C]/15 border border-[#FF6B2C]/30 flex items-center justify-center text-[#FF6B2C] shrink-0 font-bold">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <p className="text-white font-sans font-black text-[10.5px] tracking-wide uppercase leading-tight">
              {floatingToast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
