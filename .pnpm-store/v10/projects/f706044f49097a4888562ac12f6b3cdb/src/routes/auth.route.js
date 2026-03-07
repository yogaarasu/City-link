import express from "express";
import { userRegistration } from "../controllers/auth/register.controller.js";
import { validateUser } from "../middleware/registration.middleware.js";
import { resendOTP, verifyOTP } from "../controllers/auth/otp.controller.js";
import {
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOTP,
} from "../modules/auth/password-reset/password-reset.controller.js";
import { login } from "../modules/auth/login/login.controller.js";

export const authRoutes = express.Router();

authRoutes.post("/register", validateUser, userRegistration);
authRoutes.post("/login", login);
authRoutes.post("/verify-otp", verifyOTP);
authRoutes.post("/resend-otp", resendOTP);
authRoutes.post("/password-reset/request-otp", requestPasswordReset);
authRoutes.post("/password-reset/verify-otp", verifyPasswordResetOTP);
authRoutes.post("/password-reset/update", resetPassword);
authRoutes.post("/forgot-password/request-otp", requestPasswordReset);
authRoutes.post("/forgot-password/verify-otp", verifyPasswordResetOTP);
authRoutes.post("/forgot-password/update", resetPassword);
