import type { IIssue } from "../types/issue.types";

const buildShareText = (issue: IIssue) => {
  const locationUrl = `https://maps.google.com/?q=${issue.location.lat},${issue.location.lng}`;
  return [
    `*🚨 ${issue.title.toUpperCase()}*`,
    "------------------------",
    "",
    "*Details:*",
    issue.description,
    "",
    "*Location:*",
    locationUrl,
    "",
    "*Evidence:*",
    "[Photo Evidence Attached in CityLink App]",
    "",
    "_Reported via CityLink_",
  ].join("\n");
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
