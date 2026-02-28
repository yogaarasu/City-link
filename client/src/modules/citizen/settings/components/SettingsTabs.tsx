import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SettingsTab } from "../types";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export const SettingsTabs = ({ activeTab, onChange }: SettingsTabsProps) => {
  return (
    <div className="inline-flex rounded-xl border bg-card p-1">
      <Button
        variant="ghost"
        onClick={() => onChange("general")}
        className={cn("min-w-32", activeTab === "general" && "bg-muted")}
      >
        General
      </Button>
      <Button
        variant="ghost"
        onClick={() => onChange("appearance")}
        className={cn("min-w-32", activeTab === "appearance" && "bg-muted")}
      >
        Appearance
      </Button>
    </div>
  );
};
