import { Router } from "express";
import { Resend } from "resend";
import { env } from "../config/env";

const router = Router();

// Fallback to placeholder key if not set in environment
const RESEND_API_KEY = env.RESEND_API_KEY || "re_xxxxxxxxx";
const resend = new Resend(RESEND_API_KEY);

export async function sendOnboardingEmail(toEmail: string) {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: toEmail,
      subject: "Hello World",
      html: "<p>Congrats on sending your <strong>first email</strong>!</p>"
    });
    return { success: true, data };
  } catch (error: any) {
    console.error("[Resend Email Error]", error);
    return { success: false, error: error.message || error };
  }
}

// POST endpoint to trigger the test email
router.post("/send-test-email", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }
  
  if (RESEND_API_KEY === "re_xxxxxxxxx") {
    res.status(400).json({ 
      error: "Resend API key is not configured. Please replace 're_xxxxxxxxx' in your .env file with your real Resend API key." 
    });
    return;
  }

  const result = await sendOnboardingEmail(email);
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(500).json({ error: result.error });
  }
});

export default router;
