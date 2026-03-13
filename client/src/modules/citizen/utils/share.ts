import type { IIssue } from "../types/issue.types";

const buildShareText = (issue: IIssue) => {
  const locationUrl = `https://maps.google.com/?q=${issue.location.lat},${issue.location.lng}`;
  const reportedAt = new Date(issue.createdAt).toLocaleString();
  const evidenceLinks =
    issue.photos && issue.photos.length > 0
      ? issue.photos.map((url, index) => `- Evidence ${index + 1}: ${url}`).join("\n")
      : "- No evidence image links available.";
  const resolvedLinks =
    issue.resolvedEvidencePhotos && issue.resolvedEvidencePhotos.length > 0
      ? issue.resolvedEvidencePhotos
          .map((url, index) => `- Resolved ${index + 1}: ${url}`)
          .join("\n")
      : "";

  return [
    "🚨 ISSUE REPORT",
    `TITLE: ${issue.title}`,
    "────────────────────────────",
    `🏷️ CATEGORY: ${issue.category}`,
    `📌 STATUS: ${issue.status}`,
    `📍 DISTRICT: ${issue.district}`,
    `🕒 REPORTED: ${reportedAt}`,
    "",
    "📝 DESCRIPTION",
    issue.description,
    "",
    `🗺️ LOCATION: ${locationUrl}`,
    "",
    "📷 EVIDENCE IMAGES",
    evidenceLinks,
    resolvedLinks ? "" : "",
    resolvedLinks ? "✅ RESOLVED EVIDENCE" : "",
    resolvedLinks,
    "",
    "Shared via CityLink",
  ]
    .filter((line) => line !== "")
    .join("\n\n");
};

export const shareIssue = async (issue: IIssue) => {
  const text = buildShareText(issue);
  const shareData = {
    title: `Issue: ${issue.title}`,
    text,
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};
