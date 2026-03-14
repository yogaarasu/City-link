import express from "express";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  checkDuplicateIssuesController,
  createIssueController,
  getCityAdminIssueStatsController,
  getIssueByIdController,
  getMyIssueStatsController,
  listCityAdminIssuesController,
  listCommunityIssuesController,
  listMyIssuesController,
  deleteIssueController,
  reviewIssueController,
  updateIssueStatusByCityAdminController,
  voteIssueController,
} from "../modules/issues/issue.controller.js";
import { reportIssueRateLimit } from "../modules/issues/middleware/report-issue-rate-limit.middleware.js";

export const issueRoutes = express.Router();

issueRoutes.use(requireAuth);

issueRoutes.get("/community", listCommunityIssuesController);
issueRoutes.get("/mine", requireRoles("citizen"), listMyIssuesController);
issueRoutes.get("/mine/stats", requireRoles("citizen"), getMyIssueStatsController);
issueRoutes.post("/duplicate-check", requireRoles("citizen"), checkDuplicateIssuesController);
issueRoutes.get("/city-admin/district", requireRoles("city_admin"), listCityAdminIssuesController);
issueRoutes.get("/city-admin/stats", requireRoles("city_admin"), getCityAdminIssueStatsController);
issueRoutes.patch("/:issueId/status", requireRoles("city_admin"), updateIssueStatusByCityAdminController);
issueRoutes.patch("/:issueId/review", requireRoles("citizen"), reviewIssueController);
issueRoutes.delete("/:issueId", requireRoles("citizen"), deleteIssueController);
issueRoutes.get("/:issueId", getIssueByIdController);
issueRoutes.post("/:issueId/vote", requireRoles("citizen"), voteIssueController);
issueRoutes.post("/", requireRoles("citizen"), reportIssueRateLimit, createIssueController);
