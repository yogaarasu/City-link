import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { getAuthTokenFromRequest, verifyAuthToken } from "../lib/jwt.js";

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase();
  if (!value) return "";

  if (value === "citizen") return "citizen";
  if (["cityadmin", "city_admin", "city-admin"].includes(value)) return "city_admin";
  if (["superadmin", "super_admin", "super-admin"].includes(value)) return "super_admin";

  return "";
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getAuthTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let payload;
    try {
      payload = verifyAuthToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = String(payload?.sub || "");
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (user.isDeleted) {
      return res.status(401).json({ error: "Account deleted" });
    }
    const userRole = normalizeRole(user.role || "citizen");
    const tokenRole = normalizeRole(payload?.role);
    if (!userRole || !tokenRole || userRole !== tokenRole) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    user.role = userRole;
    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const allowedRoles = roles.map(normalizeRole).filter(Boolean);
  const userRole = normalizeRole(req.authUser.role);

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};
