import mongoose from "mongoose";
import { DB_NAME, MONGO_URI } from "../../utils/constants.js";

let isConnected = false;
let connectionPromise = null;

export const connectDB = async () => {
  if (isConnected) return;
  if (connectionPromise) return connectionPromise;

  connectionPromise = mongoose
    .connect(MONGO_URI, { dbName: DB_NAME })
    .then(() => {
      isConnected = true;
      console.log("DataBase connected successfully!");
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(error);
      throw error;
    });

  return connectionPromise;
}
