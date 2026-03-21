import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCityIssueDetails } from "@/modules/super-admin/api/super-admin.api";
import type { CityIssueDetail } from "@/modules/super-admin/types/super-admin.types";
import { useI18n } from "@/modules/i18n/useI18n";
import { getDistrictLabel } from "@/modules/citizen/constants/issue.constants";

const CityDistrictAdminsPage = () => {
  const navigate = useNavigate();
  const { district = "" } = useParams();
  const { t } = useI18n();
  const [details, setDetails] = useState<CityIssueDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!district) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getCityIssueDetails(district);
        setDetails(response);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.error || t("errorLoadDistrictAdminInfo"));
        } else {
          toast.error(t("errorLoadDistrictAdminInfo"));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [district]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-foreground/80 motion-safe:animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  if (!details) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("districtAdminInfoNotFound")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="outline" size="sm" onClick={() => navigate(`/super-admin/cities/${encodeURIComponent(details.district)}`)}>
            <ArrowLeft className="h-4 w-4" />
            {t("backToIssueDetails")}
          </Button>
          <h1 className="text-2xl font-bold">
            {t("districtAdminInformationTitle", { district: getDistrictLabel(details.district, t) })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("districtAdminInformationSubtitle")}
          </p>
        </div>
      </div>

      {details.cityAdmins.length ? (
        <div className="grid gap-3">
          {details.cityAdmins.map((admin) => (
            <Card key={admin._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("administrator")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-md border p-2.5"><span className="font-medium">{t("adminId")}:</span> {admin.adminId || t("notAvailable")}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">{t("name")}:</span> {admin.name}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">{t("email")}:</span> {admin.email}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">{t("phone")}:</span> {admin.phone || "-"}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">{t("district")}:</span> {getDistrictLabel(admin.district, t)}</div>
                <div className="rounded-md border p-2.5">
                  <span className="font-medium">{t("status")}:</span> {admin.adminAccess === "active" ? t("active") : t("inactive")}
                </div>
                <div className="rounded-md border p-2.5 md:col-span-2">
                  <span className="font-medium">{t("lastLogin")}:</span>{" "}
                  {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : t("noLoginYet")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {t("noCityAdminAssigned")}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CityDistrictAdminsPage;

