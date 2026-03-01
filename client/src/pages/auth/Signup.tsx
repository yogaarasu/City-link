import { SignupForm } from "@/components/auth/SignupForm"

const Signup = () => {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}

export default Signup

