import { canResendOTP, checkDailyLimit, generateOTP, sendOTP, storeOTP, verifyOTP as verify } from "../../lib/otp.js";
import { User } from "../../models/user.model.js";
import { sanitizeUser } from "../../modules/auth/shared/sanitize-user.js";
import { signAuthToken } from "../../lib/jwt.js";

export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Required field missing" });
    }

    const isVerified = await verify(email, otp);
    if (!isVerified) {
      return res.status(401).json({ error: "Invalid OTP." });
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          isVerified: true,
          lastLoginAt: new Date(),
          activityStatus: "online",
          activityStatusUpdatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      message: "User registration successfull!",
      user: sanitizeUser(user),
      token: signAuthToken(user),
    });
  } catch (error) {
    return next(error);
  }
}

export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Required field missing" });
    }

    const allowed = await canResendOTP(email);
    if (!allowed) {
      return res.status(429).json({ error: "Please wait before resending OTP" });
    }

    if (!(await checkDailyLimit(email))) {
      return res.status(429).json({ error: "OTP limit exceeded for today" });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTP(email, otp);

    return res.status(200).json({ message: `OTP resent to ${email}` });
  } catch (error) {
    return next(error);
  }
}
