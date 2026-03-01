import express from "express";
import { userRoutes } from "./user.route.js";
import { authRoutes } from "./auth.route.js";
import { issueRoutes } from "./issue.route.js";
import { superAdminRoutes } from "./super-admin.route.js";
import { geocodeRoutes } from "./geocode.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/issues", issueRoutes);
router.use("/super-admin", superAdminRoutes);
router.use("/geocode", geocodeRoutes);

export default router;
