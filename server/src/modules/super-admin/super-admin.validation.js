import { z } from "zod";
import { TAMIL_NADU_DISTRICTS } from "../issues/issue.constants.js";

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const cityDistrictSchema = z.enum(TAMIL_NADU_DISTRICTS);

const isValidIndianMobile = (value) => {
  if (!/^\+91[6-9]\d{9}$/.test(value)) return false;
  const digits = value.slice(3);
  const uniqueCount = new Set(digits.split("")).size;
  if (uniqueCount === 1) return false;

  let increasing = true;
  let decreasing = true;

  for (let index = 1; index < digits.length; index += 1) {
    const previous = Number(digits[index - 1]);
    const current = Number(digits[index]);
    if (current !== previous + 1) increasing = false;
    if (current !== previous - 1) decreasing = false;
  }

  if (increasing || decreasing) return false;
  return true;
};

export const listCityAdminQuerySchema = z.object({
  district: z.string().optional(),
  search: z.string().optional(),
  adminAccess: z.enum(["all", "active", "inactive"]).optional(),
});

export const emailAvailabilityQuerySchema = z.object({
  email: z.string().trim().email("Valid email is required."),
  excludeAdminId: z.string().regex(objectIdRegex, "Invalid admin id.").optional(),
});

export const cityDetailsParamSchema = z.object({
  district: cityDistrictSchema,
});

export const cityAdminIdParamSchema = z.object({
  adminId: z.string().regex(objectIdRegex, "Invalid admin id."),
});

export const createCityAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Valid email is required."),
  phone: z
    .string()
    .trim()
    .refine(isValidIndianMobile, "Enter a valid Indian mobile number (+91 and 10 digits)."),
  district: cityDistrictSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const updateCityAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().trim().email("Valid email is required."),
  phone: z
    .string()
    .trim()
    .refine(isValidIndianMobile, "Enter a valid Indian mobile number (+91 and 10 digits)."),
  district: cityDistrictSchema,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const updateCityAdminNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
});

export const cityAdminStateSchema = z.object({
  adminAccess: z.enum(["active", "inactive"]),
});
