import { otpMailTemplate } from "../../utils/template.js";
import { transporter } from "./mailer.js";
import { redis } from "./redis.js";
import { SMTP_USER } from "../../utils/constants.js";

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const getOTPKey = (email, purpose) => `otp:${purpose}:${email}`;
const getCooldownKey = (email, purpose) => `otp:cooldown:${purpose}:${email}`;
const getDailyLimitKey = (email, purpose) => `otp:count:${purpose}:${email}`;

export const checkDailyLimit = async (email, purpose = "registration") => {
  const key = getDailyLimitKey(email, purpose);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 86400);
  }

  return count <= 10;
}

export const sendOTP = async (email, otp, options = {}) => {
  const {
    subject = "Your Verification Code | City-Link",
    text = `Your verification code is ${otp}. It is valid for 10 minutes. If you did not request this, please ignore this email.`,
  } = options;

  await transporter.sendMail({
    from: `"City-Link" <${SMTP_USER}>`,
    to: email,
    subject,
    html: otpMailTemplate(otp),
    text,
  });
};

export const storeOTP = async (email, otp, purpose = "registration") => {
  await redis.set(getOTPKey(email, purpose), otp, { ex: 600 });
  await redis.set(getCooldownKey(email, purpose), "1", { ex: 60 });
}

export const verifyOTP = async (email, otp, purpose = "registration") => {
  const key = getOTPKey(email, purpose);
  const stored = await redis.get(key);

  if (!stored) return false;
  if (String(stored) !== String(otp)) return false;

  await redis.del(key);
  return true;
}

export const canResendOTP = async (email, purpose = "registration") => {
  const cooldown = await redis.get(getCooldownKey(email, purpose));
  return !cooldown
}
