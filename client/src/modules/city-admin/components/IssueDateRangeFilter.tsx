import { CalendarDays, X } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useI18n } from "@/modules/i18n/useI18n";

interface IssueDateRangeFilterProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
}

const formatDateLabel = (value: Date | undefined, placeholder: string) => {
  if (!value) return placeholder;
  return format(value, "MMM dd, yyyy");
};

export const IssueDateRangeFilter = ({
  value,
  onChange,
  disabled = false,
  className,
}: IssueDateRangeFilterProps) => {
  const { t } = useI18n();
  const startLabel = formatDateLabel(value?.from, t("startDate"));
  const endLabel = formatDateLabel(value?.to, t("endDate"));

  return (
    <div className={cn("grid w-full gap-2 sm:grid-cols-2", className)}>
      <div className="flex h-12 min-w-0 items-center gap-2 rounded-lg border bg-background/80 p-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              disabled={disabled}
              className={cn(
                "h-9 flex-1 min-w-0 justify-start gap-2 text-sm font-normal",
                !value?.from && "text-muted-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{startLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value?.from}
              onSelect={(date) => {
                if (!date) {
                  onChange({ from: undefined, to: value?.to });
                  return;
                }
                const nextTo = value?.to && value.to < date ? undefined : value?.to;
                onChange({ from: date, to: nextTo });
              }}
              captionLayout="dropdown"
              className="rounded-lg border"
              initialFocus
            />
          </PopoverContent>
          </Popover>
        {value?.from ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onChange({ from: undefined, to: value?.to })}
            aria-label={t("clearStartDate")}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex h-12 min-w-0 items-center gap-2 rounded-lg border bg-background/80 p-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              disabled={disabled}
              className={cn(
                "h-9 flex-1 min-w-0 justify-start gap-2 text-sm font-normal",
                !value?.to && "text-muted-foreground"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="truncate">{endLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value?.to}
              onSelect={(date) => {
                if (!date) {
                  onChange({ from: value?.from, to: undefined });
                  return;
                }
                if (value?.from && date < value.from) {
                  onChange({ from: value.from, to: undefined });
                  return;
                }
                onChange({ from: value?.from, to: date });
              }}
              captionLayout="dropdown"
              className="rounded-lg border"
              disabled={value?.from ? { before: value.from } : undefined}
              initialFocus
            />
          </PopoverContent>
          </Popover>
        {value?.to ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => onChange({ from: value?.from, to: undefined })}
            aria-label={t("clearEndDate")}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};
