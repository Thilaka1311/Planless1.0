import { Router } from "express";
import { env } from "../config/env";

const router = Router();

// Cache instances or fetch utilities
const GOOGLE_PLACES_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * Autocomplete Endpoint
 * GET /api/maps/autocomplete?input=query&sessiontoken=optional
 */
router.get("/autocomplete", async (req, res) => {
  try {
    const { input, sessiontoken } = req.query;
    if (!input) {
      res.status(400).json({ error: "Missing 'input' parameter for search." });
      return;
    }

    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Google Maps API Key is not configured on server." });
      return;
    }

    // Build URL query string parameters
    const params = new URLSearchParams({
      input: String(input),
      key: apiKey,
      // Target specific components e.g. restrict to India (in) or keep global:
      // components: "country:in",
    });

    if (sessiontoken) {
      params.append("sessiontoken", String(sessiontoken));
    }

    const response = await fetch(`${GOOGLE_PLACES_AUTOCOMPLETE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Places Autocomplete API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Backend Maps Autocomplete Error]:", error);
    res.status(500).json({ error: error.message || "Failed to search places." });
  }
});

/**
 * Place Details Endpoint
 * GET /api/maps/place-details?placeid=id&sessiontoken=optional
 */
router.get("/place-details", async (req, res) => {
  try {
    const { placeid, sessiontoken } = req.query;
    if (!placeid) {
      res.status(400).json({ error: "Missing 'placeid' parameter." });
      return;
    }

    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Google Maps API Key is not configured on server." });
      return;
    }

    const params = new URLSearchParams({
      place_id: String(placeid),
      key: apiKey,
      // Retrieve name, formatted_address, and geometry for lat/lng
      fields: "place_id,name,formatted_address,geometry",
    });

    if (sessiontoken) {
      params.append("sessiontoken", String(sessiontoken));
    }

    const response = await fetch(`${GOOGLE_PLACE_DETAILS_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Place Details API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Backend Maps Place Details Error]:", error);
    res.status(500).json({ error: error.message || "Failed to fetch place details." });
  }
});

/**
 * Geocoding Endpoint
 * GET /api/maps/geocode?address=query
 */
router.get("/geocode", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      res.status(400).json({ error: "Missing 'address' parameter." });
      return;
    }

    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Google Maps API Key is not configured on server." });
      return;
    }

    const params = new URLSearchParams({
      address: String(address),
      key: apiKey,
    });

    const response = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Google Geocoding API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Backend Maps Geocoding Error]:", error);
    res.status(500).json({ error: error.message || "Failed to geocode address." });
  }
});

export default router;
