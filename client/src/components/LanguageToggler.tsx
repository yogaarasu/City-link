import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguageState } from "@/store/language.store";
import { useI18n } from "@/modules/i18n/useI18n";

type LanguageTogglerProps = {
  className?: string;
  showLabel?: boolean;
};

export const LanguageToggler = ({ className, showLabel = false }: LanguageTogglerProps) => {
  const { t, language } = useI18n();
  const toggleLanguage = useLanguageState((state) => state.toggleLanguage);

  return (
    <Button
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      className={className}
      onClick={toggleLanguage}
    >
      <Globe className={showLabel ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      {showLabel ? (language === "en" ? t("tamil") : t("english")) : null}
      <span className="sr-only">{t("toggleLanguage")}</span>
    </Button>
  );
};
