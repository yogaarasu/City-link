import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCityIssueDetails } from "@/modules/super-admin/api/super-admin.api";
import type { CityIssueDetail } from "@/modules/super-admin/types/super-admin.types";

const CityDistrictAdminsPage = () => {
  const navigate = useNavigate();
  const { district = "" } = useParams();
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
          toast.error(error.response?.data?.error || "Failed to load district admin information.");
        } else {
          toast.error("Failed to load district admin information.");
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
          District admin information not found.
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
            Back to Issue Details
          </Button>
          <h1 className="text-2xl font-bold">{details.district} Admin Information</h1>
          <p className="text-sm text-muted-foreground">
            City administrator contact and access details.
          </p>
        </div>
      </div>

      {details.cityAdmins.length ? (
        <div className="grid gap-3">
          {details.cityAdmins.map((admin) => (
            <Card key={admin._id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Administrator</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm md:grid-cols-2">
                <div className="rounded-md border p-2.5"><span className="font-medium">Admin ID:</span> {admin.adminId || "N/A"}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">Name:</span> {admin.name}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">Email:</span> {admin.email}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">Phone:</span> {admin.phone || "-"}</div>
                <div className="rounded-md border p-2.5"><span className="font-medium">District:</span> {admin.district}</div>
                <div className="rounded-md border p-2.5">
                  <span className="font-medium">Status:</span> {admin.adminAccess === "active" ? "Active" : "Inactive"}
                </div>
                <div className="rounded-md border p-2.5 md:col-span-2">
                  <span className="font-medium">Last Login:</span>{" "}
                  {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "No login yet"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No city admin assigned for this district.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CityDistrictAdminsPage;

