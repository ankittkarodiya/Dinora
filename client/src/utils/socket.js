import { io } from "socket.io-client";

// new
import { getToken } from "./authStorage";





// Socket.io attaches directly to the raw HTTP server, not through an
// Express route — so it connects to the server's root, not the "/api"
// prefix your normal REST calls use. This strips a trailing "/api" off
// VITE_API_URL if present, so the same env var works for both.
const SOCKET_URL = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");

let socket = null;

// A single shared connection, reused everywhere it's needed — created
// once, the first time any code calls getSocket(). Sends the admin JWT
// for server-side auth.
export const getSocket = () => {
  if (!socket) {
    // const token = localStorage.getItem("token");

    // new
    const token = getToken();


    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      auth: { token },
    });
  }
  return socket;
};

// Reconnect with a fresh token (called after login)
export const reconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket();
};