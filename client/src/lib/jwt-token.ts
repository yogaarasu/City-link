interface JwtPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : normalized + "=".repeat(4 - (normalized.length % 4));
  return atob(padded);
};

export const parseJwtPayload = (token: string): JwtPayload | null => {
  if (typeof token !== "string") return null;
  const segments = token.split(".");
  if (segments.length !== 3 || !segments[1]) return null;

  try {
    const decoded = decodeBase64Url(segments[1]);
    const parsed = JSON.parse(decoded) as JwtPayload;
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

export const getJwtExpMs = (token: string): number | null => {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    return null;
  }
  return payload.exp * 1000;
};

export const getJwtRemainingSeconds = (token: string) => {
  const expiresAtMs = getJwtExpMs(token);
  if (!expiresAtMs) return null;
  return Math.floor((expiresAtMs - Date.now()) / 1000);
};

export const isJwtExpired = (token: string, skewSeconds = 10) => {
  const remaining = getJwtRemainingSeconds(token);
  if (remaining === null) return true;
  return remaining <= skewSeconds;
};
