import { Router } from "express";
import { getSupabaseClient } from "../server";

const router = Router();

const MOCK_SECTIONS: Record<string, any[]> = {
  sports: [
    {
      id: "sec_sports1",
      public_id: "sec_sports_curated",
      category: "SPORTS",
      title: "Curated Sports Matches",
      description: "Curated matches to book with friends",
      display_order: 1,
      status: "ACTIVE",
      items: [
        {
          id: "item_sports_football",
          public_id: "DISC000001",
          section_id: "sec_sports1",
          title: "Football Turf Match",
          category: "SPORTS",
          subcategory: "FOOTBALL",
          description: "Casual 5v5 friendly game on turf",
          cover_image_url: "/assets/plan-covers/football.png",
          location: "Play Arena Turf HSR",
          suggested_duration_minutes: 90,
          suggested_cost_amount: 120,
          suggested_capacity: 14,
          default_rsvp_offset_minutes: 60,
          display_order: 1,
          featured: false,
          status: "ACTIVE"
        },
        {
          id: "item_sports_badminton",
          public_id: "DISC000002",
          section_id: "sec_sports1",
          title: "Badminton singles / doubles",
          category: "SPORTS",
          subcategory: "BADMINTON",
          description: "Indoor synthetic court play session",
          cover_image_url: "/assets/plan-covers/badminton.png",
          location: "Navkis Indoor Arena",
          suggested_duration_minutes: 60,
          suggested_cost_amount: 100,
          suggested_capacity: 4,
          default_rsvp_offset_minutes: 60,
          display_order: 2,
          featured: false,
          status: "ACTIVE"
        }
      ]
    }
  ],
  movies: [
    {
      id: "sec_movies1",
      public_id: "sec_movies_curated",
      category: "MOVIES",
      title: "Trending Movies",
      description: "Curated movies to watch in theatres",
      display_order: 1,
      status: "ACTIVE",
      items: [
        {
          id: "item_movies_imax",
          public_id: "DISC000003",
          section_id: "sec_movies1",
          title: "IMAX Premiere Night",
          category: "MOVIES",
          subcategory: "ACTION",
          description: "Latest cinematic blockbuster release",
          cover_image_url: "/assets/plan-covers/movie.png",
          location: "Nexus IMAX Koramangala",
          suggested_duration_minutes: 150,
          suggested_cost_amount: 350,
          suggested_capacity: 5,
          default_rsvp_offset_minutes: 60,
          display_order: 1,
          featured: false,
          status: "ACTIVE"
        }
      ]
    }
  ],
  dining: [
    {
      id: "sec_dining1",
      public_id: "sec_dining_curated",
      category: "DINING",
      title: "Top Dining Choices",
      description: "Curated restaurants and cafes near you",
      display_order: 1,
      status: "ACTIVE",
      items: [
        {
          id: "item_dining_toit",
          public_id: "DISC000004",
          section_id: "sec_dining1",
          title: "Gourmet Brewery Dinner",
          category: "DINING",
          subcategory: "BREWERY",
          description: "Toit wood-fired pizzas & craft brews",
          cover_image_url: "/assets/plan-covers/dining.png",
          location: "Toit, Indiranagar",
          suggested_duration_minutes: 120,
          suggested_cost_amount: 800,
          suggested_capacity: 6,
          default_rsvp_offset_minutes: 60,
          display_order: 1,
          featured: false,
          status: "ACTIVE"
        }
      ]
    }
  ],
  drinks: [
    {
      id: "sec_drinks1",
      public_id: "sec_drinks_curated",
      category: "DRINKS",
      title: "Curated Nightlife & Drinks",
      description: "Trending bars, pubs and breweries",
      display_order: 1,
      status: "ACTIVE",
      items: [
        {
          id: "item_drinks_social",
          public_id: "DISC000005",
          section_id: "sec_drinks1",
          title: "Rooftop Cocktails",
          category: "DRINKS",
          subcategory: "COCKTAIL_BAR",
          description: "Signature drinks with panoramic cityscape views",
          cover_image_url: "/assets/plan-covers/dining.png",
          location: "Social Rooftop HSR",
          suggested_duration_minutes: 180,
          suggested_cost_amount: 500,
          suggested_capacity: 8,
          default_rsvp_offset_minutes: 60,
          display_order: 1,
          featured: false,
          status: "ACTIVE"
        }
      ]
    }
  ]
};

