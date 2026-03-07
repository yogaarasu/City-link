import {
  MAX_REPORT_ISSUE_PHOTOS,
  REPORT_ISSUE_IMAGE_MAX_DIMENSION,
  REPORT_ISSUE_IMAGE_QUALITY,
} from "../constants/report-issue-upload.constants";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });

const getScaledDimensions = (width: number, height: number) => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= REPORT_ISSUE_IMAGE_MAX_DIMENSION) {
    return { width, height };
  }

  const ratio = REPORT_ISSUE_IMAGE_MAX_DIMENSION / longestEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const getOutputMimeType = (originalType: string) => {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  return supportedTypes.has(originalType) ? originalType : "image/jpeg";
};

export const compressIssuePhotoFile = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const { width, height } = getScaledDimensions(image.width, image.height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Failed to process image.");
  }

  context.drawImage(image, 0, 0, width, height);

  const mimeType = getOutputMimeType(file.type);
  const quality = mimeType === "image/png" ? undefined : REPORT_ISSUE_IMAGE_QUALITY;
  const compressedDataUrl = canvas.toDataURL(mimeType, quality);

  return compressedDataUrl.length < originalDataUrl.length ? compressedDataUrl : originalDataUrl;
};

export const compressIssuePhotoFiles = async (files: File[]) => {
  const limitedFiles = files.slice(0, MAX_REPORT_ISSUE_PHOTOS);
  return Promise.all(limitedFiles.map((file) => compressIssuePhotoFile(file)));
};
