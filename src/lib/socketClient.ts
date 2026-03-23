import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let initPromise: Promise<void> | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket) return socket;

  if (!initPromise) {
    initPromise = fetch("/api/socket").then(() => {
      // Connect to the separate Socket.io server on port 3001
      const port = process.env.NEXT_PUBLIC_SOCKET_PORT || 3001;
      const host = window.location.hostname;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${host}:${port}`;
      
      socket = io(url, { 
        transports: ["websocket"] 
      });
    });
  }

  await initPromise;
  return socket!;
}
