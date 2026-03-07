import { compare, hash } from "../../../lib/password.js";
import { User } from "../../../models/user.model.js";
import { sanitizeUser } from "../shared/sanitize-user.js";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_NAME,
  SUPER_ADMIN_PASSWORD,
} from "../../../../utils/constants.js";
import { appendUserActivityLog } from "../../super-admin/shared/activity-log.js";
import { getNormalizedAdminAccess } from "../../super-admin/super-admin.constants.js";
import { signAuthToken } from "../../../lib/jwt.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const loginUser = async (email, password) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const configuredSuperEmail = String(SUPER_ADMIN_EMAIL || "").trim().toLowerCase();

  if (
    configuredSuperEmail &&
    SUPER_ADMIN_PASSWORD &&
    normalizedEmail === configuredSuperEmail &&
    password === SUPER_ADMIN_PASSWORD
  ) {
    let superAdmin = await User.findOne({ role: "super_admin", isDeleted: false }).sort({
      createdAt: 1,
    });

    if (!superAdmin) {
      superAdmin = await User.findOne({ email: configuredSuperEmail });
      if (superAdmin) {
        superAdmin.role = "super_admin";
      }
    }

    if (!superAdmin) {
      superAdmin = await User.create({
        name: SUPER_ADMIN_NAME,
        email: configuredSuperEmail,
        district: "State Admin",
        address: "City-Link Control Center",
        password: await hash(SUPER_ADMIN_PASSWORD),
        role: "super_admin",
        isVerified: true,
        adminAccess: "active",
      });
    } else {
      const emailTakenByAnother = await User.exists({
        _id: { $ne: superAdmin._id },
        email: configuredSuperEmail,
        isDeleted: false,
      });

      if (emailTakenByAnother) {
        throw createHttpError(
          409,
          "Configured super admin email is already used by another active account."
        );
      }

      const passwordMatchesEnv = await compare(SUPER_ADMIN_PASSWORD, superAdmin.password);
      if (!passwordMatchesEnv) {
        superAdmin.password = await hash(SUPER_ADMIN_PASSWORD);
      }
    }

    superAdmin.name = SUPER_ADMIN_NAME;
    superAdmin.email = configuredSuperEmail;
    superAdmin.district = "State Admin";
    superAdmin.address = "City-Link Control Center";
    superAdmin.role = "super_admin";
    superAdmin.isDeleted = false;
    superAdmin.isVerified = true;
    superAdmin.adminAccess = "active";
    superAdmin.lastLoginAt = new Date();
    superAdmin.activityStatus = "online";
    superAdmin.activityStatusUpdatedAt = new Date();
    appendUserActivityLog(superAdmin, "login", "Super admin logged in.");
    await superAdmin.save();

    return {
      message: "Login successful.",
      user: sanitizeUser(superAdmin),
      token: signAuthToken(superAdmin),
    };
  }

  const user = await User.findOne({
    email: {
      $regex: `^${escapeRegExp(normalizedEmail)}$`,
      $options: "i",
    },
  });

  if (!user) {
    throw createHttpError(401, "Invalid email or password.");
  }
  if (user.isDeleted) {
    throw createHttpError(401, "Account not available.");
  }

  if (user.role === "super_admin") {
    throw createHttpError(
      401,
      "Use configured super admin email and password from environment settings."
    );
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, "Invalid email or password.");
  }

  if (!user.isVerified) {
    throw createHttpError(403, "Please verify your email before login.");
  }

  if (user.role === "city_admin" && getNormalizedAdminAccess(user.adminAccess) === "inactive") {
    throw createHttpError(
      403,
      "Your administrator account is currently inactive. Contact super admin."
    );
  }

  user.lastLoginAt = new Date();
  user.activityStatus = "online";
  user.activityStatusUpdatedAt = new Date();
  const roleLoginMessage = {
    city_admin: "City administrator logged in.",
    super_admin: "Super admin logged in.",
    citizen: "Citizen logged in.",
  };
  appendUserActivityLog(user, "login", roleLoginMessage[user.role] || "User logged in.");
  await user.save();

  return {
    message: "Login successful.",
    user: sanitizeUser(user),
    token: signAuthToken(user),
  };
};
