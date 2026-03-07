import { uploadManyImagesToCloudinary } from "../../lib/cloudinary.js";
import {
  ISSUE_IMAGE_UPLOAD_TRANSFORMATION,
  MAX_ISSUE_PHOTOS,
} from "./issue-upload.constants.js";

export const uploadReportedIssuePhotos = async (photos = []) =>
  uploadManyImagesToCloudinary(photos, {
    folder: "city-link/issues/reported",
    maxCount: MAX_ISSUE_PHOTOS,
    transformation: ISSUE_IMAGE_UPLOAD_TRANSFORMATION,
  });

export const uploadResolvedIssueEvidencePhotos = async (photos = []) =>
  uploadManyImagesToCloudinary(photos, {
    folder: "city-link/issues/resolved",
    maxCount: MAX_ISSUE_PHOTOS,
    transformation: ISSUE_IMAGE_UPLOAD_TRANSFORMATION,
  });
