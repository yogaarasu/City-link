import type { IUser, UserRole } from "@/types/user";

const USER_COOKIE_KEY = "citylink_user";
const LEGACY_STORAGE_KEY = "citylink:user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const COOKIE_SAFE_PAYLOAD_LIMIT = 3500;

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
    .split("; ")
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

const readLegacyLocalUser = (): IUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw) as Partial<IUser>);
  } catch {
    return null;
  }
};

const clearLegacyLocalUser = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
};

export const setUserCookie = (user: IUser) => {
  if (typeof document === "undefined") return;
  const payload = buildCookiePayload(user);
  const encoded = encodeURIComponent(JSON.stringify(payload));
  document.cookie = `${USER_COOKIE_KEY}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  clearLegacyLocalUser();
};

export const getUserFromCookie = (): IUser | null => {
  if (typeof document === "undefined") return null;

  const raw = getCookieValue(USER_COOKIE_KEY);
  if (raw) {
    try {
      const decoded = decodeURIComponent(raw);
      const parsed = JSON.parse(decoded) as Partial<IUser>;
      const user = normalizeUser(parsed);
      clearLegacyLocalUser();
      return user;
    } catch {
      // fall through to legacy migration
    }
  }

  const legacy = readLegacyLocalUser();
  if (legacy) {
    setUserCookie(legacy);
    clearLegacyLocalUser();
    return legacy;
  }

  clearLegacyLocalUser();
  return null;
};

export const clearUserCookie = () => {
  if (typeof document !== "undefined") {
    document.cookie = `${USER_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
  }
  clearLegacyLocalUser();
};
