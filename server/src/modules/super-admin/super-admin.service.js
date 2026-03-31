import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import { Issue } from "../../models/issue.model.js";
import { hash } from "../../lib/password.js";
import { transporter } from "../../lib/mailer.js";
import { SMTP_USER } from "../../../utils/constants.js";
import { cityAdminWelcomeTemplate } from "./super-admin.mail-template.js";
import { appendUserActivityLog } from "./shared/activity-log.js";
import { TAMIL_NADU_DISTRICTS } from "../issues/issue.constants.js";
import { DISTRICT_RTO_CODES } from "./super-admin.constants.js";
import { attachLatestOptionalNote, autoEscalateOverdueIssues } from "../issues/issue.service.js";

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const generateCityAdminId = async (district) => {
  const yearCode = String(new Date().getFullYear()).slice(-2);
  const rtoCode = DISTRICT_RTO_CODES[district] || "99";
  let districtCount = await User.countDocuments({
    role: "city_admin",
    district,
    isDeleted: false,
  });

  while (true) {
    districtCount += 1;
    const candidate = `${yearCode}CTA${districtCount}${rtoCode}`;
    const exists = await User.exists({ adminId: candidate });
    if (!exists) {
      return candidate;
    }
  }
};

const ensureCityAdminId = async (adminDoc) => {
  if (!adminDoc || adminDoc.adminId) return;
  adminDoc.adminId = await generateCityAdminId(adminDoc.district);
  await adminDoc.save();
};

const getSafeAdmin = (admin) => {
  if (!admin) return null;
  const { password, __v, ...safe } = admin.toObject ? admin.toObject() : admin;
  return safe;
};

const sendCityAdminWelcomeEmail = async ({
  to,
  name,
  district,
  password,
  updatedBy,
  isUpdate = false,
}) => {
  const subject = isUpdate
    ? "Citylink City Admin Account Updated"
    : "Welcome to Citylink City Administration";

  await transporter.sendMail({
    from: `"Citylink" <${SMTP_USER}>`,
    to,
    subject,
    html: cityAdminWelcomeTemplate({
      name,
      email: to,
      password,
      district,
      updatedBy,
      isUpdate,
    }),
    text: `Citylink city admin access\nEmail: ${to}\nPassword: ${password}\nDistrict: ${district}`,
  });
};

