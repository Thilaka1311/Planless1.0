export const CATEGORY_EMOJI: Record<string, string> = {
  sports: "⚽",
  movies: "🎬",
  dining: "🍝",
  custom: "✨",
};

export const getCategoryImage = (cat: string, sub: string | null): string => {
  if (cat === 'sports') {
    switch (sub) {
      case 'football': return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80';
      case 'badminton': return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80';
      default: return 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=800';
    }
  }
  if (cat === 'movies') return 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800';
  if (cat === 'dining') return 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800';
};

export const RECENT_PLACES = [
  'Play Arena HSR',
  'Toit Indiranagar',
  'Nexus IMAX',
  'Social Indiranagar'
];

export const RSVP_DEADLINE_OPTIONS = [
  '1 hour before',
  '3 hours before',
  '6 hours before',
  '12 hours before',
  '24 hours before',
  'Custom'
];
