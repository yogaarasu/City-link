import { ForgotPasswordEmailForm } from "@/modules/auth/password-reset/components/ForgotPasswordEmailForm";

const ForgotPassword = () => {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordEmailForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
