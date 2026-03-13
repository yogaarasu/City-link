import { useMemo, useState, type ComponentType } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  Globe,
  Moon,
  Sun,
  Settings,
  LogOut,
  X,
  CircleUser,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguageState } from "@/store/language.store";
import { useUserState } from "@/store/user.store";
import { UserAvatar } from "@/modules/user/components/UserAvatar";
import { LogoutConfirmDialog } from "@/modules/user/components/LogoutConfirmDialog";
import { HamburgerIcon } from "@/components/ui/hamburger-icon";
import { useI18n } from "@/modules/i18n/useI18n";

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const CitizenLayout = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const user = useUserState((state) => state.user);
  const clearUser = useUserState((state) => state.clearUser);
  const { language, toggleLanguage } = useLanguageState();
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        to: "/citizen/dashboard",
        label: t("dashboard"),
        icon: LayoutDashboard,
      },
      {
        to: "/citizen/report-issue",
        label: t("reportIssue"),
        icon: MapPin,
      },
      {
        to: "/citizen/community-issues",
        label: t("communityIssues"),
        icon: Users,
      },
    ],
    [t]
  );

  const onLogoutConfirm = () => {
    clearUser();
    navigate("/auth/login", { replace: true });
  };

  const requestLogout = () => setIsLogoutDialogOpen(true);

  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden overscroll-none">
      <div className="flex items-center justify-between px-4 py-4">
        <Link to="/citizen/dashboard" className="flex items-center gap-2 text-3xl font-bold text-emerald-500">
          <img src="/citylink-logo-new.png" alt="CityLink logo" className="h-7 w-7 rounded-md" />
          CityLink
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X className="size-6" />
        </Button>
      </div>
      <Separator className="mx-4 mb-3" />

      <nav className="space-y-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-lg font-medium transition",
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
          className="mb-1 w-full justify-start gap-3 py-3 text-lg hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-foreground"
          onClick={() => {
            toggleLanguage();
            setIsMobileMenuOpen(false);
          }}
        >
          <Globe className="h-5 w-5" />
          {language === "en" ? t("tamil") : t("english")}
        </Button>

        <Button
          variant="ghost"
          className="mb-1 w-full justify-start gap-3 py-3 text-lg hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-foreground"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
            setIsMobileMenuOpen(false);
          }}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {t("theme")}
        </Button>

        <Button
          variant="ghost"
          className="mb-2 w-full justify-start gap-3 py-3 text-lg hover:bg-gray-100 hover:text-foreground dark:hover:bg-gray-800 dark:hover:text-foreground"
          onClick={() => {
            navigate("/citizen/settings");
            setIsMobileMenuOpen(false);
          }}
        >
          <Settings className="h-5 w-5" />
          {t("settings")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mb-2 h-auto w-full justify-start gap-3 py-3">
              <UserAvatar name={user?.name} avatar={user?.avatar} className="h-9 w-9 text-sm" />
              <div className="flex min-w-0 flex-col items-start text-left">
                <span className="truncate text-sm font-semibold">{user?.name ?? "User"}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuItem className="py-2.5 text-base" onClick={() => navigate("/citizen/profile")}>
              <CircleUser className="mr-2 h-4 w-4" />
              {t("myProfile")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={requestLogout} className="py-2.5 text-base text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="h-svh overflow-hidden bg-muted/30">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-gradient-to-b from-background via-background/95 to-background/80 px-4 py-3 shadow-sm backdrop-blur-md transition-colors duration-300 md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full p-0 hover:bg-transparent focus-visible:ring-0"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {!isMobileMenuOpen && <HamburgerIcon />}
          </Button>
          <h1 className="flex items-center gap-1.5 text-lg font-semibold text-foreground">
            <img src="/citylink-logo-new.png" alt="CityLink logo" className="h-7 w-7 rounded-lg" />
            <span className="text-xl">Citylink</span>
          </h1>
        </div>
        <Popover open={isMobileProfileMenuOpen} onOpenChange={setIsMobileProfileMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0 hover:bg-transparent">
              <UserAvatar name={user?.name} avatar={user?.avatar} className="h-9 w-9" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-64 p-3 md:hidden"
          >
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-0 right-0 h-7 w-7 rounded-full"
                onClick={() => setIsMobileProfileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>

              <div className="flex flex-col items-center gap-2 pt-1 pb-0.5">
                <UserAvatar name={user?.name} avatar={user?.avatar} className="h-14 w-14 text-base" />
                <p className="max-w-full truncate text-sm font-semibold">{user?.name ?? "User"}</p>
                <p className="max-w-full truncate text-xs leading-5 text-muted-foreground">{user?.email ?? "-"}</p>
              </div>

              <Separator className="my-3" />

              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start py-2.5 text-base"
                  onClick={() => {
                    setIsMobileProfileMenuOpen(false);
                    navigate("/citizen/profile");
                  }}
                >
                  <CircleUser className="mr-2 h-4 w-4" />
                  {t("myProfile")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-2.5 text-base"
                  onClick={() => {
                    setIsMobileProfileMenuOpen(false);
                    navigate("/citizen/settings");
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-2.5 text-base text-red-600 hover:text-red-600"
                  onClick={() => {
                    setIsMobileProfileMenuOpen(false);
                    requestLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("logout")}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </header>

      <div className="flex h-[calc(100svh-57px)] md:h-svh">
        <aside className="hidden h-svh w-72 shrink-0 border-r bg-sidebar md:block">{sidebar}</aside>

        <button
          aria-label="Close sidebar overlay"
          className={cn(
            "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ease-out md:hidden",
            isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar transition-transform duration-300 ease-out md:hidden",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebar}
        </aside>

        <main className="flex-1 scrollbar-hide overflow-y-auto overscroll-none p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
        onConfirm={onLogoutConfirm}
      />
    </div>
  );
};

export default CitizenLayout;



