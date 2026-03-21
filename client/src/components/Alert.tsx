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
import type { JSX } from "react";
import { useI18n } from "@/modules/i18n/useI18n";

interface AlertDialogProps {
  trigger: JSX.Element;
  title: string;
  description: string;
  onContinue: () => void;
  loading?: boolean;
  variant?: "default" | "destructive"
  cancelLabel?: string;
  continueLabel?: string;
}

export function Alert({ trigger, title, description, onContinue, loading, variant, cancelLabel, continueLabel }: AlertDialogProps) {
  const { t } = useI18n();
  const resolvedCancelLabel = cancelLabel ?? t("cancel");
  const resolvedContinueLabel = continueLabel ?? t("continue");
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader className="text-start">
          <AlertDialogTitle className="line-clamp-1">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end">
          <AlertDialogCancel disabled={loading}>{resolvedCancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            onContinue();
          }} disabled={loading} className={`${variant === "destructive" ? "bg-red-500 hover:bg-red-600" : ""}`}>{resolvedContinueLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
