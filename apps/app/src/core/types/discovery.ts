export type DiscoveryCategory = "SPORTS" | "MOVIES" | "DINING" | "DRINKS" | "CUSTOM" | "QUICK_PLAN";
export type DiscoveryStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface DiscoverySection {
  id: string;
  public_id: string;
  category: DiscoveryCategory;
  title: string;
  description: string | null;
  display_order: number;
  status: DiscoveryStatus;
  created_at: string;
  updated_at: string;
  items?: DiscoveryItem[];
}

export interface DiscoveryItem {
  id: string;
  public_id: string;
  section_id: string;
  title: string;
  category: DiscoveryCategory;
  subcategory: string | null;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  suggested_duration_minutes: number | null;
  suggested_cost_amount: number | null;
  suggested_capacity: number | null;
  default_rsvp_offset_minutes: number | null;
  display_order: number;
  featured: boolean;
  status: DiscoveryStatus;
  created_at: string;
  updated_at: string;
}
