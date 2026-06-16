import crypto from "crypto";

const JWT_SECRET = "sb_publishable_Ql0r2aGtFaURLnWhegTDhw_GQRdbKGF_jwt_secret_9988";
const userId = "020606e7-d070-4b8c-acc7-36950447b477";

function generateToken(userId) {
  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const data = `${userId}.${expiry}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("hex");
  return `${data}.${signature}`;
}

const token = generateToken(userId);

const payload = {
  table: "memory_restaurant_votes",
  records: [
    {
      id: crypto.randomUUID(),
      memory_id: "b2a32a25-55ca-447b-aa3b-857bf0d510b6",
      user_id: userId,
      rating: 4,
      review: "so good restaurant! test from script",
      created_at: new Date().toISOString()
    }
  ]
};

fetch("http://localhost:3000/api/db/upsert", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
  .then(async (res) => {
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Body:", body);
  })
  .catch((err) => {
    console.error("Fetch Error:", err);
  });
