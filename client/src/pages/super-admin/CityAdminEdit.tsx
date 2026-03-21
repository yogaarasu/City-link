import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { checkCityAdminEmailAvailability, getCityAdminDetails, updateCityAdmin } from "@/modules/super-admin/api/super-admin.api";
import CityAdminForm from "@/modules/super-admin/components/CityAdminForm";
import type { CityAdminDetailsResponse, CityAdminPayload } from "@/modules/super-admin/types/super-admin.types";
import { useI18n } from "@/modules/i18n/useI18n";

const CityAdminEditPage = () => {
  const navigate = useNavigate();
  const { adminId = "" } = useParams();
  const { t } = useI18n();
  const [details, setDetails] = useState<CityAdminDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      handleApiError(error, t("errorLoadCityAdmin"));
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

  const onSave = async (payload: CityAdminPayload) => {
    try {
      setIsSubmitting(true);
      const availability = await checkCityAdminEmailAvailability(payload.email, adminId);
      if (!availability.available) {
        const roleLabel = availability.existingRole ? availability.existingRole.replace("_", " ") : "user";
        toast.error(t("errorEmailInUse", { role: roleLabel }));
        return;
      }
      const response = await updateCityAdmin(adminId, payload);
      sessionStorage.setItem(`city-admin-password:${adminId}`, payload.password);
      setKnownPassword(payload.password);
      toast.success(response.message);
      navigate("/super-admin/city-admins", { replace: true });
    } catch (error: unknown) {
      handleApiError(error, t("errorUpdateCityAdmin"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
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
          {t("cityAdminNotFound")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="outline" size="sm" asChild>
            <Link to="/super-admin/city-admins">
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{t("editCityAdminTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("editCityAdminSubtitle")}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("editCityAdminTitle")}</CardTitle>
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
            submitLabel={t("saveResendWelcome")}
            isSubmitting={isSubmitting}
            onSubmit={onSave}
            onCancel={() => navigate("/super-admin/city-admins")}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CityAdminEditPage;

