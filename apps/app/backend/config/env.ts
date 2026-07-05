export interface BackendEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  GEMINI_API_KEY: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RESEND_API_KEY?: string;
  NODE_ENV?: string;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`CRITICAL STARTUP ERROR: Missing required backend environment variable "${name}".`);
  }
  return value;
}

export const env: BackendEnv = {
  SUPABASE_URL: getRequiredEnv("SUPABASE_URL"),
  SUPABASE_KEY: getRequiredEnv("SUPABASE_KEY"),
  GEMINI_API_KEY: getRequiredEnv("GEMINI_API_KEY"),
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
};
