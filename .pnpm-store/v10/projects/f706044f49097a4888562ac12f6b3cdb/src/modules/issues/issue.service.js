import { Issue } from "../../models/issue.model.js";
import mongoose from "mongoose";
import {
  isValidCategory,
  isValidDistrict,
  isValidIssueStatus,
} from "./issue.validation.js";
import {
  uploadReportedIssuePhotos,
  uploadResolvedIssueEvidencePhotos,
} from "./issue-photo-upload.service.js";
import { transporter } from "../../lib/mailer.js";
import { SMTP_USER } from "../../../utils/constants.js";
import dayjs from "dayjs";
import Holidays from "date-holidays";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const ISSUE_VERIFY_SLA_HOURS = 24;
const ISSUE_COMPLETE_SLA_DAYS = 7;

const PENDING_ESCALATION_REASON = "Not verified within 24 hours.";
const COMPLETION_ESCALATION_REASON = "Not completed within 7 days.";

const getDefaultStatusDescription = (status, rejectionReason) => {
  const descriptions = {
    pending: "Issue marked as pending for review.",
    verified: "Issue verified by city admin.",
    in_progress: "Issue moved to in progress.",
    resolved: "Issue marked as resolved.",
    rejected: rejectionReason ? `Issue rejected: ${rejectionReason}.` : "Issue rejected.",
  };

  return descriptions[status] || "";
};

const getLatestOptionalNote = (issue) => {
  const logs = issue?.statusLogs || [];
  if (!logs.length) return "";

  const latest = logs[logs.length - 1];
  const fallback = getDefaultStatusDescription(latest.status, issue?.rejectionReason);
  const description = String(latest?.description || "").trim();

  if (!description || description === fallback) return "";
  return description;
};

const attachLatestOptionalNote = (issue) => {
  const latestOptionalNote = getLatestOptionalNote(issue);
  return {
    ...issue,
    latestOptionalNote,
  };
};

const tamilNaduHolidays = new Holidays("IN", "TN");

const isTamilNaduHoliday = (date) => {
  const holiday = tamilNaduHolidays.isHoliday(date);
  return Boolean(holiday && (Array.isArray(holiday) ? holiday.length : true));
};

const isWeekend = (date) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

const subtractWorkingHours = (startDate, hoursToSubtract) => {
  let remaining = hoursToSubtract;
  let cursor = dayjs(startDate);

  while (remaining > 0) {
    if (isTamilNaduHoliday(cursor.toDate()) || isWeekend(cursor.toDate())) {
      cursor = cursor.startOf("day").subtract(1, "millisecond");
      continue;
    }

    const dayStart = cursor.startOf("day");
    const availableHours = cursor.diff(dayStart, "hour", true);

    if (availableHours <= 0) {
      cursor = dayStart.subtract(1, "millisecond");
      continue;
    }

    const consume = Math.min(remaining, availableHours);
    cursor = cursor.subtract(consume, "hour");
    remaining -= consume;

    if (remaining > 0 && cursor.isSame(dayStart)) {
      cursor = dayStart.subtract(1, "millisecond");
    }
  }

  return cursor.toDate();
};

