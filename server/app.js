const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { generalLimiter } = require("./middlewares/rateLimiter");

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(generalLimiter);

const allowedOrigins = require("./config/allowedOrigins");

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

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Routes ────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
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

// for web-push notifications
const pushRoutes = require("./routes/pushRoutes");


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
app.use("/api/push", pushRoutes);

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
  const isProduction = process.env.NODE_ENV === "production";
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? "Internal Server Error" : (err.message || "Internal Server Error"),
  });
});

module.exports = app;