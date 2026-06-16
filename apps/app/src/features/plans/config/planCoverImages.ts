import football from "../../../assets/plan-covers/football.png";
import badminton from "../../../assets/plan-covers/badminton.png";
import movie from "../../../assets/plan-covers/movie.png";
import dining from "../../../assets/plan-covers/dining.png";
import defaultCover from "../../../assets/plan-covers/default.png";

export const PLAN_COVER_IMAGES = {
  football,
  badminton,
  movie,
  dining,
  default: defaultCover,
};

export function getPlanCover(activityType?: string, subcategory?: string | null): string {
  const normActivity = (activityType || "").toLowerCase().trim();
  const normSub = (subcategory || "").toLowerCase().trim();

  // 1. Check Custom category
  if (normActivity === "custom" || normSub === "custom") {
    return PLAN_COVER_IMAGES.default;
  }

  // 2. Resolve known categories
  // Sports -> Football / Soccer
  if (
    normActivity === "football" || 
    normActivity === "soccer" || 
    ((normActivity === "sports" || normActivity === "sport") && (normSub === "football" || normSub === "soccer"))
  ) {
    return PLAN_COVER_IMAGES.football;
  }

  // Sports -> Badminton
  if (
    normActivity === "badminton" || 
    ((normActivity === "sports" || normActivity === "sport") && normSub === "badminton")
  ) {
    return PLAN_COVER_IMAGES.badminton;
  }

  // Movies
  if (normActivity === "movies" || normActivity === "movie" || normActivity === "cinema") {
    return PLAN_COVER_IMAGES.movie;
  }

  // Dining
  if (
    normActivity === "dining" ||
    normActivity === "restaurants" ||
    normActivity === "restaurant" ||
    normActivity === "cafe" ||
    normActivity === "brunch" ||
    normActivity === "coffee"
  ) {
    return PLAN_COVER_IMAGES.dining;
  }

  // 3. Unresolved non-custom activity mapping -> Log development warning and fallback to default
  console.warn(`Missing cover image mapping for activity:\n${activityType}`);
  return PLAN_COVER_IMAGES.default;
}
