import type { ComponentType } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { useI18n } from "@/modules/i18n/useI18n";

type ThemeOption = "light" | "dark" | "system";

interface ThemeCardProps {
  value: ThemeOption;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onSelect: (value: ThemeOption) => void;
}

const ThemeCard = ({ value, label, icon: Icon, active, onSelect }: ThemeCardProps) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={cn(
      "flex w-full flex-col items-center gap-2 rounded-lg border p-2 text-left transition hover:border-emerald-500 sm:w-44 sm:gap-3 sm:rounded-xl sm:p-3",
      active && "border-2 border-emerald-500 ring-1 ring-emerald-500/40"
    )}
  >
    <div
      className={cn(
        "h-20 w-full rounded-md border p-2 sm:h-28 sm:p-3",
        value === "light" && "bg-gray-100",
        value === "dark" && "bg-gray-900",
        value === "system" && "bg-slate-700"
      )}
    >
      <div className="space-y-2">
        <div className={cn("rounded-md p-1.5 sm:p-2", value === "light" && "bg-gray-200/80", value === "dark" && "bg-gray-800", value === "system" && "bg-slate-600/70")}>
          <Skeleton className={cn("h-2 w-4/5 sm:h-2.5", value === "light" && "bg-gray-300", value === "dark" && "bg-gray-600", value === "system" && "bg-slate-400/80")} />
        </div>
        <div className={cn("rounded-md p-1.5 sm:p-2", value === "light" && "bg-gray-200/80", value === "dark" && "bg-gray-800", value === "system" && "bg-slate-600/70")}>
          <Skeleton className={cn("h-2 w-3/4 sm:h-2.5", value === "light" && "bg-gray-300", value === "dark" && "bg-gray-600", value === "system" && "bg-slate-400/80")} />
        </div>
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs font-medium sm:gap-2 sm:text-sm">
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      {label}
    </div>
  </button>
);

export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("appearanceTitle")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("appearanceSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <h3 className="mb-3 text-sm font-medium">{t("theme")}</h3>
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          <ThemeCard
            value="light"
            label={t("light")}
            icon={Sun}
            active={theme === "light"}
            onSelect={setTheme}
          />
          <ThemeCard
            value="dark"
            label={t("dark")}
            icon={Moon}
            active={theme === "dark"}
            onSelect={setTheme}
          />
          <ThemeCard
            value="system"
            label={t("system")}
            icon={Laptop}
            active={theme === "system"}
            onSelect={setTheme}
          />
        </div>
      </CardContent>
    </Card>
  );
};
