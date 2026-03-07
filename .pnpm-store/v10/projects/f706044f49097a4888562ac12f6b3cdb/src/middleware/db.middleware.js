import { connectDB } from "../lib/database.js"

export const connection = async (req, res, next) => {
  await connectDB();
  next();
}