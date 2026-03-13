import { Server } from "socket.io";
import { CORS_ORIGIN } from "../../utils/constants.js";

let ioInstance = null;

const resolveCorsOrigin = () => {
  if (!CORS_ORIGIN) return "*";
  if (Array.isArray(CORS_ORIGIN)) return CORS_ORIGIN;
  if (typeof CORS_ORIGIN === "string" && CORS_ORIGIN.includes(",")) {
    return CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return CORS_ORIGIN;
};

export const initSocket = (httpServer) => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: resolveCorsOrigin(),
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.emit("socket:connected", { ok: true });
  });

  return ioInstance;
};

export const getIo = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized.");
  }
  return ioInstance;
};