const sendIssueStatusChangeEmail = async (issue) => {
  const recipient = String(issue?.reportedBy?.email || "").trim();
  if (!recipient) return;

  const isResolved = issue.status === "resolved";
  const safeTitle = String(issue.title || "Reported issue");
  const safeAddress = String(issue.address || "Address unavailable");
  const safeIssueId = String(issue._id || "");
  const updatedAt = issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : new Date().toLocaleString();

  const evidenceGallery = (issue.resolvedEvidencePhotos || [])
    .map(
      (url, index) => `
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:4px;text-decoration:none;">
          <img
            src="${url}"
            alt="Resolved evidence ${index + 1}"
            style="height:120px;width:160px;object-fit:cover;border-radius:8px;border:1px solid #d9dee7;display:block;"
          />
        </a>
      `
    )
    .join("");
  const optionalNote = getLatestOptionalNote(issue);

  const html = `
    <div style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="padding:18px 22px;background:${isResolved ? "#ecfdf3" : "#fef2f2"};border-bottom:1px solid #e5e7eb;">
          <h2 style="margin:0;font-size:20px;line-height:1.3;color:${isResolved ? "#047857" : "#b91c1c"};">
            ${isResolved ? "Issue Resolved Successfully" : "Issue Rejected"}
          </h2>
          <p style="margin:8px 0 0;font-size:13px;color:#4b5563;">
            Status updated on ${updatedAt}
          </p>
        </div>

        <div style="padding:20px 22px;">
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;">
            Your reported issue has been updated.
          </p>

          <div style="margin:0 0 16px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fafafa;">
            <p style="margin:0 0 6px;font-size:13px;"><strong>Issue:</strong> ${safeTitle}</p>
            <p style="margin:0 0 6px;font-size:13px;"><strong>Issue ID:</strong> ${safeIssueId}</p>
            <p style="margin:0;font-size:13px;"><strong>Address:</strong> ${safeAddress}</p>
          </div>

          ${
            isResolved
              ? `
                <h3 style="margin:0 0 8px;font-size:15px;color:#065f46;">Resolution Evidence</h3>
                <p style="margin:0 0 10px;font-size:13px;color:#6b7280;">
                  Click any image to view it in full size.
                </p>
                <div style="margin:0 0 10px;">
                  ${evidenceGallery || '<p style="margin:0;font-size:13px;color:#6b7280;">No evidence images attached.</p>'}
                </div>
              `
              : `
                <h3 style="margin:0 0 8px;font-size:15px;color:#991b1b;">Rejection Reason</h3>
                <div style="padding:10px;border:1px solid #fecaca;border-radius:8px;background:#fff1f2;font-size:13px;color:#7f1d1d;">
                  ${issue.rejectionReason || "No reason provided."}
                </div>
              `
          }

          ${
            optionalNote
              ? `
                <h3 style="margin:16px 0 8px;font-size:15px;color:#111827;">Admin Note</h3>
                <div style="padding:10px;border:1px solid #e5e7eb;border-radius:8px;background:#f9fafb;font-size:13px;color:#374151;">
                  ${optionalNote}
                </div>
              `
              : ""
          }

          <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
            Thank you for helping improve your city with City-Link.
          </p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"City-Link" <${SMTP_USER}>`,
    to: recipient,
    subject: isResolved ? "Your issue has been resolved" : "Your issue has been rejected",
    html,
    text: isResolved
      ? `Your issue "${issue.title}" has been resolved.${optionalNote ? ` Note: ${optionalNote}` : ""}`
      : `Your issue "${issue.title}" has been rejected. Reason: ${issue.rejectionReason || "Not provided"}.${optionalNote ? ` Note: ${optionalNote}` : ""}`,
  });
};

const getSlaBoundaries = () => {
  const now = new Date();
  return {
    verifyDeadline: subtractWorkingHours(now, ISSUE_VERIFY_SLA_HOURS),
    completionDeadline: subtractWorkingHours(now, ISSUE_COMPLETE_SLA_DAYS * 24),
    now,
  };
};

const appendEscalationLogs = async (filter, reason, description, now) => {
  const candidates = await Issue.find(filter).select("_id status").lean();
  if (!candidates.length) return;

  const operations = candidates.map((issue) => ({
    updateOne: {
      filter: { _id: issue._id, assignedTo: "city_admin" },
      update: {
        $set: {
          assignedTo: "super_admin",
          escalationReason: reason,
          escalatedAt: now,
        },
        $push: {
          statusLogs: {
            status: issue.status,
            description,
            createdAt: now,
          },
        },
      },
    },
  }));

  if (operations.length) {
    await Issue.bulkWrite(operations, { ordered: false });
  }
};

