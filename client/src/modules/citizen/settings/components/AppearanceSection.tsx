import type { ComponentType } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

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
      "flex w-36 flex-col items-center gap-3 rounded-xl border p-3 text-left transition hover:border-emerald-500",
      active && "border-2 border-emerald-500"
    )}
  >
    <div
      className={cn(
        "h-20 w-full rounded-md border",
        value === "light" && "bg-gray-100",
        value === "dark" && "bg-gray-900",
        value === "system" && "bg-slate-700"
      )}
    />
    <div className="flex items-center gap-2 font-medium">
      <Icon className="h-4 w-4" />
      {label}
    </div>
  </button>
);

export const AppearanceSection = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Appearance</CardTitle>
        <p className="text-muted-foreground text-sm">Customize the look and feel of the application.</p>
      </CardHeader>
      <CardContent>
        <h3 className="mb-3 text-sm font-medium">Theme</h3>
        <div className="flex flex-wrap gap-3">
          <ThemeCard
            value="light"
            label="Light"
            icon={Sun}
            active={theme === "light"}
            onSelect={setTheme}
          />
          <ThemeCard
            value="dark"
            label="Dark"
            icon={Moon}
            active={theme === "dark"}
            onSelect={setTheme}
          />
          <ThemeCard
            value="system"
            label="System"
            icon={Laptop}
            active={theme === "system"}
            onSelect={setTheme}
          />
        </div>
      </CardContent>
    </Card>
  );
};
