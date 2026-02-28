import { z } from "zod";
import {
  requestResetSchema,
  updatePasswordSchema,
  verifyResetOTPSchema,
} from "./password-reset.validation.js";
import {
  requestPasswordResetOTP,
  updateUserPassword,
  verifyPasswordResetCode,
} from "./password-reset.service.js";

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

export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = requestResetSchema.parse(req.body);
    const response = await requestPasswordResetOTP(email);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = verifyResetOTPSchema.parse(req.body);
    const response = await verifyPasswordResetCode(email, otp);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = updatePasswordSchema.parse(req.body);
    const response = await updateUserPassword(email, newPassword);
    return res.status(200).json(response);
  } catch (error) {
    return handleError(error, res, next);
  }
};
