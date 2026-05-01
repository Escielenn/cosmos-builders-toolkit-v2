import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

// Supported languages, add new ones here as translations are completed
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  // { code: "es", label: "Español" },
  // { code: "fr", label: "Français" },
  // { code: "de", label: "Deutsch" },
  // { code: "pt", label: "Português" },
  // { code: "ja", label: "日本語" },
  // { code: "zh", label: "中文" },
  // { code: "ko", label: "한국어" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Namespaces, add more as tool pages get extracted
    ns: ["common"],
    defaultNS: "common",

    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),

    // Load translation JSON from /public/locales/{lng}/{ns}.json
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },

    // Language detection order: localStorage → browser language → fallback
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "stellarforge-language",
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    // Don't show keys while loading, show nothing until ready
    react: {
      useSuspense: true,
    },
  });

export default i18n;
