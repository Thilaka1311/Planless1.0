const GOOGLE_PLACES_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const GOOGLE_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json";
const GOOGLE_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps API Key is not configured on server.");
  }
  return apiKey;
}

export async function fetchAutocomplete(input: string, sessiontoken?: string) {
  if (!input) {
    throw new Error("Missing 'input' parameter for search.");
  }

  const apiKey = getApiKey();
  const params = new URLSearchParams({
    input,
    key: apiKey,
  });

  if (sessiontoken) {
    params.append("sessiontoken", sessiontoken);
  }

  const response = await fetch(`${GOOGLE_PLACES_AUTOCOMPLETE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Places Autocomplete API returned status ${response.status}`);
  }

  return response.json();
}

export async function fetchPlaceDetails(placeid: string, sessiontoken?: string) {
  if (!placeid) {
    throw new Error("Missing 'placeid' parameter.");
  }

  const apiKey = getApiKey();
  const params = new URLSearchParams({
    place_id: placeid,
    key: apiKey,
    fields: "place_id,name,formatted_address,geometry",
  });

  if (sessiontoken) {
    params.append("sessiontoken", sessiontoken);
  }

  const response = await fetch(`${GOOGLE_PLACE_DETAILS_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Place Details API returned status ${response.status}`);
  }

  return response.json();
}

export async function fetchGeocode(address: string) {
  if (!address) {
    throw new Error("Missing 'address' parameter.");
  }

  const apiKey = getApiKey();
  const params = new URLSearchParams({
    address,
    key: apiKey,
  });

  const response = await fetch(`${GOOGLE_GEOCODE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Geocoding API returned status ${response.status}`);
  }

  return response.json();
}
