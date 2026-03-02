import { ThemeToggler } from "@/components/ThemeToggler";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

export const AuthLayout = () => {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 p-3 flex justify-between backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            className="h-11 w-11"
            onClick={() => navigate("/")}
          >
            <ArrowLeft strokeWidth={3} className="h-6 w-6" />
          </Button>
          <h1 className="bg-linear-to-r from-emerald-500 to-teal-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            CityLink
          </h1>
        </div>
        <ThemeToggler />
      </header>
      <Outlet />
    </>
  );
};
