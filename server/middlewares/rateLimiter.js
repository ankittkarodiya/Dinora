const rateLimit = require("express-rate-limit");

// Strict limiter for auth endpoints (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { success: false, message: "Too many attempts, please try again after a minute" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many payment requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, paymentLimiter, generalLimiter };
