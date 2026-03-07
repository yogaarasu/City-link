import { redis } from "../../../lib/redis.js";
import { hash } from "../../../lib/password.js";
import {
  canResendOTP,
  checkDailyLimit,
  generateOTP,
  sendOTP,
  storeOTP,
  verifyOTP,
} from "../../../lib/otp.js";
import { User } from "../../../models/user.model.js";

const OTP_PURPOSE = "password-reset";
const RESET_SESSION_TTL_SECONDS = 600;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const requestPasswordResetOTP = async (email) => {
  const existingUser = await User.findOne({ email });
  if (!existingUser || existingUser.isDeleted) {
    throw createHttpError(404, "User does not exist with this email.");
  }

  const canResend = await canResendOTP(email, OTP_PURPOSE);
  if (!canResend) {
    throw createHttpError(429, "Please wait before requesting another OTP.");
  }

  const withinDailyLimit = await checkDailyLimit(email, OTP_PURPOSE);
  if (!withinDailyLimit) {
    throw createHttpError(429, "OTP limit exceeded for today.");
  }

  const otp = generateOTP();
  await storeOTP(email, otp, OTP_PURPOSE);
  await sendOTP(email, otp, {
    subject: "Password Reset Code | City-Link",
    text: `Your password reset code is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
  });

  return { message: `OTP sent to ${email}` };
};

export const verifyPasswordResetCode = async (email, otp) => {
  const isValid = await verifyOTP(email, otp, OTP_PURPOSE);
  if (!isValid) {
    throw createHttpError(401, "Invalid OTP.");
  }

  await redis.set(`password-reset:verified:${email}`, "1", {
    ex: RESET_SESSION_TTL_SECONDS,
  });

  return { message: "OTP verified. You can now reset your password." };
};

export const updateUserPassword = async (email, newPassword) => {
  const hasVerification = await redis.get(`password-reset:verified:${email}`);
  if (!hasVerification) {
    throw createHttpError(403, "OTP verification required before password reset.");
  }

  const existingUser = await User.findOne({ email });
  if (!existingUser || existingUser.isDeleted) {
    throw createHttpError(404, "User does not exist with this email.");
  }

  const hashedPassword = await hash(newPassword);
  existingUser.password = hashedPassword;
  await existingUser.save();

  await redis.del(`password-reset:verified:${email}`);

  return { message: "Password updated successfully." };
};
