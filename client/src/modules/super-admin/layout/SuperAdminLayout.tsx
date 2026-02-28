import { useMemo, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CircleUser,
  Globe,
  LogOut,
  MapPinned,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguageState } from "@/store/language.store";
import { useUserState } from "@/store/user.store";
import { UserAvatar } from "@/modules/user/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = useUserState((state) => state.user);
  const clearUser = useUserState((state) => state.clearUser);
  const { language, toggleLanguage } = useLanguageState();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        to: "/super-admin/dashboard",
        label: "System Overview",
        icon: BarChart3,
      },
      {
        to: "/super-admin/city-admins",
        label: "Manage City Admins",
        icon: Building2,
      },
    ],
    []
  );

  const onLogout = () => {
    clearUser();
    navigate("/auth/login", { replace: true });
  };

  const navigateAndCloseMobile = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/super-admin/dashboard" className="flex items-center gap-2 text-2xl font-bold text-emerald-600">
          <MapPinned className="h-6 w-6" />
          CityLink
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator className="mx-4 mb-3" />

      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <Separator className="my-4" />

        <Button
          variant="ghost"
          className="mb-1 w-full justify-start gap-3 text-sm hover:bg-muted hover:text-foreground"
          onClick={() => {
            toggleLanguage();
            setIsMobileMenuOpen(false);
          }}
        >
          <Globe className="h-5 w-5" />
          {language === "en" ? "தமிழ்" : "English"}
        </Button>

        <Button
          variant="ghost"
          className="mb-1 w-full justify-start gap-3 text-sm hover:bg-muted hover:text-foreground"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
            setIsMobileMenuOpen(false);
          }}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          Theme
        </Button>

        <Button
          variant="ghost"
          className="mb-2 w-full justify-start gap-3 text-sm hover:bg-muted hover:text-foreground"
          onClick={() => {
            navigateAndCloseMobile("/super-admin/settings");
          }}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mb-2 w-full justify-start gap-3 py-5">
              <UserAvatar name={user?.name} avatar={user?.avatar} className="h-8 w-8 text-sm" />
              <div className="flex min-w-0 flex-col items-start text-left">
                <span className="truncate text-sm font-semibold">{user?.name ?? "Super Admin"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.role ?? "super_admin"}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem onClick={() => navigateAndCloseMobile("/super-admin/profile")}>
              <CircleUser className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="h-svh overflow-hidden bg-muted/30">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
        <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen((prev) => !prev)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
          <MapPinned className="h-4.5 w-4.5 text-emerald-600" />
          CityLink
        </h1>
        <div className="w-9" />
      </header>

      <div className="flex h-[calc(100svh-57px)] md:h-svh">
        <aside className="hidden h-svh w-72 shrink-0 border-r bg-sidebar md:block">{sidebar}</aside>

        {isMobileMenuOpen && (
          <button
            aria-label="Close sidebar overlay"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar transition-transform md:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
