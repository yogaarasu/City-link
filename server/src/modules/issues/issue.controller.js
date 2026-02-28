import { z } from "zod";
import {
  createIssue,
  getIssueById,
  getMyIssueStats,
  listCommunityIssues,
  listMyIssues,
  voteIssue,
} from "./issue.service.js";
import { createIssueSchema, listIssueQuerySchema, voteIssueSchema } from "./issue.validation.js";

const handleError = (error, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: error.issues?.[0]?.message || "Validation failed",
    });
  }
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  return next(error);
};

export const createIssueController = async (req, res, next) => {
  try {
    const payload = createIssueSchema.parse(req.body);
    const issue = await createIssue(payload, req.authUser);
    return res.status(201).json({
      message: "Issue reported successfully.",
      issue,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const listCommunityIssuesController = async (req, res, next) => {
  try {
    const query = listIssueQuerySchema.parse(req.query);
    const issues = await listCommunityIssues(query);
    return res.status(200).json({ issues });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const listMyIssuesController = async (req, res, next) => {
  try {
    const issues = await listMyIssues(req.authUser);
    return res.status(200).json({ issues });
  } catch (error) {
    return next(error);
  }
};

export const getMyIssueStatsController = async (req, res, next) => {
  try {
    const stats = await getMyIssueStats(req.authUser);
    return res.status(200).json({ stats });
  } catch (error) {
    return next(error);
  }
};

export const getIssueByIdController = async (req, res, next) => {
  try {
    const issue = await getIssueById(req.params.issueId);
    return res.status(200).json({ issue });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const voteIssueController = async (req, res, next) => {
  try {
    const { type } = voteIssueSchema.parse(req.body);
    const issue = await voteIssue(req.params.issueId, type, req.authUser);
    return res.status(200).json({
      message: "Vote updated.",
      issue,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
