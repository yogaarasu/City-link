import { ThemeToggler } from "@/components/ThemeToggler"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Outlet, useNavigate } from "react-router-dom"

export const AuthLayout = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 p-2 flex justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Button size="icon-sm" variant="secondary" onClick={() => navigate("/")}>
            <ArrowLeft strokeWidth={3} />
          </Button>
          <h1 className="font-bold text-emerald-500 text-2xl">CityLink</h1>
        </div>
        <ThemeToggler />
      </header>
      <Outlet />
    </>
  )
}
