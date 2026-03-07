import { z } from "zod";
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from "./user.validation.js";
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from "./user.service.js";

const handleError = (error, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: error.issues?.[0]?.message || "Validation failed",
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return next(error);
};

export const getMe = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.authUser);
    return res.status(200).json({ user });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const payload = updateProfileSchema.parse(req.body);
    const user = await updateMyProfile(req.authUser, payload);
    return res.status(200).json({ message: "Profile updated successfully.", user });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changeMyPassword(req.authUser, currentPassword, newPassword);
    return res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = deleteAccountSchema.parse(req.body);
    await deleteMyAccount(req.authUser, password);
    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    return handleError(error, res, next);
  }
};
