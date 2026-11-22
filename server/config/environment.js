// Centralised environment config — import once, use everywhere
const config = {
  isProduction: process.env.NODE_ENV === "production",
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI,
};

module.exports = config;
