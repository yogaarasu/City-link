import { useState } from "react";
import { AxiosError } from "axios";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/modules/user/api/user.api";
import { getMyIssueStats } from "@/modules/citizen/api/issue.api";
import { Alert } from "@/components/Alert";
import { useI18n } from "@/modules/i18n/useI18n";

interface DangerZoneSectionProps {
  onAccountDeleted: () => void;
}

export const DangerZoneSection = ({ onAccountDeleted }: DangerZoneSectionProps) => {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!password.trim()) {
      toast.error(t("enterPasswordToContinue"));
      return;
    }
    
    try {
      setIsDeleting(true);
      const stats = await getMyIssueStats();
      if ((stats.pending ?? 0) > 0 || (stats.verified ?? 0) > 0 || (stats.in_progress ?? 0) > 0) {
        toast.error(t("errorDeleteAccountWithOpenIssues"));
        return;
      }
      const response = await deleteAccount({ password });
      toast.success(response.message);
      onAccountDeleted();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? t("errorDeleteAccount"));
        return;
      }
      toast.error(t("errorDeleteAccount"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-500/40">
      <CardHeader>
        <CardTitle className="text-2xl text-red-600">{t("dangerZone")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("dangerZoneSubtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="text-lg font-semibold text-red-600">{t("deleteAccount")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("deleteAccountDescription")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("deleteAccountWarning")}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("enterPasswordToConfirm")}
          </label>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("currentPassword")}
          />
        </div>

        <div className="flex justify-end">
          <Alert 
            trigger={
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("deleteAccount")}
              </Button>
            }
            title={t("deleteAccountTitle")}
            description={t("deleteAccountConfirm")}
            onContinue={handleDelete}
            loading={isDeleting}
          />
        </div>
      </CardContent>
    </Card>
  );
};

