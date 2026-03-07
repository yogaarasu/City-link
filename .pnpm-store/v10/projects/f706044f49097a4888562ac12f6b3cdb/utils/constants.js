import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 6173;
export const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/city-link";
export const DB_NAME = process.env.DB_NAME || "City-Link";
export const NODE_ENV = process.env.NODE_ENV || "development";

export const CORS_ORIGIN =
  process.env.CORS_ORIGIN ||
  (NODE_ENV === "production" ? process.env.CORS_ORIGIN_PRODUCTION : process.env.CORS_ORIGIN_DEVELOPMENT);

export const SMTP_HOST = process.env.SMTP_HOST;
export const SMTP_PORT = process.env.SMTP_PORT;
export const SMTP_USER = process.env.SMTP_USER;
export const SMTP_PASS = process.env.SMTP_PASS;
export const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "Super Admin";
export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

export const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
export const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
