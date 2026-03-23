import * as z from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const verifyPasswordResetSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const updatePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must include at least one uppercase letter")
      .regex(/[a-z]/, "Password must include at least one lowercase letter")
      .regex(/[0-9]/, "Password must include at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must include at least one special character"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RequestPasswordResetValues = z.infer<typeof requestPasswordResetSchema>;
export type VerifyPasswordResetValues = z.infer<typeof verifyPasswordResetSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

