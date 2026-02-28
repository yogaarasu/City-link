import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { getNormalizedAdminAccess } from "../modules/super-admin/super-admin.constants.js";

export const requireAuth = async (req, res, next) => {
  try {
    const userId = req.header("x-user-id");
    const role = req.header("x-user-role");

    if (!userId || !role) {
      return res.status(401).json({ error: "Unauthorized" });
    }
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
    if (user.role === "city_admin" && getNormalizedAdminAccess(user.adminAccess) === "inactive") {
      return res
        .status(403)
        .json({ error: "Your administrator account is currently inactive by super admin." });
    }

    const userRole = user.role || "citizen";
    if (userRole !== role) {
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

  if (!roles.includes(req.authUser.role)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};
