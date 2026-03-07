import { SMTP_HOST, SMTP_PASS, SMTP_PORT, SMTP_USER } from "../../utils/constants.js";
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});
