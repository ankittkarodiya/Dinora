const Restaurant = require("../models/Restaurant");

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

// Attaches Socket.io to the same underlying HTTP server Express runs on.
// Each admin, once connected, joins a "room" named after their own
// restaurantId — so a restaurant only ever receives events about ITS
// OWN orders, never any other restaurant's, even though everyone shares
// the same server connection.
const initSocket = (httpServer, allowedOrigins) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // JWT auth middleware — only authenticated admins can join restaurant rooms
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId || decoded.id;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {

    // socket.on("join-restaurant", (restaurantId) => {
    //   if (restaurantId) socket.join(`restaurant-${restaurantId}`);
    // });

    // new
      socket.on("join-restaurant", async (restaurantId) => {
      try {
        // only the restaurant's own owner may listen to its orders
        const owns = await Restaurant.exists({ _id: restaurantId, userId: socket.userId });
        if (owns) socket.join(`restaurant-${restaurantId}`);
      } catch {
        /* invalid id etc. — just don't join */
      }
    });

  });

  return io;
};

// Lets any controller (like placeOrder) emit events without needing to
// pass the io instance around manually through every function call.
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized yet");
  return io;
};

module.exports = { initSocket, getIO };