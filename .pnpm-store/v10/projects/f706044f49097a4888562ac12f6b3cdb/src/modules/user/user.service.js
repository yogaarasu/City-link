import { hash, compare } from "../../lib/password.js";
import { Issue } from "../../models/issue.model.js";
import { User } from "../../models/user.model.js";
import { sanitizeUser } from "../auth/shared/sanitize-user.js";
import {
  deleteCloudinaryImageByUrl,
  isImageDataUri,
  uploadImageToCloudinary,
} from "../../lib/cloudinary.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getMyProfile = async (authUser) => {
  const user = await User.findById(authUser._id).select("-password");
  if (!user || user.isDeleted) {
    throw createHttpError(404, "User not found");
  }
  return sanitizeUser(user);
};

export const updateMyProfile = async (authUser, payload) => {
  const user = await User.findById(authUser._id);
  if (!user || user.isDeleted) {
    throw createHttpError(404, "User not found");
  }

  user.name = payload.name;
  const incomingAvatar = String(payload.avatar || "");
  const currentAvatar = String(user.avatar || "");

  if (!incomingAvatar) {
    if (currentAvatar) {
      await deleteCloudinaryImageByUrl(currentAvatar);
    }
    user.avatar = "";
  } else if (isImageDataUri(incomingAvatar)) {
    const uploadedAvatarUrl = await uploadImageToCloudinary(incomingAvatar, {
      folder: "Citylink/avatars",
    });
    if (currentAvatar && currentAvatar !== incomingAvatar) {
      await deleteCloudinaryImageByUrl(currentAvatar);
    }
    user.avatar = uploadedAvatarUrl;
  } else if (incomingAvatar === currentAvatar) {
    user.avatar = currentAvatar;
  } else {
    throw createHttpError(400, "Avatar must be an image file.");
  }

  await user.save();

  return sanitizeUser(user);
};

export const changeMyPassword = async (authUser, currentPassword, newPassword) => {
  const user = await User.findById(authUser._id);
  if (!user || user.isDeleted) {
    throw createHttpError(404, "User not found");
  }

  const isCurrentCorrect = await compare(currentPassword, user.password);
  if (!isCurrentCorrect) {
    throw createHttpError(400, "Current password is incorrect.");
  }

  user.password = await hash(newPassword);
  await user.save();
};

export const deleteMyAccount = async (authUser, password) => {
  const user = await User.findById(authUser._id);
  if (!user || user.isDeleted) {
    throw createHttpError(404, "User not found");
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, "Incorrect password.");
  }

  const activeIssue = await Issue.exists({
    reportedBy: authUser._id,
    status: { $in: ["pending", "verified", "in_progress"] },
  });

  if (activeIssue) {
    throw createHttpError(
      409,
      "You cannot delete your account while you have issues in pending, verified, or in-progress status."
    );
  }

  user.isDeleted = true;
  user.isVerified = true;
  user.deletedAt = new Date();
  await user.save();
};
