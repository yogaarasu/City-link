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
      folder: "city-link/avatars",
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

export const deleteMyAccount = async (authUser, confirmation) => {
  if (confirmation !== "DELETE") {
    throw createHttpError(400, "Type DELETE to confirm account deletion.");
  }

  const user = await User.findById(authUser._id);
  if (!user || user.isDeleted) {
    throw createHttpError(404, "User not found");
  }

  const activeIssue = await Issue.exists({
    reportedBy: authUser._id,
    status: { $in: ["pending", "in_progress"] },
  });

  if (activeIssue) {
    throw createHttpError(
      409,
      "You cannot delete your account while you have issues in pending or in-progress status."
    );
  }

  const deletedAliasEmail = `deleted+${user._id}@citylink.local`;
  await deleteCloudinaryImageByUrl(user.avatar || "");
  user.name = "Deleted User";
  user.email = deletedAliasEmail;
  user.address = "Deleted";
  user.district = "Deleted";
  user.avatar = "";
  user.password = await hash(`${Date.now()}_${user._id}`);
  user.isVerified = false;
  user.role = "citizen";
  user.isDeleted = true;
  user.deletedAt = new Date();
  await user.save();
};
