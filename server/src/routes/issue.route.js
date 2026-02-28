import express from "express";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  createIssueController,
  getIssueByIdController,
  getMyIssueStatsController,
  listCommunityIssuesController,
  listMyIssuesController,
  voteIssueController,
} from "../modules/issues/issue.controller.js";

export const issueRoutes = express.Router();

issueRoutes.use(requireAuth);

issueRoutes.get("/community", listCommunityIssuesController);
issueRoutes.get("/mine", requireRoles("citizen"), listMyIssuesController);
issueRoutes.get("/mine/stats", requireRoles("citizen"), getMyIssueStatsController);
issueRoutes.get("/:issueId", getIssueByIdController);
issueRoutes.post("/:issueId/vote", requireRoles("citizen"), voteIssueController);
issueRoutes.post("/", requireRoles("citizen"), createIssueController);
