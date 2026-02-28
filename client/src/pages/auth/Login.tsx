import { LoginForm } from '@/components/auth/LoginForm'

const Login = () => {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-8 p-6 md:p-10">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}

export default Login
