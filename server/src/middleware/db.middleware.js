import { connectDB } from "../lib/database.js"

export const connection = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Database connection failed.");
    err.statusCode = err.statusCode || 503;
    if (!err.message || err.message === "Database connection failed.") {
      err.message = "Database connection failed. Check MONGO_URI and network access.";
    }
    next(err);
  }
}
