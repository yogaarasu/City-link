import imageCompression from "browser-image-compression";
import {
  MAX_REPORT_ISSUE_PHOTOS,
  REPORT_ISSUE_IMAGE_MAX_DATA_URL_LENGTH,
  REPORT_ISSUE_IMAGE_MAX_DIMENSION,
  REPORT_ISSUE_IMAGE_MAX_MB,
  REPORT_ISSUE_IMAGE_QUALITY,
} from "../constants/report-issue-upload.constants";

const loadImage = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = dataUrl;
  });

const loadImageFromSrc = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load watermark image"));
    image.src = src;
  });

const getOutputMimeType = (originalType: string) => {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  return supportedTypes.has(originalType) ? originalType : "image/jpeg";
};

type CompressOptions = {
  watermarkText?: string;
  watermarkLogoSrc?: string;
};

const applyWatermark = (
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  text?: string,
  logo?: HTMLImageElement | null
) => {
  if (!text && !logo) return;

  const fontSize = Math.max(12, Math.round(width * 0.03));
  const padding = Math.max(6, Math.round(fontSize * 0.5));
  const logoSize = logo ? Math.max(20, Math.round(fontSize * 2.2)) : 0;
  const gap = logo ? Math.max(6, Math.round(fontSize * 0.5)) : 0;

  context.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  context.textBaseline = "middle";

  const metrics = text ? context.measureText(text) : { width: 0 };
  const textWidth = Math.ceil(metrics.width);
  const contentWidth = logoSize + gap + textWidth;
  const boxWidth = contentWidth + padding * 2;
  const boxHeight = Math.max(logoSize, fontSize * 1.4) + padding * 1.2;
  const x = Math.max(0, width - boxWidth - padding);
  const y = Math.max(0, height - boxHeight - padding);
  const contentY = y + boxHeight / 2;

  context.fillStyle = "rgba(0, 0, 0, 0.55)";
  context.fillRect(x, y, boxWidth, boxHeight);

  if (logo) {
    const logoX = x + padding;
    const logoY = contentY - logoSize / 2;
    context.drawImage(logo, logoX, logoY, logoSize, logoSize);
  }

  if (text) {
    context.fillStyle = "rgba(255, 255, 255, 0.95)";
    context.fillText(text, x + padding + logoSize + gap, contentY);
  }
};

export const compressIssuePhotoFile = async (file: File, options?: CompressOptions) => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  const mimeType = getOutputMimeType(file.type);
  const originalDataUrl = await imageCompression.getDataUrlFromFile(file);

  const compressionProfiles = [
    {
      maxSizeMB: REPORT_ISSUE_IMAGE_MAX_MB,
      maxWidthOrHeight: REPORT_ISSUE_IMAGE_MAX_DIMENSION,
      initialQuality: REPORT_ISSUE_IMAGE_QUALITY,
    },
    {
      maxSizeMB: Math.min(REPORT_ISSUE_IMAGE_MAX_MB, 2.5),
      maxWidthOrHeight: REPORT_ISSUE_IMAGE_MAX_DIMENSION,
      initialQuality: Math.min(REPORT_ISSUE_IMAGE_QUALITY, 0.88),
    },
    {
      maxSizeMB: Math.min(REPORT_ISSUE_IMAGE_MAX_MB, 2),
      maxWidthOrHeight: Math.round(REPORT_ISSUE_IMAGE_MAX_DIMENSION * 0.9),
      initialQuality: Math.min(REPORT_ISSUE_IMAGE_QUALITY, 0.82),
    },
  ];

  const requiresWatermark = Boolean(options?.watermarkText || options?.watermarkLogoSrc);
  let bestCandidate = originalDataUrl;

  for (const profile of compressionProfiles) {
    const compressedFile = await imageCompression(file, {
      ...profile,
      useWebWorker: true,
      fileType: mimeType,
    });
    const compressedDataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    let candidate = compressedDataUrl;

    if (requiresWatermark) {
      const image = await loadImage(compressedDataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Failed to process image.");
      }

      context.drawImage(image, 0, 0, image.width, image.height);

      const watermarkLogo = options?.watermarkLogoSrc
        ? await loadImageFromSrc(options.watermarkLogoSrc)
        : null;
      applyWatermark(context, image.width, image.height, options?.watermarkText, watermarkLogo);

      candidate = canvas.toDataURL(
        mimeType,
        mimeType === "image/png" ? undefined : REPORT_ISSUE_IMAGE_QUALITY
      );
    }

    if (candidate.length <= REPORT_ISSUE_IMAGE_MAX_DATA_URL_LENGTH) {
      return candidate;
    }

    bestCandidate = candidate;
  }

  return bestCandidate.length < originalDataUrl.length ? bestCandidate : originalDataUrl;
};

export const compressIssuePhotoFiles = async (files: File[], options?: CompressOptions) => {
  const limitedFiles = files.slice(0, MAX_REPORT_ISSUE_PHOTOS);
  return Promise.all(limitedFiles.map((file) => compressIssuePhotoFile(file, options)));
};
