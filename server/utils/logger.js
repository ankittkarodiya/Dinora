const logger = {
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error?.message || "");
  },
  warn: (message) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
  },
  info: (message) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[INFO] ${new Date().toISOString()} ${message}`);
    }
  },
};

module.exports = logger;
