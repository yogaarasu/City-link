import { useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserState } from "@/store/user.store";
import { AppearanceSection } from "@/modules/citizen/settings/components/AppearanceSection";
import { DangerZoneSection } from "@/modules/citizen/settings/components/DangerZoneSection";
import { ProfileInfoSection } from "@/modules/citizen/settings/components/ProfileInfoSection";
import { SecuritySection } from "@/modules/citizen/settings/components/SecuritySection";
import { SettingsTabs } from "@/modules/citizen/settings/components/SettingsTabs";
import type { SettingsTab } from "@/modules/citizen/settings/types";

const Settings = () => {
  const navigate = useNavigate();
  const clearUser = useUserState((state) => state.clearUser);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const onLogout = () => {
    clearUser();
    navigate("/auth/login", { replace: true });
  };

  const onAccountDeleted = () => {
    clearUser();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="group flex items-center gap-2 text-4xl font-bold">
          <SettingsIcon className="h-8 w-8 transition-transform group-hover:animate-spin" />
          Settings
        </h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "general" ? (
        <div className="space-y-5">
          <ProfileInfoSection onLogout={onLogout} />
          <SecuritySection />
          <DangerZoneSection onAccountDeleted={onAccountDeleted} />
        </div>
      ) : (
        <AppearanceSection />
      )}
    </div>
  );
};

export default Settings;
