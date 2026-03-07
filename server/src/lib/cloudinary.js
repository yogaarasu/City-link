import { v2 as cloudinary } from "cloudinary";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../utils/constants.js";

const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const ensureCloudinaryConfig = () => {
  if (isCloudinaryConfigured) return;
  const error = new Error("Cloudinary is not configured.");
  error.statusCode = 500;
  throw error;
};

export const isImageDataUri = (value = "") =>
  typeof value === "string" && value.startsWith("data:image/");

export const isCloudinaryImageUrl = (value = "") =>
  typeof value === "string" &&
  /^https?:\/\/res\.cloudinary\.com\/.+\/(?:image|video|raw)\/upload\/.+$/i.test(value);

const getPublicIdFromCloudinaryUrl = (url) => {
  try {
    const parsed = new URL(url);
    const decodedPath = decodeURIComponent(parsed.pathname);
    const withVersionMatch = decodedPath.match(
      /\/(?:image|video|raw)\/upload\/(?:[^/]+\/)*v\d+\/(.+)$/i
    );
    const withoutVersionMatch = decodedPath.match(
      /\/(?:image|video|raw)\/upload\/(?:[^/]+\/)*(.+)$/i
    );

    const publicIdWithExtension = withVersionMatch?.[1] || withoutVersionMatch?.[1];
    if (!publicIdWithExtension) return null;

    return publicIdWithExtension.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

export const uploadImageToCloudinary = async (image, { folder, transformation } = {}) => {
  ensureCloudinaryConfig();

  if (!isImageDataUri(image)) {
    const error = new Error("Image payload must be a base64 data URL.");
    error.statusCode = 400;
    throw error;
  }

  const uploadOptions = {
    folder,
    resource_type: "image",
  };

  if (Array.isArray(transformation) && transformation.length > 0) {
    uploadOptions.transformation = transformation;
  }

  const uploaded = await cloudinary.uploader.upload(image, uploadOptions);

  return uploaded.secure_url;
};

export const uploadManyImagesToCloudinary = async (
  images = [],
  { folder, maxCount, transformation } = {}
) => {
  const normalized = Array.isArray(images) ? images : [];
  const limitEnabled = Number.isInteger(maxCount) && maxCount > 0;
  const limitedImages = limitEnabled ? normalized.slice(0, maxCount) : normalized;
  if (limitedImages.length === 0) return [];

  return Promise.all(
    limitedImages.map(async (image) => {
      if (isCloudinaryImageUrl(image)) return image;
      return uploadImageToCloudinary(image, { folder, transformation });
    })
  );
};

export const deleteCloudinaryImageByUrl = async (url) => {
  if (!isCloudinaryImageUrl(url)) return;
  ensureCloudinaryConfig();

  const publicId = getPublicIdFromCloudinaryUrl(url);
  if (!publicId) return;

  const response = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });

  const result = String(response?.result || "").toLowerCase();
  if (result !== "ok" && result !== "not found") {
    const error = new Error("Failed to remove previous image from Cloudinary.");
    error.statusCode = 502;
    throw error;
  }
};
