import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../utils/constants.js";

const getJwtSecret = () => {
  if (!JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured.");
    error.statusCode = 500;
    throw error;
  }
  return JWT_SECRET;
};

export const signAuthToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      role: user.role || "citizen",
    },
    getJwtSecret(),
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );

export const verifyAuthToken = (token) => jwt.verify(token, getJwtSecret());
