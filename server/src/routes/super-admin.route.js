import express from "express";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  checkEmailAvailabilityController,
  createCityAdminController,
  deleteCityAdminController,
  getCityAdminDetailsController,
  getCityIssueDetailsController,
  getSystemOverviewController,
  listCityAdminsController,
  updateCityAdminNameController,
  updateCityAdminController,
} from "../modules/super-admin/super-admin.controller.js";

export const superAdminRoutes = express.Router();

superAdminRoutes.use(requireAuth, requireRoles("super_admin"));

superAdminRoutes.get("/overview", getSystemOverviewController);
superAdminRoutes.get("/cities/:district", getCityIssueDetailsController);
superAdminRoutes.get("/city-admins/email-availability", checkEmailAvailabilityController);
superAdminRoutes.get("/city-admins", listCityAdminsController);
superAdminRoutes.get("/city-admins/:adminId", getCityAdminDetailsController);
superAdminRoutes.post("/city-admins", createCityAdminController);
superAdminRoutes.patch("/city-admins/:adminId", updateCityAdminController);
superAdminRoutes.patch("/city-admins/:adminId/name", updateCityAdminNameController);
superAdminRoutes.delete("/city-admins/:adminId", deleteCityAdminController);