export const autoEscalateOverdueIssues = async (district) => {
  const { verifyDeadline, completionDeadline, now } = getSlaBoundaries();
  const districtFilter = district ? { district } : {};

  await appendEscalationLogs(
    {
      ...districtFilter,
      assignedTo: "city_admin",
      status: "pending",
      createdAt: { $lte: verifyDeadline },
    },
    PENDING_ESCALATION_REASON,
    "Auto escalated to super admin: not verified within 24 hours.",
    now
  );

  await appendEscalationLogs(
    {
      ...districtFilter,
      assignedTo: "city_admin",
      status: { $in: ["verified", "in_progress"] },
      createdAt: { $lte: completionDeadline },
    },
    COMPLETION_ESCALATION_REASON,
    "Auto escalated to super admin: not completed within 7 days.",
    now
  );
};

const toRadians = (value) => (value * Math.PI) / 180;

const distanceBetweenMeters = (from, to) => {
  const earthRadius = 6_371_000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const haversine =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  return 2 * earthRadius * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const canTransitionIssueStatus = (currentStatus, nextStatus) => {
  const validTransitions = {
    pending: ["verified"],
    verified: ["in_progress"],
    in_progress: ["resolved", "rejected"],
    resolved: [],
    rejected: [],
  };

  return (validTransitions[currentStatus] || []).includes(nextStatus);
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

  const hasMinVotes = Number.isInteger(query?.minVotes);
  const hasMaxVotes = Number.isInteger(query?.maxVotes);

  if (hasMinVotes || hasMaxVotes) {
    const expr = [];
    if (hasMinVotes) {
      expr.push({ $gte: [{ $add: ["$upVotes", "$downVotes"] }, query.minVotes] });
    }
    if (hasMaxVotes) {
      expr.push({ $lte: [{ $add: ["$upVotes", "$downVotes"] }, query.maxVotes] });
    }
    if (expr.length > 0) {
      filters.$expr = expr.length === 1 ? expr[0] : { $and: expr };
    }
  }

  const isValidDateValue = (value) => value instanceof Date && !Number.isNaN(value.getTime());
  const hasStartDate = isValidDateValue(query?.startDate);
  const hasEndDate = isValidDateValue(query?.endDate);

  if (hasStartDate || hasEndDate) {
    filters.createdAt = {};
    if (hasStartDate) filters.createdAt.$gte = query.startDate;
    if (hasEndDate) filters.createdAt.$lte = query.endDate;
  }

  return filters;
};

export const createIssue = async (payload, authUser) => {
  const uploadedPhotos = await uploadReportedIssuePhotos(payload.photos || []);

  const issue = await Issue.create({
    ...payload,
    photos: uploadedPhotos,
    assignedTo: "city_admin",
    escalationReason: "",
    escalatedAt: null,
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

export const findNearbyDuplicateIssues = async (payload) => {
  const radiusMeters = Number(payload.radiusMeters || 100);

  const candidates = await Issue.find({
    category: payload.category,
    district: payload.district,
    status: { $in: ["pending", "verified", "in_progress", "resolved"] },
  })
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const nearby = candidates
    .map((issue) => ({
      ...issue,
      distanceMeters: Math.round(
        distanceBetweenMeters(payload.location, {
          lat: issue.location.lat,
          lng: issue.location.lng,
        })
      ),
    }))
    .filter((issue) => issue.distanceMeters <= radiusMeters)
    .sort((a, b) => {
      if (a.distanceMeters !== b.distanceMeters) return a.distanceMeters - b.distanceMeters;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return nearby;
};

export const listCommunityIssues = async (query) => {
  await autoEscalateOverdueIssues(query?.district && query.district !== "all" ? query.district : undefined);

  const filters = buildFilters(query);
  const page = Number.isInteger(query?.page) ? query.page : 1;
  const limit = Number.isInteger(query?.limit) ? query.limit : 10;
  const skip = (page - 1) * limit;

  const [issues, total] = await Promise.all([
    Issue.find(filters)
      .populate({ path: "reportedBy", select: "name email district role avatar" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Issue.countDocuments(filters),
  ]);

  return {
    issues: issues.map(attachLatestOptionalNote),
    total,
    page,
    limit,
    hasMore: skip + issues.length < total,
  };
};

export const listMyIssues = async (authUser) => {
  await autoEscalateOverdueIssues(authUser.district);

  const issues = await Issue.find({ reportedBy: authUser._id })
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .lean();

  return issues.map(attachLatestOptionalNote);
};

export const getMyIssueStats = async (authUser) => {
  await autoEscalateOverdueIssues(authUser.district);

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
    verified: 0,
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
  await autoEscalateOverdueIssues(authUser.district);

  const filters = {
    ...buildFilters(query),
    district: authUser.district,
    assignedTo: { $in: ["city_admin", "super_admin"] },
  };

  const issues = await Issue.find(filters)
    .populate({ path: "reportedBy", select: "name email district role avatar" })
    .sort({ createdAt: -1 })
    .lean();

  return issues.map(attachLatestOptionalNote);
};

export const getCityAdminIssueStats = async (authUser) => {
  await autoEscalateOverdueIssues(authUser.district);

  const stats = await Issue.aggregate([
    { $match: { district: authUser.district, assignedTo: "city_admin" } },
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
    verified: 0,
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

  const existingIssue = await Issue.findById(issueId).select("district");
  if (!existingIssue) {
    throw createHttpError(404, "Issue not found.");
  }

  await autoEscalateOverdueIssues(existingIssue.district);

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

  issue.latestOptionalNote = getLatestOptionalNote(issue);
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

  if (["resolved", "rejected"].includes(issue.status)) {
    throw createHttpError(
      409,
      "This issue is already closed. Resolved or rejected issues cannot be changed."
    );
  }

  if (issue.status === payload.status) {
    throw createHttpError(409, "Cannot update to the same status.");
  }

  if (String(issue.district).toLowerCase() !== String(authUser.district).toLowerCase()) {
    throw createHttpError(403, "You can only manage issues from your assigned district.");
  }

  if (!canTransitionIssueStatus(issue.status, payload.status)) {
    throw createHttpError(
      409,
      "Invalid status transition. Use Pending -> Verified -> In Progress -> Resolved/Rejected."
    );
  }

  const statusDescriptions = {
    pending: getDefaultStatusDescription("pending"),
    verified: getDefaultStatusDescription("verified"),
    in_progress: getDefaultStatusDescription("in_progress"),
    resolved: getDefaultStatusDescription("resolved"),
    rejected: getDefaultStatusDescription("rejected", payload.rejectionReason),
  };

  const wasEscalated = issue.assignedTo === "super_admin" || Boolean(issue.escalatedAt);

  issue.status = payload.status;
  if (!wasEscalated) {
    issue.escalationReason = "";
    issue.escalatedAt = null;
  }
  issue.assignedTo = wasEscalated ? "super_admin" : "city_admin";

  if (payload.status === "resolved") {
    issue.resolvedEvidencePhotos = await uploadResolvedIssueEvidencePhotos(
      payload.resolvedEvidencePhotos
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

  if (issue.status === "resolved" || issue.status === "rejected") {
    try {
      await sendIssueStatusChangeEmail(issue);
    } catch (error) {
      console.error("Failed to send issue status update email:", error);
    }
  }

  issue.latestOptionalNote = getLatestOptionalNote(issue);
  return attachLatestOptionalNote(issue);
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
  issue.latestOptionalNote = getLatestOptionalNote(issue);
  return issue;
};

export const deleteIssue = async (issueId, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(issueId)) {
    throw createHttpError(400, "Invalid issue id.");
  }

  const issue = await Issue.findById(issueId);
  if (!issue) {
    throw createHttpError(404, "Issue not found.");
  }

  const issueOwnerId = String(issue.reportedBy);
  if (issueOwnerId !== String(authUser._id)) {
    throw createHttpError(403, "You can delete only your own reported issues.");
  }

  if (issue.status !== "pending") {
    throw createHttpError(409, "Only pending issues can be deleted.");
  }

  await Issue.deleteOne({ _id: issue._id });
  issue.latestOptionalNote = getLatestOptionalNote(issue);
  return issue;
};
