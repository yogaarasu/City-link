import { useRef, useState } from "react";
import { AxiosError } from "axios";
import { Settings as SettingsIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserState } from "@/store/user.store";
import { updateProfile } from "@/modules/user/api/user.api";
import { UserAvatar } from "@/modules/user/components/UserAvatar";
import { AppearanceSection } from "@/modules/citizen/settings/components/AppearanceSection";
import { SettingsTabs } from "@/modules/citizen/settings/components/SettingsTabs";
import type { SettingsTab } from "@/modules/citizen/settings/types";
import { useI18n } from "@/modules/i18n/useI18n";

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

const SkeletonRow = () => (
  <div className="space-y-2">
    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
    <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
  </div>
);

const SuperAdminSettingsPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const user = useUserState((state) => state.user);
  const updateUser = useUserState((state) => state.updateUser);
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { t } = useI18n();
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (!files?.[0]) return;
    const selected = files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(selected.type)) {
      toast.error(t("errorImageTypeNotAllowed"));
      return;
    }
    if (selected.size > 3 * 1024 * 1024) {
      toast.error(t("errorProfileImageMaxSize"));
      return;
    }
    try {
      const encoded = await toBase64(selected);
      setAvatar(encoded);
    } catch {
      toast.error(t("errorProcessSelectedImage"));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateProfile({ name, avatar });
      updateUser(response.user);
      toast.success(response.message);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorUpdateProfile"));
        return;
      }
      toast.error(t("errorUpdateProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    try {
      setIsRemovingAvatar(true);
      const response = await updateProfile({
        name: user.name,
        avatar: "",
      });
      setAvatar("");
      updateUser(response.user);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success(t("removeAvatar"));
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorRemoveProfilePicture"));
        return;
      }
      toast.error(t("errorRemoveProfilePicture"));
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-1">
        <h1 className="group flex items-center gap-2 text-4xl font-bold">
          <SettingsIcon className="h-8 w-8 transition-transform group-hover:animate-spin" />
          {t("settings")}
        </h1>
        <p className="text-muted-foreground">
          {t("emailCannotBeChanged")}
        </p>
      </div>

      <SettingsTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "general" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("general")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("superAdminGeneralSubtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!user ? (
              <div className="space-y-4">
                <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : (
              <>
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                  <UserAvatar name={name || user?.name} avatar={avatar} className="h-24 w-24 text-4xl" />
                  <div className="w-full">
                    <p className="mb-2 text-sm text-muted-foreground">{t("profileImageHint")}</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/gif,image/webp"
                      className="hidden"
                      onChange={(event) => handleFileChange(event.target.files)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        {t("uploadProfilePicture")}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleRemoveAvatar}
                        disabled={!avatar || isRemovingAvatar}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isRemovingAvatar ? t("removing") : t("removeAvatar")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("name")}</label>
                    <Input value={name} onChange={(event) => setName(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("emailAddress")}</label>
                    <Input value={user?.email ?? ""} disabled />
                    <p className="text-xs text-muted-foreground">
                      {t("emailLockedMessage")}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {t("saveChanges")}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : user ? (
        <AppearanceSection />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("appearance")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
            <div className="h-24 animate-pulse rounded-xl bg-muted" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuperAdminSettingsPage;

