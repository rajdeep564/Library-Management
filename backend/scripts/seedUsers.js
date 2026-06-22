/**
 * Seed default test users (README credentials).
 * Run from backend/: npm run seed:users
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { UserModel } = require("../model/UserModel");

const TEST_USERS = [
  {
    name: "System Admin",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Test Librarian",
    email: "librarian@example.com",
    password: "lib123",
    role: "librarian",
  },
  {
    name: "Test Student",
    email: "student@example.com",
    password: "student123",
    role: "user",
    stream: "Computer Science",
    year: 2,
  },
];

async function seed() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is missing. Set it in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  for (const u of TEST_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const existing = await UserModel.findOne({ email: u.email });

    if (existing) {
      existing.name = u.name;
      existing.password = hashedPassword;
      existing.role = u.role;
      if (u.role === "user") {
        existing.stream = u.stream;
        existing.year = u.year;
      } else {
        existing.set("stream", undefined);
        existing.set("year", undefined);
      }
      await existing.save();
      console.log(`Updated: ${u.email} (${u.role})`);
    } else {
      await UserModel.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        ...(u.role === "user" ? { stream: u.stream, year: u.year } : {}),
      });
      console.log(`Created: ${u.email} (${u.role})`);
    }
  }

  console.log("\nTest credentials:");
  console.log("  Admin:     admin@example.com / admin123  → /admin-login");
  console.log("  Librarian: librarian@example.com / lib123  → /login");
  console.log("  Student:   student@example.com / student123  → /login");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
