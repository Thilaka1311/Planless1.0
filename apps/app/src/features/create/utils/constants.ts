import football from "../../../assets/plan-covers/football.png";
import badminton from "../../../assets/plan-covers/badminton.png";
import movie from "../../../assets/plan-covers/movie.png";
import dining from "../../../assets/plan-covers/dining.png";
import defaultCover from "../../../assets/plan-covers/default.png";

export const CATEGORY_EMOJI: Record<string, string> = {
  sports: "⚽",
  movies: "🎬",
  dining: "🍝",
  custom: "✨",
};

export const getCategoryImage = (cat: string, sub: string | null): string => {
  if (cat === 'sports') {
    switch (sub) {
      case 'football': return football;
      case 'badminton': return badminton;
      default: return football;
    }
  }
  if (cat === 'movies') return movie;
  if (cat === 'dining') return dining;
  return defaultCover;
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
