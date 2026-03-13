import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/utils/constants";

let socketInstance: Socket | null = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};
