import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { TAMIL_NADU_DISTRICTS, getDistrictLabel } from "@/modules/citizen/constants/issue.constants";
import CityAdminForm from "@/modules/super-admin/components/CityAdminForm";
import {
  checkCityAdminEmailAvailability,
  createCityAdmin,
  deleteCityAdmin,
  listCityAdmins,
} from "@/modules/super-admin/api/super-admin.api";
import type { CityAdmin, CityAdminPayload } from "@/modules/super-admin/types/super-admin.types";
import { useI18n } from "@/modules/i18n/useI18n";

const ManageCityAdminsPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [admins, setAdmins] = useState<CityAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");

  const sortedAdmins = useMemo(
    () => [...admins].sort((a, b) => a.name.localeCompare(b.name)),
    [admins]
  );

  const handleApiError = (error: unknown, fallback: string) => {
    if (error instanceof AxiosError) {
      toast.error(error.response?.data?.error || fallback);
      return;
    }
    toast.error(fallback);
  };

  const onDeleteAdmin = async (adminId: string) => {
    try {
      setDeletingAdminId(adminId);
      const response = await deleteCityAdmin(adminId);
      toast.success(response.message);
      await loadAdmins();
    } catch (error: unknown) {
      handleApiError(error, t("errorDeleteCityAdmin"));
    } finally {
      setDeletingAdminId(null);
    }
  };

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await listCityAdmins({
        district,
        search: search.trim() || undefined,
      });
      setAdmins(data);
    } catch (error: unknown) {
      handleApiError(error, t("errorLoadCityAdmins"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [district, search]);

  const onCreate = async (payload: CityAdminPayload) => {
    try {
      setSubmitting(true);
      const availability = await checkCityAdminEmailAvailability(payload.email);
      if (!availability.available) {
        const roleLabel = availability.existingRole ? availability.existingRole.replace("_", " ") : "user";
        toast.error(t("errorEmailInUse", { role: roleLabel }));
        return;
      }

      const response = await createCityAdmin(payload);
      sessionStorage.setItem(`city-admin-password:${response.admin._id}`, payload.password);
      toast.success(response.message);
      setIsCreateDialogOpen(false);
      await loadAdmins();
    } catch (error: unknown) {
      handleApiError(error, t("errorCreateCityAdmin"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("manageCityAdminsTitle")}</h1>
        </div>
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t("addCityAdmin")}
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent
          className="sm:max-w-140"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("addAdministrator")}</DialogTitle>
            <DialogDescription>
              {t("addAdministratorDescription")}
            </DialogDescription>
          </DialogHeader>
          <CityAdminForm
            submitLabel={t("save")}
            isSubmitting={submitting}
            onSubmit={onCreate}
          />
        </DialogContent>
      </Dialog>

      <Card className="rounded-xl">
        <CardContent className="grid grid-cols-1 gap-2 pt-3 md:grid-cols-[7fr_3fr]">
          <div className="w-full">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-full pl-9 text-sm"
                placeholder={t("searchByIdNameEmail")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full">
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="h-9 w-full text-sm">
                <SelectValue placeholder={t("allDistricts")} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="all">{t("allDistricts")}</SelectItem>
                {TAMIL_NADU_DISTRICTS.map((city) => (
                  <SelectItem key={city} value={city}>
                    {getDistrictLabel(city, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("showingAdmins", { count: sortedAdmins.length })}
        </p>
      </div>

      {loading ? (
        <Card className="overflow-hidden rounded-xl">
          <CardHeader className="bg-muted/30 py-3">
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ) : sortedAdmins.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("noCityAdminsFound")}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-xl">
          <CardHeader className="bg-muted/30 py-3">
            <CardTitle className="text-xl">{t("administratorList")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-205 border-collapse text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">{t("adminId")}</th>
                    <th className="px-4 py-3 font-semibold">{t("name")}</th>
                    <th className="px-4 py-3 font-semibold">{t("email")}</th>
                    <th className="px-4 py-3 font-semibold">{t("district")}</th>
                    <th className="px-4 py-3 font-semibold">{t("modify")}</th>
                    <th className="px-4 py-3 font-semibold">{t("remove")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAdmins.map((admin) => (
                    <tr key={admin._id} className="border-t">
                      <td className="align-middle px-4 py-3">
                        <span className="inline-flex rounded-md border px-2 py-1 text-xs font-medium">
                          {admin.adminId || t("notAvailable")}
                        </span>
                      </td>
                      <td className="align-middle px-4 py-3 font-medium">{admin.name}</td>
                      <td className="align-middle px-4 py-3">{admin.email}</td>
                      <td className="align-middle px-4 py-3">
                        <span className="inline-flex rounded-md border px-2 py-1 text-xs font-medium">
                          {getDistrictLabel(admin.district, t)}
                        </span>
                      </td>
                      <td className="align-middle px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/super-admin/city-admins/${admin._id}/edit`)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("edit")}
                        </Button>
                      </td>
                      <td className="align-middle px-4 py-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                              {t("delete")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("deleteCityAdminTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteCityAdminDescription")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteAdmin(admin._id)}
                                disabled={deletingAdminId === admin._id}
                              >
                                {deletingAdminId === admin._id ? t("deleting") : t("delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageCityAdminsPage;

