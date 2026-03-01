import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  checkCityAdminEmailAvailability,
  deleteCityAdmin,
  getCityAdminDetails,
  updateCityAdmin,
  updateCityAdminState,
} from "@/modules/super-admin/api/super-admin.api";
import CityAdminForm from "@/modules/super-admin/components/CityAdminForm";
import type { CityAdminDetailsResponse, CityAdminPayload } from "@/modules/super-admin/types/super-admin.types";

const CityAdminDetailsPage = () => {
  const navigate = useNavigate();
  const { adminId = "" } = useParams();
  const [details, setDetails] = useState<CityAdminDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [knownPassword, setKnownPassword] = useState("");

  const handleApiError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data?.error || fallback);
      return;
    }
    toast.error(fallback);
  };

  const load = async () => {
    if (!adminId) return;
    try {
      setLoading(true);
      const response = await getCityAdminDetails(adminId);
      setDetails(response);
    } catch (error: unknown) {
      handleApiError(error, "Failed to load admin details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [adminId]);

  useEffect(() => {
    if (!adminId) return;
    const saved = sessionStorage.getItem(`city-admin-password:${adminId}`);
    if (saved) setKnownPassword(saved);
  }, [adminId]);

  const onSaveEdit = async (payload: CityAdminPayload) => {
    try {
      setIsSubmittingEdit(true);
      const availability = await checkCityAdminEmailAvailability(payload.email, adminId);
      if (!availability.available) {
        const roleLabel = availability.existingRole ? availability.existingRole.replace("_", " ") : "user";
        toast.error(`This email is already used by another ${roleLabel}.`);
        return;
      }
      const response = await updateCityAdmin(adminId, payload);
      toast.success(response.message);
      sessionStorage.setItem(`city-admin-password:${adminId}`, payload.password);
      setKnownPassword(payload.password);
      setIsEditing(false);
      await load();
    } catch (error: unknown) {
      handleApiError(error, "Failed to update admin details.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const onToggleState = async () => {
    if (!details) return;
    const nextState = details.admin.adminAccess === "active" ? "inactive" : "active";
    try {
      const response = await updateCityAdminState(adminId, nextState);
      toast.success(response.message);
      await load();
    } catch (error: unknown) {
      handleApiError(error, "Failed to update admin state.");
    }
  };

  const onDelete = async () => {
    try {
      const response = await deleteCityAdmin(adminId);
      toast.success(response.message);
      navigate("/super-admin/city-admins", { replace: true });
    } catch (error: unknown) {
      handleApiError(error, "Failed to delete city admin.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <Skeleton className="h-8 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid gap-2 md:grid-cols-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full md:col-span-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          City admin not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/super-admin/city-admins">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing((prev) => !prev)}>
                <Pencil className="h-4 w-4" />
                {isEditing ? "Close Edit" : "Edit"}
              </Button>
              <Button size="sm" variant="outline" onClick={onToggleState}>
                <Power className="h-4 w-4" />
                {details.admin.adminAccess === "active" ? "Set Inactive" : "Set Active"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete admin permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete this city admin account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <CardTitle className="text-lg">City Admin Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            View current admin values and edit to resend updated welcome email.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-1">
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div className="rounded-lg border p-3"><span className="font-medium">Name:</span> {details.admin.name}</div>
            <div className="rounded-lg border p-3"><span className="font-medium">Email:</span> {details.admin.email}</div>
            <div className="rounded-lg border p-3"><span className="font-medium">Phone:</span> {details.admin.phone || "-"}</div>
            <div className="rounded-lg border p-3"><span className="font-medium">District:</span> {details.admin.district}</div>
            <div className="rounded-lg border p-3">
              <span className="font-medium">State:</span> {details.admin.adminAccess === "active" ? "Active" : "Inactive"}
            </div>
            <div className="rounded-lg border p-3">
              <span className="font-medium">Admin ID:</span> {details.admin.adminId || "N/A"}
            </div>
            <div className="rounded-lg border p-3 md:col-span-2">
              <span className="font-medium">Initial Password:</span>{" "}
              {knownPassword || "Not available. Set a new password in Edit."}
            </div>
          </div>
        </CardContent>
      </Card>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Admin Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CityAdminForm
              initialValues={{
                name: details.admin.name,
                email: details.admin.email,
                phone: details.admin.phone,
                district: details.admin.district,
                password: knownPassword,
              }}
              submitLabel="Save + Resend Welcome Email"
              isSubmitting={isSubmittingEdit}
              onSubmit={onSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default CityAdminDetailsPage;

