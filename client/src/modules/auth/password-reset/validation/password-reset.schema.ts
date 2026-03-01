import * as z from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const verifyPasswordResetSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const updatePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RequestPasswordResetValues = z.infer<typeof requestPasswordResetSchema>;
export type VerifyPasswordResetValues = z.infer<typeof verifyPasswordResetSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

