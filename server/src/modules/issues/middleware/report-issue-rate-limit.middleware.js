import rateLimit from "express-rate-limit";

const REPORT_RATE_LIMIT_MAX = 5;
const REPORT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const reportIssueRateLimit = rateLimit({
  windowMs: REPORT_RATE_LIMIT_WINDOW_MS,
  max: REPORT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => `report-issue:${String(req?.authUser?._id || "anonymous")}`,
  message: {
    error: "Rate limit exceeded. You can report up to 5 issues every 15 minutes.",
  },
});