router.get("/sections", async (req, res) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return res.json(MOCK_SECTIONS.sports.concat(MOCK_SECTIONS.movies).concat(MOCK_SECTIONS.dining).concat(MOCK_SECTIONS.drinks));
    }

    const { data, error } = await client
      .from("discovery_sections")
      .select("*")
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.warn("[Discovery Router] DB error, falling back to mock sections:", err.message);
    const allMock = MOCK_SECTIONS.sports.concat(MOCK_SECTIONS.movies).concat(MOCK_SECTIONS.dining).concat(MOCK_SECTIONS.drinks);
    res.json(allMock);
  }
});

router.get("/items", async (req, res) => {
  try {
    const client = getSupabaseClient();
    if (!client) {
      const allItems = Object.values(MOCK_SECTIONS).flatMap(sec => sec.flatMap(s => s.items || []));
      return res.json(allItems);
    }

    const { data, error } = await client
      .from("discovery_items")
      .select("*")
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err: any) {
    console.warn("[Discovery Router] DB error, falling back to mock items:", err.message);
    const allItems = Object.values(MOCK_SECTIONS).flatMap(sec => sec.flatMap(s => s.items || []));
    res.json(allItems);
  }
});

router.get("/by-category/:category", async (req, res) => {
  try {
    const client = getSupabaseClient();
    const category = req.params.category.toUpperCase();

    if (!client) {
      const fallbackKey = req.params.category.toLowerCase();
      if (fallbackKey === "all") {
        return res.json(MOCK_SECTIONS.sports.concat(MOCK_SECTIONS.movies).concat(MOCK_SECTIONS.dining));
      }
      return res.json(MOCK_SECTIONS[fallbackKey] || []);
    }

    // For ALL: fetch Sports, Movies, Dining in parallel (avoids enum .in() PostgREST limitation)
    if (category === "ALL") {
      const fetchCategory = async (cat: string) => {
        const { data: secs, error: secErr } = await client
          .from("discovery_sections")
          .select("*")
          .eq("category", cat)
          .eq("status", "ACTIVE")
          .order("display_order", { ascending: true });
        if (secErr) throw secErr;
        if (!secs || secs.length === 0) return [];
        const sectionIds = secs.map((s: any) => s.id);
        const { data: items, error: itemErr } = await client
          .from("discovery_items")
          .select("*")
          .in("section_id", sectionIds)
          .eq("status", "ACTIVE")
          .order("display_order", { ascending: true });
        if (itemErr) throw itemErr;
        return secs.map((sec: any) => ({
          ...sec,
          items: (items || []).filter((item: any) => item.section_id === sec.id)
        }));
      };

      const [sports, movies, dining] = await Promise.all([
        fetchCategory("SPORTS"),
        fetchCategory("MOVIES"),
        fetchCategory("DINING"),
      ]);
      return res.json([...sports, ...movies, ...dining]);
    }

    // Single category fetch
    const { data: sections, error: secErr } = await client
      .from("discovery_sections")
      .select("*")
      .eq("category", category)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (secErr) throw secErr;

    if (!sections || sections.length === 0) {
      res.json([]);
      return;
    }

    const sectionIds = sections.map((s: any) => s.id);

    const { data: items, error: itemErr } = await client
      .from("discovery_items")
      .select("*")
      .in("section_id", sectionIds)
      .eq("status", "ACTIVE")
      .order("display_order", { ascending: true });

    if (itemErr) throw itemErr;

    const mapped = sections.map((sec: any) => ({
      ...sec,
      items: (items || []).filter((item: any) => item.section_id === sec.id)
    }));

    res.json(mapped);
  } catch (err: any) {
    const category = req.params.category.toLowerCase();
    console.warn(`[Discovery Router] DB error for ${category}, falling back to mock:`, err.message);
    if (category === "all") {
      res.json(MOCK_SECTIONS.sports.concat(MOCK_SECTIONS.movies).concat(MOCK_SECTIONS.dining));
    } else {
      res.json(MOCK_SECTIONS[category] || []);
    }
  }
});

export default router;
