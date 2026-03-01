import { create } from "zustand";
import i18n from "@/modules/i18n/config";

type Language = "en" | "ta";

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const STORAGE_KEY = "citylink:lang";
const LEGACY_LANGUAGE_KEY = "citylink_lang";

const getStoredLanguage = (): Language => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "ta" || raw === "en") {
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);
    return raw;
  }

  const legacy = localStorage.getItem(LEGACY_LANGUAGE_KEY);
  if (legacy === "ta" || legacy === "en") {
    localStorage.setItem(STORAGE_KEY, legacy);
    localStorage.removeItem(LEGACY_LANGUAGE_KEY);
    return legacy;
  }

  localStorage.removeItem(LEGACY_LANGUAGE_KEY);
  return "en";
};

export const useLanguageState = create<LanguageState>((set) => ({
  language: getStoredLanguage(),
  setLanguage: (language) =>
    set(() => {
      localStorage.setItem(STORAGE_KEY, language);
      void i18n.changeLanguage(language);
      return { language };
    }),
  toggleLanguage: () =>
    set((state) => {
      const next = state.language === "en" ? "ta" : "en";
      localStorage.setItem(STORAGE_KEY, next);
      void i18n.changeLanguage(next);
      return { language: next };
    }),
}));

