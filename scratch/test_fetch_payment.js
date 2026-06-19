const Razorpay = require("c:\\Users\\moham\\consent-gen\\node_modules\\razorpay");
const fs = require("fs");

// Simple parser for env
const envContent = fs.readFileSync("c:\\Users\\moham\\consent-gen\\.env.local", "utf8");
const env = {};
envContent.split("\n").forEach(line => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const keyId = env.RAZORPAY_KEY_ID;
const keySecret = env.RAZORPAY_KEY_SECRET;

console.log("Keys:", { keyId, keySecret });

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

const paymentId = "pay_T31tgb8bOrjf5k";

razorpay.payments.fetch(paymentId)
  .then(payment => {
    console.log("Payment details:", payment);
  })
  .catch(err => {
    console.error("Fetch error:", err);
  });
