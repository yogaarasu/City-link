import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  avatar: z
    .string()
    .trim()
    .max(4_300_000, "Profile image must be under 3MB.")
    .refine(
      (val) =>
        val === "" || val.startsWith("data:image/") || val.startsWith("https://res.cloudinary.com/"),
      {
        message: "Avatar must be a valid image.",
      }
    )
    .optional()
    .default(""),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().min(1, "Confirmation is required"),
});
