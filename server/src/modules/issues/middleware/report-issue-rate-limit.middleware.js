import rateLimit from "express-rate-limit";

const REPORT_RATE_LIMIT_MAX = 5;
const REPORT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const reportIssueRateLimit = rateLimit({
  windowMs: REPORT_RATE_LIMIT_WINDOW_MS,
  max: REPORT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = String(req?.authUser?._id || "").trim();
    if (userId) return `report-issue:${userId}`;
    return `report-issue:ip:${String(req.ip || "unknown")}`;
  },
  message: {
    error: "Rate limit exceeded. You can report up to 5 issues every 15 minutes.",
  },
});