export const getSystemOverview = async () => {
  const [totalAdmins, activeDistrictsAgg, cityIssueBreakdown] = await Promise.all([
    User.countDocuments({ role: "city_admin", isDeleted: false }),
    User.aggregate([
      {
        $match: {
          role: "city_admin",
          isDeleted: false,
        },
      },
      { $group: { _id: "$district" } },
    ]),
    Issue.aggregate([
      {
        $group: {
          _id: "$district",
          issueCount: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          in_progress: {
            $sum: {
              $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0],
            },
          },
          verified: {
            $sum: {
              $cond: [{ $eq: ["$status", "verified"] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ["$status", "resolved"] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const activeDistrictSet = new Set(activeDistrictsAgg.map((item) => item._id));
  const totalActiveDistricts = TAMIL_NADU_DISTRICTS.filter((district) =>
    activeDistrictSet.has(district)
  ).length;
  const issueMap = new Map(
    cityIssueBreakdown.map((item) => [
      item._id,
      {
        issueCount: item.issueCount,
        pending: item.pending,
        in_progress: item.in_progress,
        verified: item.verified || 0,
        resolved: item.resolved,
        rejected: item.rejected,
      },
    ])
  );

  const districtRows = TAMIL_NADU_DISTRICTS.map((district) => {
    const row = issueMap.get(district) || {
      issueCount: 0,
        pending: 0,
        verified: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
    };
    return {
      district,
      issueCount: row.issueCount,
      districtState: activeDistrictSet.has(district) ? "active" : "inactive",
      statusBreakdown: {
        pending: row.pending,
        verified: row.verified,
        in_progress: row.in_progress,
        resolved: row.resolved,
        rejected: row.rejected,
      },
    };
  }).sort((a, b) => {
    if (b.statusBreakdown.pending !== a.statusBreakdown.pending) {
      return b.statusBreakdown.pending - a.statusBreakdown.pending;
    }
    if (b.statusBreakdown.in_progress !== a.statusBreakdown.in_progress) {
      return b.statusBreakdown.in_progress - a.statusBreakdown.in_progress;
    }
    if (b.statusBreakdown.rejected !== a.statusBreakdown.rejected) {
      return b.statusBreakdown.rejected - a.statusBreakdown.rejected;
    }
    if (b.statusBreakdown.resolved !== a.statusBreakdown.resolved) {
      return b.statusBreakdown.resolved - a.statusBreakdown.resolved;
    }
    return b.issueCount - a.issueCount;
  });

  return {
    totalAdmins,
    totalDistricts: TAMIL_NADU_DISTRICTS.length,
    totalActiveDistricts,
    totalActiveCities: totalActiveDistricts,
    cityIssueBreakdown: districtRows,
  };
};

export const getCityIssueDetails = async (district) => {
  await autoEscalateOverdueIssues(district);

  const [issueStatusBreakdown, issueCategoryBreakdown, repeatedIssues, issues, cityAdmins] =
    await Promise.all([
      Issue.aggregate([
        { $match: { district } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Issue.aggregate([
        { $match: { district } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Issue.aggregate([
        { $match: { district } },
        {
          $group: {
            _id: {
              $toLower: {
                $trim: { input: "$title" },
              },
            },
            title: { $first: "$title" },
            count: { $sum: 1 },
            category: { $first: "$category" },
            latestReportedAt: { $max: "$createdAt" },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1, latestReportedAt: -1 } },
        { $limit: 25 },
      ]),
      Issue.find({ district })
        .populate({ path: "reportedBy", select: "name email district role phone" })
        .sort({ createdAt: -1 })
        .lean(),
      User.find({ role: "city_admin", district, isDeleted: false })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

  await Promise.all(cityAdmins.map((admin) => ensureCityAdminId(admin)));

  const statusMap = {
    total: issues.length,
    pending: 0,
    verified: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  };

  for (const item of issueStatusBreakdown) {
    if (item?._id && typeof statusMap[item._id] === "number") {
      statusMap[item._id] = item.count;
    }
  }

  const issuesWithNotes = issues.map(attachLatestOptionalNote);
  const escalatedIssues = issuesWithNotes.filter(
    (item) =>
      item.assignedTo === "super_admin" &&
      ["pending", "verified", "in_progress"].includes(item.status)
  );

  return {
    district,
    statusBreakdown: statusMap,
    categoryBreakdown: issueCategoryBreakdown.map((item) => ({
      category: item._id,
      count: item.count,
    })),
    repeatedIssues: repeatedIssues.map((item) => ({
      title: item.title,
      category: item.category,
      count: item.count,
      latestReportedAt: item.latestReportedAt,
    })),
    cityAdmins: cityAdmins.map((admin) => ({
      ...getSafeAdmin(admin),
      activityLogs: Array.isArray(admin.activityLogs) ? admin.activityLogs.slice(0, 20) : [],
    })),
    issues: issuesWithNotes,
    escalatedIssues,
  };
};

export const listCityAdmins = async (query) => {
  const filters = {
    role: "city_admin",
    isDeleted: false,
  };

  if (query?.district && query.district !== "all") {
    filters.district = query.district;
  }

  if (query?.search) {
    const regex = new RegExp(query.search, "i");
    filters.$or = [{ name: regex }, { email: regex }, { phone: regex }, { adminId: regex }];
  }

  const admins = await User.find(filters).select("-password").sort({ createdAt: -1 });

  await Promise.all(admins.map((admin) => ensureCityAdminId(admin)));

  return admins.map((admin) => ({
    ...getSafeAdmin(admin),
    activityLogs: Array.isArray(admin.activityLogs) ? admin.activityLogs.slice(0, 20) : [],
  }));
};

export const checkEmailAvailability = async (email, excludeAdminId) => {
  const normalizedEmail = normalizeEmail(email);
  const filters = { email: normalizedEmail };

  if (excludeAdminId) {
    if (!mongoose.Types.ObjectId.isValid(excludeAdminId)) {
      throw createHttpError(400, "Invalid admin id.");
    }
    filters._id = { $ne: excludeAdminId };
  }

  const existing = await User.findOne(filters).select("role isDeleted");

  return {
    available: !existing,
    existingRole: existing?.role || null,
    existingDeleted: Boolean(existing?.isDeleted),
  };
};

export const createCityAdmin = async (payload, authUser) => {
  const email = normalizeEmail(payload.email);
  const existing = await User.findOne({ email });

  if (existing) {
    throw createHttpError(409, "A user with this email already exists.");
  }

  const generatedAdminId = await generateCityAdminId(payload.district);

  const admin = await User.create({
    adminId: generatedAdminId,
    name: payload.name,
    email,
    phone: payload.phone,
    district: payload.district,
    address: `${payload.district} City Administration Office`,
    password: await hash(payload.password),
    role: "city_admin",
    isVerified: true,
  });

  appendUserActivityLog(
    admin,
    "created",
    "City admin account created.",
    {
      createdBy: authUser._id,
      createdByName: authUser.name,
    }
  );
  await admin.save();

  try {
    await sendCityAdminWelcomeEmail({
      to: email,
      name: payload.name,
      district: payload.district,
      password: payload.password,
      updatedBy: authUser.name || authUser.email,
      isUpdate: false,
    });
  } catch (error) {
    await User.deleteOne({ _id: admin._id });
    throw createHttpError(500, "Failed to send welcome email. City admin was not created.");
  }

  return getSafeAdmin(admin);
};

export const updateCityAdmin = async (adminId, payload, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw createHttpError(400, "Invalid admin id.");
  }

  const admin = await User.findOne({
    _id: adminId,
    role: "city_admin",
    isDeleted: false,
  });

  if (!admin) {
    throw createHttpError(404, "City admin not found.");
  }

  const normalizedEmail = normalizeEmail(payload.email);
  const duplicate = await User.findOne({
    _id: { $ne: admin._id },
    email: normalizedEmail,
  });

  if (duplicate) {
    throw createHttpError(409, "Another user with this email already exists.");
  }

  admin.name = payload.name;
  admin.email = normalizedEmail;
  admin.phone = payload.phone;
  const districtChanged = admin.district !== payload.district;
  admin.district = payload.district;
  if (districtChanged) {
    admin.adminId = await generateCityAdminId(payload.district);
  }
  admin.address = `${payload.district} City Administration Office`;
  admin.password = await hash(payload.password);
  appendUserActivityLog(admin, "updated", "City admin details updated by super admin.", {
    updatedBy: authUser._id,
    updatedByName: authUser.name,
  });
  await admin.save();

  await sendCityAdminWelcomeEmail({
    to: normalizedEmail,
    name: payload.name,
    district: payload.district,
    password: payload.password,
    updatedBy: authUser.name || authUser.email,
    isUpdate: true,
  });

  appendUserActivityLog(admin, "welcome_email_sent", "Welcome email sent after profile update.", {
    updatedBy: authUser._id,
  });
  await admin.save();

  return getSafeAdmin(admin);
};

export const getCityAdminDetails = async (adminId) => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw createHttpError(400, "Invalid admin id.");
  }

  const admin = await User.findOne({
    _id: adminId,
    role: "city_admin",
    isDeleted: false,
  }).select("-password");

  if (!admin) {
    throw createHttpError(404, "City admin not found.");
  }

  await ensureCityAdminId(admin);

  const district = admin.district;

  const [statusBreakdown, categoryBreakdown, repeatedIssues, recentIssues] = await Promise.all([
    Issue.aggregate([
      { $match: { district } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Issue.aggregate([
      { $match: { district } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Issue.aggregate([
      { $match: { district } },
      {
        $group: {
          _id: {
            $toLower: {
              $trim: { input: "$title" },
            },
          },
          title: { $first: "$title" },
          category: { $first: "$category" },
          count: { $sum: 1 },
          latestReportedAt: { $max: "$createdAt" },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1, latestReportedAt: -1 } },
      { $limit: 15 },
    ]),
    Issue.find({ district })
      .populate({ path: "reportedBy", select: "name email district role phone" })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  const stats = {
    total: 0,
    pending: 0,
    verified: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0,
  };

  for (const item of statusBreakdown) {
    if (item?._id && typeof stats[item._id] === "number") {
      stats[item._id] = item.count;
      stats.total += item.count;
    }
  }

  return {
    admin: {
      ...getSafeAdmin(admin),
      activityLogs: Array.isArray(admin.activityLogs)
        ? admin.activityLogs.filter((item) => {
            const createdAt = new Date(item.createdAt);
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return createdAt >= sevenDaysAgo;
          })
        : [],
    },
    districtIssueSummary: stats,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      category: item._id,
      count: item.count,
    })),
    repeatedIssues: repeatedIssues.map((item) => ({
      title: item.title,
      category: item.category,
      count: item.count,
      latestReportedAt: item.latestReportedAt,
    })),
    recentIssues,
  };
};

export const updateCityAdminName = async (adminId, name, authUser) => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw createHttpError(400, "Invalid admin id.");
  }

  const admin = await User.findOne({
    _id: adminId,
    role: "city_admin",
    isDeleted: false,
  });

  if (!admin) {
    throw createHttpError(404, "City admin not found.");
  }

  admin.name = name;
  appendUserActivityLog(admin, "name_updated", "City admin name updated by super admin.", {
    updatedBy: authUser._id,
    updatedByName: authUser.name,
  });
  await admin.save();

  return getSafeAdmin(admin);
};

export const deleteCityAdmin = async (adminId) => {
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw createHttpError(400, "Invalid admin id.");
  }

  const admin = await User.findOneAndDelete({
    _id: adminId,
    role: "city_admin",
  });

  if (!admin) {
    throw createHttpError(404, "City admin not found.");
  }

  return { deletedId: adminId };
};
