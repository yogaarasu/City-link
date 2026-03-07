import express from "express";
import cors from "cors";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
  CORS_ORIGIN,
  JWT_SECRET,
  PORT,
} from "../utils/constants.js";
import router from "./routes/router.js";
import { connection } from "./middleware/db.middleware.js";

const server = express();

const requiredEnv = [
  ["JWT_SECRET", JWT_SECRET],
  ["CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME],
  ["CLOUDINARY_API_KEY", CLOUDINARY_API_KEY],
  ["CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET],
];
const disallowedPlaceholders = new Set([
  "replace_with_strong_random_secret",
  "your_cloud_name",
  "your_cloudinary_api_key",
  "your_cloudinary_api_secret",
]);
const missingEnv = requiredEnv
  .filter(([, value]) => !value || disallowedPlaceholders.has(String(value).trim()))
  .map(([name]) => name);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const corsOptions = {
  origin: CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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
