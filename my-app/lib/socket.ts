import { io, Socket } from "socket.io-client";

// Singleton — created once, never nulled out during the page lifecycle.
// Destroying the socket (setting null) recreates it on reconnect which causes
// the backend to see a disconnect + reconnect and resets the online count.
let socket: Socket | null = null;

const createSocket = (): Socket => {
  const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  return io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = createSocket();
  }
  return socket;
};

export const connectSocket = (token: string): Socket => {
  const s = getSocket();
  // Always update auth so a fresh token is used on reconnect
  s.auth = { token };
  if (!s.connected) {
    s.connect();
  }
  return s;
};

/**
 * Call only on explicit logout / page unload.
 * During normal React effect cleanup (including StrictMode cycles) do NOT call this —
 * just remove your event listeners and let the socket stay connected.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null; // allow GC; next connectSocket() will create a fresh one
  }
};
