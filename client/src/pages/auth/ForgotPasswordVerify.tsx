import { ForgotPasswordOTPForm } from "@/modules/auth/password-reset/components/ForgotPasswordOTPForm";

const ForgotPasswordVerify = () => {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="w-full max-w-md">
        <ForgotPasswordOTPForm />
      </div>
    </div>
  );
};

export default ForgotPasswordVerify;
