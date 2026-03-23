import * as z from "zod";

export const buildPasswordSchema = (t: (key: string) => string) =>
  z
    .string()
    .min(8, t("authPasswordMinLength"))
    .regex(/[A-Z]/, t("authPasswordUppercase"))
    .regex(/[a-z]/, t("authPasswordLowercase"))
    .regex(/[0-9]/, t("authPasswordNumber"))
    .regex(/[^A-Za-z0-9]/, t("authPasswordSpecial"));
