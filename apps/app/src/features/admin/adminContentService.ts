import { supabase } from "../../lib/supabaseClient";

// ─── Field & Content config types ────────────────────────────────────────────

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'image';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

export interface ContentConfig {
  type: string;
  title: string;
  category: 'SPORTS' | 'MOVIES' | 'DINING' | 'DRINKS';
  section_id: string;
  fields: FieldConfig[];
}

// ─── Content configurations ───────────────────────────────────────────────────

export const ADMIN_CONFIGS: Record<string, ContentConfig> = {
  turfs: {
    type: 'turfs',
    title: 'Turfs',
    category: 'SPORTS',
    section_id: '6dca5b0c-81e8-405a-851b-1a84664af845',
    fields: [
      { name: 'title', label: 'Turf Name', type: 'text', required: true, placeholder: 'e.g. Play Arena Turf HSR' },
      {
        name: 'subcategory', label: 'Sport Supported', type: 'select', required: true, options: [
          { label: 'Football', value: 'FOOTBALL' },
          { label: 'Badminton', value: 'BADMINTON' },
          { label: 'Cricket', value: 'CRICKET' },
          { label: 'Basketball', value: 'BASKETBALL' },
          { label: 'Tennis', value: 'TENNIS' },
        ], defaultValue: 'FOOTBALL'
      },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'e.g. Casual 5v5 friendly game on turf' },
      { name: 'location', label: 'Address / Venue Location', type: 'text', required: true, placeholder: 'e.g. Play Arena, Kasavanahalli' },
      { name: 'cover_image_url', label: 'Cover Image', type: 'image', defaultValue: '/assets/plan-covers/football.png' },
      { name: 'suggested_duration_minutes', label: 'Suggested Duration (minutes)', type: 'number', defaultValue: 90 },
      { name: 'suggested_cost_amount', label: 'Suggested Cost Per Person', type: 'number', defaultValue: 150 },
      { name: 'suggested_capacity', label: 'Suggested Capacity (spots)', type: 'number', defaultValue: 10 },
      { name: 'default_rsvp_offset_minutes', label: 'RSVP Cutoff (minutes before start)', type: 'number', defaultValue: 60 },
      { name: 'display_order', label: 'Display Order', type: 'number', defaultValue: 1 },
      { name: 'featured', label: 'Featured Turf', type: 'boolean', defaultValue: false },
    ]
  },
  movies: {
    type: 'movies',
    title: 'Movies',
    category: 'MOVIES',
    section_id: 'ac6c3c7d-2717-4277-8e9e-82570b1ceedf',
    fields: [
      { name: 'title', label: 'Movie Title', type: 'text', required: true, placeholder: 'e.g. IMAX Blockbuster Premiere' },
      {
        name: 'subcategory', label: 'Genre', type: 'select', required: true, options: [
          { label: 'Action', value: 'ACTION' },
          { label: 'Comedy', value: 'COMEDY' },
          { label: 'Drama', value: 'DRAMA' },
          { label: 'Sci-Fi', value: 'SCI-FI' },
          { label: 'Thriller', value: 'THRILLER' },
          { label: 'Anime', value: 'ANIME' }
        ], defaultValue: 'ACTION'
      },
      { name: 'description', label: 'Description / Synopsis', type: 'textarea', placeholder: 'e.g. Latest cinematic blockbuster release' },
      { name: 'location', label: 'Cinema Location', type: 'text', required: true, placeholder: 'e.g. Nexus IMAX Koramangala' },
      { name: 'cover_image_url', label: 'Movie Poster / Image', type: 'image', defaultValue: '/assets/plan-covers/movie.png' },
      { name: 'suggested_duration_minutes', label: 'Duration (minutes)', type: 'number', defaultValue: 150 },
      { name: 'suggested_cost_amount', label: 'Ticket Cost', type: 'number', defaultValue: 350 },
      { name: 'suggested_capacity', label: 'Suggested Group Size', type: 'number', defaultValue: 6 },
      { name: 'default_rsvp_offset_minutes', label: 'RSVP Cutoff (minutes before start)', type: 'number', defaultValue: 60 },
      { name: 'display_order', label: 'Display Order', type: 'number', defaultValue: 1 },
      { name: 'featured', label: 'Featured Movie', type: 'boolean', defaultValue: false },
    ]
  }
};

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function adminFetchItems(category: ContentConfig['category'], token?: string): Promise<any[]> {
  const res = await fetch("/api/admin/discovery-items", {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Failed to fetch discovery items");
  const all = await res.json();
  return all.filter((i: any) => i.category === category);
}

export async function adminCreateItem(
  payload: Record<string, any>,
  config: ContentConfig,
  token?: string
): Promise<void> {
  const res = await fetch("/api/admin/discovery-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ...payload, category: config.category, section_id: config.section_id })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create item");
  }
}

export async function adminUpdateItem(
  id: string,
  payload: Record<string, any>,
  config: ContentConfig,
  token?: string
): Promise<void> {
  const res = await fetch(`/api/admin/discovery-items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ...payload, category: config.category, section_id: config.section_id })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update item");
  }
}

export async function adminDeleteItem(id: string, token?: string): Promise<void> {
  const res = await fetch(`/api/admin/discovery-items/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error("Failed to delete item");
}

export async function adminUploadImage(file: File): Promise<string> {
  const fileName = `discovery/img_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const { data, error } = await supabase.storage
    .from("profile-images")
    .upload(fileName, file, { contentType: file.type, upsert: true });

  if (error || !data) throw error || new Error("Upload failed");

  const { data: { publicUrl } } = supabase.storage
    .from("profile-images")
    .getPublicUrl(data.path);

  return publicUrl;
}
