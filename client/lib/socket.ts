import { io, type Socket } from "socket.io-client";

const getSocketUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configuredUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured. Set it to your deployed DevHeaven API URL.");
  }
  return configuredUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(token: string): Socket {
  if (socket && activeToken === token) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  activeToken = token;
  socket = io(getSocketUrl(), {
    transports: ["websocket", "polling"],
    auth: { token },
    withCredentials: true,
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
