import type { IUser, UserRole } from "@/types/user";
import { getJwtRemainingSeconds, isJwtExpired } from "./jwt-token";

const USER_COOKIE_KEY = "citylink_user";
const TOKEN_COOKIE_KEY = "citylink_token";
const SESSION_CACHE_KEYS = [
  "citylink:citizen-dashboard-cache",
  "citylink:community-issues-cache:v1",
  "citylink:city-admin-issues-cache:v1",
];
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_SAFE_PAYLOAD_LIMIT = 3500;
const TOKEN_MAX_AGE_FALLBACK_SECONDS = COOKIE_MAX_AGE_SECONDS;

const normalizeUser = (value: Partial<IUser> | null | undefined): IUser | null => {
  if (!value) return null;
  if (typeof value._id !== "string" || !value._id.trim()) return null;
  if (typeof value.role !== "string" || !value.role.trim()) return null;

  return {
    _id: value._id,
    name: typeof value.name === "string" ? value.name : "",
    email: typeof value.email === "string" ? value.email : "",
    phone: typeof value.phone === "string" ? value.phone : undefined,
    address: typeof value.address === "string" ? value.address : "",
    district: typeof value.district === "string" ? value.district : "",
    role: value.role as UserRole,
    adminAccess: value.adminAccess,
    lastLoginAt: value.lastLoginAt ?? null,
    isVerified: Boolean(value.isVerified),
    avatar: typeof value.avatar === "string" ? value.avatar : undefined,
  };
};

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.substring(name.length + 1);
};

const buildCookiePayload = (user: IUser): IUser => {
  const primaryPayload: IUser = {
    ...user,
    avatar:
      typeof user.avatar === "string" && user.avatar.length > 512
        ? undefined
        : user.avatar,
  };

  const serializedPrimary = JSON.stringify(primaryPayload);
  if (serializedPrimary.length <= COOKIE_SAFE_PAYLOAD_LIMIT) {
    return primaryPayload;
  }

  // Keep the payload under common cookie limits.
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    district: user.district,
    role: user.role,
    adminAccess: user.adminAccess,
    lastLoginAt: user.lastLoginAt ?? null,
    isVerified: user.isVerified,
    avatar: undefined,
  };
};

const expireCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
};

const normalizeCookieMaxAge = (value?: number | null) => {
  if (!Number.isFinite(value)) return COOKIE_MAX_AGE_SECONDS;
  return Math.max(1, Math.floor(Number(value)));
};

const getTokenCookieMaxAge = (token: string, explicitMaxAgeSeconds?: number) => {
  if (typeof explicitMaxAgeSeconds === "number" && Number.isFinite(explicitMaxAgeSeconds)) {
    return normalizeCookieMaxAge(explicitMaxAgeSeconds);
  }

  const remaining = getJwtRemainingSeconds(token);
  if (remaining === null) return TOKEN_MAX_AGE_FALLBACK_SECONDS;
  return normalizeCookieMaxAge(remaining);
};

export const setUserCookie = (user: IUser, maxAgeSeconds?: number) => {
  if (typeof document === "undefined") return;
  const payload = buildCookiePayload(user);
  const encoded = encodeURIComponent(JSON.stringify(payload));
  document.cookie = `${USER_COOKIE_KEY}=${encoded}; path=/; max-age=${normalizeCookieMaxAge(maxAgeSeconds)}; samesite=lax`;
};

export const setAuthTokenCookie = (token: string, maxAgeSeconds?: number) => {
  if (typeof document === "undefined") return;
  if (isJwtExpired(token, 0)) {
    expireCookie(TOKEN_COOKIE_KEY);
    return;
  }

  const encoded = encodeURIComponent(token);
  const cookieMaxAge = getTokenCookieMaxAge(token, maxAgeSeconds);
  document.cookie = `${TOKEN_COOKIE_KEY}=${encoded}; path=/; max-age=${cookieMaxAge}; samesite=lax`;
};

export const getUserFromCookie = (): IUser | null => {
  if (typeof document === "undefined") return null;
  const token = getAuthTokenFromCookie();
  if (!token) {
    clearAuthSessionCookie();
    return null;
  }

  const raw = getCookieValue(USER_COOKIE_KEY);
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded) as Partial<IUser>;
      return normalizeUser(parsed);
    } catch {
      return null;
    }
  }
  return null;
};

export const clearUserCookie = () => {
  expireCookie(USER_COOKIE_KEY);
};

export const getAuthTokenFromCookie = (): string => {
  const value = getCookieValue(TOKEN_COOKIE_KEY);
  if (!value) return "";

  try {
    const token = decodeURIComponent(value);
    if (isJwtExpired(token)) {
      clearAuthSessionCookie();
      return "";
    }
    return token;
  } catch {
    clearAuthSessionCookie();
    return "";
  }
};

const clearSessionCaches = () => {
  if (typeof window === "undefined") return;
  for (const cacheKey of SESSION_CACHE_KEYS) {
    try {
      window.sessionStorage.removeItem(cacheKey);
    } catch {
      // ignore storage errors
    }
  }
};

export const clearAuthTokenCookie = () => {
  expireCookie(TOKEN_COOKIE_KEY);
};

export const setAuthSessionCookie = (user: IUser, token: string) => {
  if (isJwtExpired(token, 0)) {
    clearAuthSessionCookie();
    return;
  }
  const cookieMaxAge = getTokenCookieMaxAge(token);
  setAuthTokenCookie(token, cookieMaxAge);
  setUserCookie(user, cookieMaxAge);
};

export const clearAuthSessionCookie = () => {
  clearUserCookie();
  clearAuthTokenCookie();
  clearSessionCaches();
};

