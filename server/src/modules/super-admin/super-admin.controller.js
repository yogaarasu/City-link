import { z } from "zod";
import {
  cityAdminIdParamSchema,
  cityDetailsParamSchema,
  createCityAdminSchema,
  emailAvailabilityQuerySchema,
  listCityAdminQuerySchema,
  updateCityAdminNameSchema,
  updateCityAdminSchema,
} from "./super-admin.validation.js";
import {
  checkEmailAvailability,
  createCityAdmin,
  deleteCityAdmin,
  getCityAdminDetails,
  getCityIssueDetails,
  getSystemOverview,
  listCityAdmins,
  updateCityAdminName,
  updateCityAdmin,
} from "./super-admin.service.js";

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

export const getSystemOverviewController = async (_req, res, next) => {
  try {
    const overview = await getSystemOverview();
    return res.status(200).json({ overview });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const getCityIssueDetailsController = async (req, res, next) => {
  try {
    const { district } = cityDetailsParamSchema.parse(req.params);
    const details = await getCityIssueDetails(district);
    return res.status(200).json({ details });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const listCityAdminsController = async (req, res, next) => {
  try {
    const query = listCityAdminQuerySchema.parse(req.query);
    const admins = await listCityAdmins(query);
    return res.status(200).json({ admins });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const checkEmailAvailabilityController = async (req, res, next) => {
  try {
    const query = emailAvailabilityQuerySchema.parse(req.query);
    const result = await checkEmailAvailability(query.email, query.excludeAdminId);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const getCityAdminDetailsController = async (req, res, next) => {
  try {
    const { adminId } = cityAdminIdParamSchema.parse(req.params);
    const details = await getCityAdminDetails(adminId);
    return res.status(200).json({ details });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const createCityAdminController = async (req, res, next) => {
  try {
    const payload = createCityAdminSchema.parse(req.body);
    const admin = await createCityAdmin(payload, req.authUser);
    return res.status(201).json({
      message: "City admin created and welcome email sent.",
      admin,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const updateCityAdminController = async (req, res, next) => {
  try {
    const { adminId } = cityAdminIdParamSchema.parse(req.params);
    const payload = updateCityAdminSchema.parse(req.body);
    const admin = await updateCityAdmin(adminId, payload, req.authUser);
    return res.status(200).json({
      message: "City admin updated and welcome email resent.",
      admin,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const updateCityAdminNameController = async (req, res, next) => {
  try {
    const { adminId } = cityAdminIdParamSchema.parse(req.params);
    const { name } = updateCityAdminNameSchema.parse(req.body);
    const admin = await updateCityAdminName(adminId, name, req.authUser);
    return res.status(200).json({
      message: "City admin name updated successfully.",
      admin,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const deleteCityAdminController = async (req, res, next) => {
  try {
    const { adminId } = cityAdminIdParamSchema.parse(req.params);
    await deleteCityAdmin(adminId);
    return res.status(200).json({
      message: "City admin deleted permanently.",
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
