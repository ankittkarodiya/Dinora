const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

app.use(helmet());
app.use(morgan("dev"));

const allowedOrigins = [
  "https://dinora.in",
  "https://www.dinora.in",
  "http://localhost:5173", // ← local development
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// app.use(cors({
//   // origin: "http://localhost:5173",
//   origin: process.env.CLIENT_URL || "http://localhost:5173",
//   credentials: true
// }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
// const authRoutes = require("./routes/authRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const menuItemRoutes = require("./routes/menuItemRoutes");
const tableRoutes = require("./routes/tableRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const publicRoutes = require("./routes/publicRoutes");
const customerAuthRoutes = require("./routes/customerAuthRoutes");

const analyticsRoutes = require("./routes/analyticsRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");

const uploadRoutes = require("./routes/uploadRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/restaurant", restaurantRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menuitems", menuItemRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/customer", customerAuthRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/upload", uploadRoutes);



// ── Health Check ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "Dinora API is running 🍽️" });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;