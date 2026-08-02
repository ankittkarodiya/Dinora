const { Server } = require("socket.io");

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

  io.on("connection", (socket) => {
    socket.on("join-restaurant", (restaurantId) => {
      if (restaurantId) socket.join(`restaurant-${restaurantId}`);
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