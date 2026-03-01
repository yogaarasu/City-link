import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ta from "./locales/ta.json";

export type I18nKey = keyof typeof en;
export type I18nLanguage = "en" | "ta";

const STORAGE_KEY = "citylink:lang";

const getStoredLanguage = (): I18nLanguage => {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "ta" ? "ta" : "en";
};

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ta: { translation: ta },
  },
  lng: getStoredLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;

