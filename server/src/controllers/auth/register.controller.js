import { User } from "../../models/user.model.js";
import { hash } from "../../lib/password.js";
import { generateOTP, sendOTP, storeOTP } from "../../lib/otp.js";
import { sanitizeUser } from "../../modules/auth/shared/sanitize-user.js";

export const userRegistration = async (req, res, next) => {
  try {
    const { firstName, lastName, email, district, address, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      if (user.isVerified && !user.isDeleted) {
        return res.status(400).json({
          success: false,
          error: "User already exist."
        });
      }

      const hashedPassword = await hash(password);
      user.name = `${firstName} ${lastName}`;
      user.district = district;
      user.address = address;
      user.password = hashedPassword;
      user.isDeleted = false;
      user.deletedAt = null;
      user.isVerified = false;
      await user.save();

      await onSuccess();
      return;
    }

    const hashedPassword = await hash(password);

    user = await User.create({
      name: `${firstName} ${lastName}`,
      email,
      district,
      address,
      password: hashedPassword,
      isVerified: false
    });

    async function onSuccess() {
      const otp = generateOTP();
      await storeOTP(email, otp);
      await sendOTP(email, otp);
      
      return res.status(200).json({
        success: true,
        message: `OTP sent to ${email}`,
        user: sanitizeUser(user)
      });
    }
    
    await onSuccess();
  } catch (error) {
    return next(error);
  }
}
