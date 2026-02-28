import { z } from "zod";

export const requestResetSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
});

export const verifyResetOTPSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export const updatePasswordSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
