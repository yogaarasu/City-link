import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CityAdminIssue } from "../types/city-admin-issue.types";
import { exportCityAdminIssuesToExcel } from "../utils/issue-export";

interface CityAdminIssueExportButtonProps {
  issues: CityAdminIssue[];
  district?: string | null;
  startDate?: string;
  endDate?: string;
  disabled?: boolean;
}

export const CityAdminIssueExportButton = ({
  issues,
  district,
  startDate,
  endDate,
  disabled = false,
}: CityAdminIssueExportButtonProps) => {
  const handleExport = () => {
    if (!issues.length) {
      toast.error("No issues available for export.");
      return;
    }
    exportCityAdminIssuesToExcel(issues, { district, startDate, endDate });
    toast.success("Excel export created.");
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || issues.length === 0}
    >
      <FileDown className="h-4 w-4" />
      Export
    </Button>
  );
};
