import { corsHeaders } from "./shared/cors.ts";
import { handleAutocomplete } from "./handlers/autocomplete.ts";
import { handlePlaceDetails } from "./handlers/placeDetails.ts";
import { handleGeocode } from "./handlers/geocode.ts";
declare const Deno: any;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    let result;
    if (action === "autocomplete") {
      result = await handleAutocomplete(body);
    } else if (action === "place-details") {
      result = await handlePlaceDetails(body);
    } else if (action === "geocode") {
      result = await handleGeocode(body);
    } else {
      return new Response(JSON.stringify({ error: `Invalid action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Edge Function Error]:", error);
    const status = error.message.includes("Missing") ? 400 : 500;
    return new Response(JSON.stringify({ error: error.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
