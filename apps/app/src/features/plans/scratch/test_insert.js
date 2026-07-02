import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const url = "https://apxuggqvpykdmnqhimzd.supabase.co";
const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "2c09f6a4-d748-4319-9597-7dcd4346e036";
const client = createClient(url, key);

async function test() {
  const memoryRecord = {
    title: "Test Cancelled Plan",
    category: "sports",
    subcategory: "football",
    status: "cancelled",
    scheduled_at: new Date().toISOString(),
    outcome_text: "Plan Cancelled"
  };

  const { data, error } = await client.from("memories").insert([memoryRecord]).select("*");
  console.log("INSERT RESULT:", { data, error });
}

test();
