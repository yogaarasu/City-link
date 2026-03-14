import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/utils/constants";

let socketInstance: Socket | null = null;

const resolveTransports = (url: string) => {
  const normalized = url.toLowerCase();
  if (import.meta.env.PROD && normalized.includes(".vercel.app")) {
    return ["polling"];
  }
  return ["websocket", "polling"];
};

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      transports: resolveTransports(SOCKET_URL),
    });
  }
  return socketInstance;
};
