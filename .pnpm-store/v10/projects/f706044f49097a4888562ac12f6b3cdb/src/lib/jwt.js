import jwt from "jsonwebtoken";
import {
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  COOKIE_SECURE,
  JWT_EXPIRES_IN,
  JWT_SECRET,
} from "../../utils/constants.js";

const TOKEN_COOKIE_NAME = "citylink_token";

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

const getTokenMaxAgeMs = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== "object" || !decoded.exp) return undefined;
  const expiresAtMs = decoded.exp * 1000;
  return Math.max(0, expiresAtMs - Date.now());
};

const normalizeSameSite = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "strict" || normalized === "none" || normalized === "lax") {
    return normalized;
  }
  return "lax";
};

const getCookieOptions = (maxAgeMs) => {
  const sameSite = normalizeSameSite(COOKIE_SAME_SITE);
  const secure = sameSite === "none" ? true : Boolean(COOKIE_SECURE);
  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    ...(typeof maxAgeMs === "number" ? { maxAge: maxAgeMs } : {}),
  };
};

export const setAuthCookie = (res, token) => {
  const maxAgeMs = getTokenMaxAgeMs(token);
  res.cookie(TOKEN_COOKIE_NAME, token, getCookieOptions(maxAgeMs));
};

export const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, getCookieOptions(0));
};

export const getAuthTokenFromRequest = (req) => {
  return String(req.cookies?.[TOKEN_COOKIE_NAME] || "");
};
