import express from "express";
import cors from "cors";
import { CORS_ORIGIN, PORT } from "../utils/constants.js";
import router from "./routes/router.js";
import { connection } from "./middleware/db.middleware.js";

const server = express();
const corsOptions = {
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-user-id", "x-user-role", "Authorization"],
  credentials: true
};

server.use(cors(corsOptions));
server.options(/.*/, cors(corsOptions));
server.use(express.json({ limit: "30mb" }));

server.use("/api/v1", connection, router);

server.use((error, _req, res, _next) => {
  console.error(error);
  const status = error?.status || error?.statusCode || 500;
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large. Please reduce image size." });
  }
  return res.status(status).json({ error: error?.message || "Internal Server error" });
});

server.listen(PORT, () => {
  console.log(`Server is Running at http://localhost:${PORT}`)
});
