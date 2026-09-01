import { io, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(token: string): Socket {
  if (socket && activeToken === token) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  activeToken = token;
  socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  activeToken = null;
}

export function getActiveSocket(): Socket | null {
  return socket;
}
