import { Issue } from "../../models/issue.model.js";
import mongoose from "mongoose";
import {
  isValidCategory,
  isValidDistrict,
  isValidIssueStatus,
} from "./issue.validation.js";
import { uploadManyImagesToCloudinary } from "../../lib/cloudinary.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildFilters = (query) => {
  const filters = {};

  if (query?.district && query.district !== "all" && isValidDistrict(query.district)) {
    filters.district = query.district;
  }

  if (query?.category && query.category !== "all" && isValidCategory(query.category)) {
    filters.category = query.category;
  }

  if (query?.status && query.status !== "all" && isValidIssueStatus(query.status)) {
    filters.status = query.status;
  }

  return filters;
};

export const createIssue = async (payload, authUser) => {
  const uploadedPhotos = await uploadManyImagesToCloudinary(payload.photos || [], {
    folder: "city-link/issues/reported",
  });

  const issue = await Issue.create({
    ...payload,
    photos: uploadedPhotos,
    reportedBy: authUser._id,
    statusLogs: [
      {
        status: "pending",
        description: "Issue reported by citizen.",
      },
    ],
  });

  const populated = await issue.populate({
    path: "reportedBy",
    select: "name email district role avatar",
  });

  return populated;
};

export const listCommunityIssues = async (query) => {
  const filters = buildFilters(query);

  return Issue.find(filters)
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .lean();
};

export const listMyIssues = async (authUser) => {
  return Issue.find({ reportedBy: authUser._id })
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .lean();
};

export const getMyIssueStats = async (authUser) => {
  const stats = await Issue.aggregate([
    { $match: { reportedBy: authUser._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const map = {
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  };

  for (const item of stats) {
    if (item?._id && typeof map[item._id] === "number") {
      map[item._id] = item.count;
      map.total += item.count;
    }
  }

  return map;
};

export const listCityAdminIssues = async (query, authUser) => {
  const filters = {
    ...buildFilters(query),
    district: authUser.district,
  };

  return Issue.find(filters)
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .lean();
};

export const getCityAdminIssueStats = async (authUser) => {
  const stats = await Issue.aggregate([
    { $match: { district: authUser.district } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const map = {
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  };

  for (const item of stats) {
    if (item?._id && typeof map[item._id] === "number") {
      map[item._id] = item.count;
      map.total += item.count;
    }
  }

  return map;
};

export const getIssueById = async (issueId) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    throw createHttpError(400, "Invalid issue id.");
  }

  const issue = await Issue.findById(issueId)
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .lean();

  if (!issue) {
    throw createHttpError(404, "Issue not found.");
  }

  return issue;
};

export const voteIssue = async (issueId, type, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    throw createHttpError(400, "Invalid issue id.");
  }

  const issue = await Issue.findById(issueId).populate({
    path: "reportedBy",
    select: "name email district role avatar",
  });

  if (!issue) {
    throw createHttpError(404, "Issue not found.");
  }

  const issueOwnerId = String(issue.reportedBy?._id || issue.reportedBy);
  if (issueOwnerId === String(authUser._id)) {
    throw createHttpError(403, "You cannot vote your own issue.");
  }

  const votes = issue.votes || [];
  const existingVoteIndex = votes.findIndex(
    (vote) => String(vote.user) === String(authUser._id)
  );

  if (existingVoteIndex === -1) {
    votes.push({ user: authUser._id, type });
    if (type === "up") issue.upVotes += 1;
    else issue.downVotes += 1;
  } else {
    const previousType = votes[existingVoteIndex].type;
    if (previousType === type) {
      throw createHttpError(409, "You have already cast this vote.");
    }

    if (previousType === "up") issue.upVotes = Math.max(0, issue.upVotes - 1);
    if (previousType === "down") issue.downVotes = Math.max(0, issue.downVotes - 1);

    if (type === "up") issue.upVotes += 1;
    if (type === "down") issue.downVotes += 1;

    votes[existingVoteIndex].type = type;
  }

  issue.votes = votes;
  await issue.save();

  return issue;
};

export const updateIssueStatusByCityAdmin = async (issueId, payload, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    throw createHttpError(400, "Invalid issue id.");
  }

  const issue = await Issue.findById(issueId).populate({
    path: "reportedBy",
    select: "name email district role avatar",
  });

  if (!issue) {
    throw createHttpError(404, "Issue not found.");
  }

  if (String(issue.district).toLowerCase() !== String(authUser.district).toLowerCase()) {
    throw createHttpError(403, "You can only manage issues from your assigned district.");
  }

  const statusDescriptions = {
    pending: "Issue marked as pending for review.",
    in_progress: "Issue moved to in progress.",
    resolved: "Issue marked as resolved.",
    rejected: payload.rejectionReason
      ? `Issue rejected: ${payload.rejectionReason}.`
      : "Issue rejected.",
  };

  issue.status = payload.status;

  if (payload.status === "resolved") {
    issue.resolvedEvidencePhotos = await uploadManyImagesToCloudinary(
      payload.resolvedEvidencePhotos,
      {
        folder: "city-link/issues/resolved",
      }
    );
    issue.rejectionReason = null;
  } else if (payload.status === "rejected") {
    issue.rejectionReason = payload.rejectionReason;
    issue.resolvedEvidencePhotos = [];
  } else {
    issue.rejectionReason = null;
    issue.resolvedEvidencePhotos = [];
  }

  issue.statusLogs.push({
    status: payload.status,
    description: payload.description || statusDescriptions[payload.status],
  });

  await issue.save();
  return issue;
};

export const reviewResolvedIssue = async (issueId, payload, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    throw createHttpError(400, "Invalid issue id.");
  }

  const issue = await Issue.findById(issueId).populate({
    path: "reportedBy",
    select: "name email district role avatar",
  });

  if (!issue) {
    throw createHttpError(404, "Issue not found.");
  }

  const issueOwnerId = String(issue.reportedBy?._id || issue.reportedBy);
  if (issueOwnerId !== String(authUser._id)) {
    throw createHttpError(403, "Only the reporting citizen can review this issue.");
  }

  if (issue.status !== "resolved") {
    throw createHttpError(409, "You can review an issue only after it is resolved.");
  }

  issue.review = {
    rating: payload.rating,
    comment: payload.comment || "",
    reviewedBy: authUser._id,
    updatedAt: new Date(),
  };

  await issue.save();
  return issue;
};
