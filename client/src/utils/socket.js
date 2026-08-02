import { io } from "socket.io-client";

// Socket.io attaches directly to the raw HTTP server, not through an
// Express route — so it connects to the server's root, not the "/api"
// prefix your normal REST calls use. This strips a trailing "/api" off
// VITE_API_URL if present, so the same env var works for both.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

let socket = null;

// A single shared connection, reused everywhere it's needed — created
// once, the first time any code calls getSocket().
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
};