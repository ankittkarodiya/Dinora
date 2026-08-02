const dotenv = require("dotenv");
dotenv.config(); // must be first line

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./config/socket");
const allowedOrigins = require("./config/allowedOrigins");

const PORT = process.env.PORT || 5000;

// ← THE KEY CHANGE: Socket.io must attach to the actual raw HTTP server,
// not directly to the Express app. app.listen(...) was creating that
// server implicitly and hiding it from us — http.createServer(app) makes
// it explicit, so we can hand the same server to Socket.io too.
const server = http.createServer(app);
initSocket(server, allowedOrigins);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});