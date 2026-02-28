import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  changePassword,
  deleteAccount,
  getMe,
  updateProfile,
} from "../modules/user/user.controller.js";

export const userRoutes = express.Router();

userRoutes.use(requireAuth);

userRoutes.get("/me", getMe);
userRoutes.patch("/profile", updateProfile);
userRoutes.post("/change-password", changePassword);
userRoutes.delete("/account", deleteAccount);
