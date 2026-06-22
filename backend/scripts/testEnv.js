/**
 * Local env smoke test — run: node scripts/testEnv.js
 * Does not print secret values.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function testMongo() {
  if (!process.env.MONGO_URI) return fail("MongoDB", "MONGO_URI missing");
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const collections = await mongoose.connection.db.listCollections().toArray();
    pass("MongoDB", `connected (${collections.length} collections)`);
    await mongoose.disconnect();
  } catch (e) {
    fail("MongoDB", e.message);
  }
}

async function testCloudinary() {
  const { CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET } = process.env;
  if (!CLOUD_NAME || !CLOUD_API_KEY || !CLOUD_API_SECRET) {
    return fail("Cloudinary", "CLOUD_NAME / CLOUD_API_KEY / CLOUD_API_SECRET missing");
  }
  try {
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({ cloud_name: CLOUD_NAME, api_key: CLOUD_API_KEY, api_secret: CLOUD_API_SECRET });
    const res = await cloudinary.api.ping();
    if (res.status === "ok") pass("Cloudinary", `cloud: ${CLOUD_NAME}`);
    else fail("Cloudinary", JSON.stringify(res));
  } catch (e) {
    fail("Cloudinary", e.message);
  }
}

async function testResend() {
  if (!process.env.RESEND_API_KEY) return fail("Resend", "RESEND_API_KEY missing");
  try {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "e-GranthaAlaya <onboarding@resend.dev>",
      to: process.env.TEST_EMAIL || "delivered@resend.dev",
      subject: "Library Management — env test",
      html: "<p>If you receive this, Resend is configured correctly.</p>",
    });
    if (error) fail("Resend", error.message || JSON.stringify(error));
    else pass("Resend", `send ok (id: ${data?.id || "ok"})`);
  } catch (e) {
    fail("Resend", e.message);
  }
}

function testRequired() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 8) pass("JWT_SECRET", "set");
  else fail("JWT_SECRET", "missing or too short");

  if (process.env.PORT) pass("PORT", process.env.PORT);
  else pass("PORT", "5000 (default)");

  if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith("re_")) {
    fail("FRONTEND_URL", "looks like a Resend key — use a URL like https://your-app.netlify.app");
  } else if (process.env.FRONTEND_URL) {
    pass("FRONTEND_URL", process.env.FRONTEND_URL);
  } else {
    pass("FRONTEND_URL", "empty (fine for local; set on Render after deploy)");
  }
}

async function testApiHealth() {
  const port = process.env.PORT || 5000;
  try {
    const res = await fetch(`http://localhost:${port}/`);
    const text = await res.text();
    if (res.ok && text.includes("API is running")) pass("API health", `http://localhost:${port}/`);
    else fail("API health", `status ${res.status}: ${text.slice(0, 80)}`);
  } catch (e) {
    fail("API health", `server not running on port ${port} — start with npm start`);
  }
}

async function main() {
  console.log("\n=== Library Management — env smoke test ===\n");
  testRequired();
  await testMongo();
  await testCloudinary();
  await testResend();
  await testApiHealth();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${results.length - failed.length}/${results.length} passed ===\n`);
  process.exit(failed.length ? 1 : 0);
}

main();
