import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Ban, CheckCircle2, Clock3, Loader2, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCityIssueDetails } from "@/modules/super-admin/api/super-admin.api";
import type { CityIssueDetail } from "@/modules/super-admin/types/super-admin.types";
import { statusToBadgeVariant, statusToLabel } from "@/modules/citizen/utils/issue-ui";

const CityIssueDetailsPage = () => {
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
          toast.error(error.response?.data?.error || "Failed to load district issue details.");
        } else {
          toast.error("Failed to load district issue details.");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [district]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!details) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          District details not found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Button variant="outline" onClick={() => navigate("/super-admin/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
            Back to System Overview
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">{details.district} Issue Full Details</h1>
          <p className="text-sm text-muted-foreground">
            Issue summary with category totals and district status insights.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/super-admin/cities/${encodeURIComponent(details.district)}/admins`)}
        >
          Admin Details
        </Button>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 py-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 rounded-full bg-orange-100 p-1.5 text-orange-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.pending}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 rounded-full bg-sky-100 p-1.5 text-sky-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.verified}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 rounded-full bg-violet-100 p-1.5 text-violet-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.in_progress}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 rounded-full bg-emerald-100 p-1.5 text-emerald-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.resolved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Ban className="h-8 w-8 rounded-full bg-rose-100 p-1.5 text-rose-700" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{details.statusBreakdown.rejected}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Issue Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {details.categoryBreakdown.length ? (
            details.categoryBreakdown.map((item) => (
              <div key={item.category} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{item.category}</span>
                <span className="rounded-md border px-2 py-1 text-xs font-medium">{item.count}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No category records found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalated to Super Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(details.escalatedIssues || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No escalated issues in this district.</p>
          ) : (
            details.escalatedIssues!.map((issue) => (
              <div key={issue._id} className="space-y-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{issue.title}</h3>
                  <Badge variant={statusToBadgeVariant(issue.status)}>{statusToLabel(issue.status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{issue.address}</p>
                {issue.escalationReason ? (
                  <p className="text-sm">
                    <span className="font-medium">Escalation reason:</span> {issue.escalationReason}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Reported: {new Date(issue.createdAt).toLocaleString()}
                </p>
                {issue.escalatedAt ? (
                  <p className="text-xs text-muted-foreground">
                    Escalated: {new Date(issue.escalatedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CityIssueDetailsPage;

