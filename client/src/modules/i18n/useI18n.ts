import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useLanguageState } from "@/store/language.store";
import type { I18nKey } from "./config";

export const useI18n = () => {
  const language = useLanguageState((state) => state.language);
  const { t: i18nT } = useTranslation();

  const t = useCallback(
    (key: I18nKey, vars?: Record<string, string | number>) =>
      i18nT(key, (vars || {}) as Record<string, string>),
    [i18nT]
  );

  return { t, language };
};

