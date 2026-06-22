const express = require('express'); 
const app = express(); 
const cors = require('cors'); 
const mongoose = require("mongoose");
require('dotenv').config();
const users = require("./routes/user.js") 
const books = require("./routes/books.js")
const admin = require("./routes/admin.js")
const librarian = require("./routes/librarian.js")
const home = require("./routes/home.js")
const auditRoutes = require("./routes/audit.js")
const reportRoutes = require("./routes/reports.js")
const fineRoutes = require("./routes/fines.js")
const configRoutes = require("./routes/config.js")
const { startFineCron } = require("./utils/fineCron.js")
const { startNotificationCron } = require("./utils/notificationCron.js")
const qrRoutes = require("./routes/qr.js")
const notificationRoutes = require("./routes/notifications.js")

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
];

function getAllowedOrigins() {
  const fromEnv = [];
  if (process.env.FRONTEND_URL) {
    fromEnv.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
  }
  if (process.env.CORS_ORIGINS) {
    fromEnv.push(
      ...process.env.CORS_ORIGINS.split(",")
        .map((o) => o.trim().replace(/\/$/, ""))
        .filter(Boolean)
    );
  }
  return [...new Set([...defaultOrigins, ...fromEnv])];
}

const allowedOrigins = getAllowedOrigins();

app.use(express.json()); // Parse JSON
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
}));
app.use("/users",users);
app.use("/books",books);
app.use("/admin",admin);
app.use("/librarian",librarian);
app.use("/home",home);
app.use("/audit", auditRoutes);
app.use("/reports", reportRoutes);
app.use("/fines", fineRoutes);
app.use("/config", configRoutes);
app.use("/qr", qrRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => {
    res.send("API is running...");
  });
  
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("MONGO_URI is missing. Copy backend/.env.example to backend/.env and set your MongoDB URL.");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => {
    console.log("DB Connected");
    startFineCron();
    startNotificationCron();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });