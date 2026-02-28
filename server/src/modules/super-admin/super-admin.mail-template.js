export const cityAdminWelcomeTemplate = ({
  name,
  email,
  password,
  district,
  updatedBy,
  isUpdate,
}) => {
  const heading = isUpdate ? "Your City Admin Account Was Updated" : "Welcome to City-Link";
  const intro = isUpdate
    ? "Your city administrator account details were updated by the super admin team."
    : "Your city administrator account has been created successfully.";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin: 0; padding: 0; background: #f5f7fb; font-family: Arial, sans-serif; color: #111827;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 28px 14px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb;">
          <tr>
            <td style="padding: 24px 28px; background: #059669; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px;">City-Link</h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">City Administration Access</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px;">
              <h2 style="margin: 0 0 12px; font-size: 22px; color: #111827;">${heading}</h2>
              <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6;">Hello ${name}, ${intro}</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 18px; font-size: 14px; line-height: 1.8;">
                    <strong>Assigned District:</strong> ${district}<br />
                    <strong>Login Email:</strong> ${email}<br />
                    <strong>Temporary Password:</strong> ${password}<br />
                    <strong>Portal:</strong> City-Link Admin Login
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.6;">
                Please login using the credentials above. For security, change your password after first login.
              </p>
              <p style="margin: 0; font-size: 13px; color: #4b5563;">
                Updated by: ${updatedBy}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 18px 28px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              This is an official City-Link service message.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
