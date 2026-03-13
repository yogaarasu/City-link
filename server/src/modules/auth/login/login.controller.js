import { z } from "zod";
import { loginSchema } from "./login.validation.js";
import { loginUser } from "./login.service.js";
import { setAuthCookie } from "../../../lib/jwt.js";

const handleError = (error, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: error.issues?.[0]?.message || "Validation failed",
    });
  }

  if (error?.statusCode) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return next(error);
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const response = await loginUser(email, password);
    if (response?.token) {
      setAuthCookie(res, response.token);
    }
    return res.status(200).json({
      message: response.message,
      user: response.user,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
