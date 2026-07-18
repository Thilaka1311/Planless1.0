import type { IncomingMessage, ServerResponse } from "http";
import { fetchGeocode } from "../../../../lib/googleMaps";

export interface VercelRequest extends IncomingMessage {
  query: {
    [key: string]: string | string[];
  };
  cookies: {
    [key: string]: string;
  };
  body: any;
}

export interface VercelResponse extends ServerResponse {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(451).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const { address } = req.query;
    if (!address) {
      res.status(400).json({ error: "Missing 'address' parameter." });
      return;
    }

    const data = await fetchGeocode(
      Array.isArray(address) ? address[0] : String(address)
    );

    res.status(200).json(data);
  } catch (error: any) {
    console.error("[Vercel Maps Geocode Error]:", error);
    const status = error.message.includes("Missing") ? 400 : 500;
    res.status(status).json({ error: error.message || "Failed to geocode address." });
  }
}
