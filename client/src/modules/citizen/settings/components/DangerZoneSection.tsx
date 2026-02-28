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

interface DangerZoneSectionProps {
  onAccountDeleted: () => void;
}

export const DangerZoneSection = ({ onAccountDeleted }: DangerZoneSectionProps) => {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") {
      toast.error("Type DELETE to continue.");
      return;
    }
    
    try {
      setIsDeleting(true);
      const stats = await getMyIssueStats();
      if ((stats.pending ?? 0) > 0 || (stats.in_progress ?? 0) > 0) {
        toast.error("You cannot delete account while issues are pending or in progress.");
        return;
      }
      const response = await deleteAccount({ confirmation });
      toast.success(response.message);
      onAccountDeleted();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.error ?? "Failed to delete account");
        return;
      }
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-red-500/40">
      <CardHeader>
        <CardTitle className="text-2xl text-red-600">Danger Zone</CardTitle>
        <p className="text-sm text-muted-foreground">Irreversible actions for your account.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="text-lg font-semibold text-red-600">Delete Account</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently remove your account details. Reported issues remain in the system.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            You cannot delete while any issue is pending or in progress.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Type <span className="font-bold">DELETE</span> to confirm
          </label>
          <Input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </div>

        <div className="flex justify-end">
          <Alert 
            trigger={
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            }
            title="Delete Account"
            description="Are you sure you want to delete your account? This action is irreversible."
            onContinue={handleDelete}
            loading={isDeleting}
          />
        </div>
      </CardContent>
    </Card>
  );
};
