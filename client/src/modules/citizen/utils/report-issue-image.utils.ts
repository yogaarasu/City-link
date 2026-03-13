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

type CompressOptions = {
  watermarkText?: string;
};

const applyWatermark = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  text: string
) => {
  const fontSize = Math.max(12, Math.round(width * 0.035));
  const padding = Math.max(6, Math.round(fontSize * 0.45));
  context.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textBaseline = "alphabetic";

  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(fontSize * 1.2);

  const boxWidth = textWidth + padding * 2;
  const boxHeight = textHeight + padding * 1.2;
  const x = Math.max(0, width - boxWidth - padding);
  const y = Math.max(0, height - boxHeight - padding);

  context.fillStyle = "rgba(0, 0, 0, 0.55)";
  context.fillRect(x, y, boxWidth, boxHeight);
  context.fillStyle = "rgba(255, 255, 255, 0.95)";
  context.fillText(text, x + padding, y + boxHeight - padding * 0.6);
};

export const compressIssuePhotoFile = async (file: File, options?: CompressOptions) => {
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

  if (options?.watermarkText) {
    applyWatermark(context, width, height, options.watermarkText);
  }

  const mimeType = getOutputMimeType(file.type);
  const quality = mimeType === "image/png" ? undefined : REPORT_ISSUE_IMAGE_QUALITY;
  const compressedDataUrl = canvas.toDataURL(mimeType, quality);

  if (options?.watermarkText) {
    return compressedDataUrl;
  }

  return compressedDataUrl.length < originalDataUrl.length ? compressedDataUrl : originalDataUrl;
};

export const compressIssuePhotoFiles = async (files: File[], options?: CompressOptions) => {
  const limitedFiles = files.slice(0, MAX_REPORT_ISSUE_PHOTOS);
  return Promise.all(limitedFiles.map((file) => compressIssuePhotoFile(file, options)));
};
