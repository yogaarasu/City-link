import mongoose from "mongoose";
import { DB_NAME, MONGO_URI } from "../../utils/constants.js";

let isConnected = false;

export const connectDB = async () => {
  try {
    if (isConnected) return;
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    isConnected = true;
    console.log("DataBase connected successfully!");
  } catch (error) {
    console.error(error);
  }
}