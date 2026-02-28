import { z } from "zod";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please provide a valid email address"),
  district: z.string().min(3, "Please provide a District Name."),
  address: z.string().min(5, "Please provide a detailed address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const validateUser = (req, res, next) => {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors?.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during validation"
    });
  }
};
