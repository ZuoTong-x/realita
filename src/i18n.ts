import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import { getLanguage } from "./utils/user_util";

const savedLng = getLanguage() || "en";

i18n
  .use(LanguageDetector) // 自动检测用户语言
  .use(initReactI18next) // 让 React 能用 i18n
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh }
    },
    lng: savedLng, // 默认语言
    fallbackLng: "zh", // 找不到时用中文
    interpolation: {
      escapeValue: false // React 已经有 XSS 保护，不需要转义
    },
    detection: {
      order: ["querystring", "localStorage", "cookie", "navigator", "htmlTag"],
      lookupQuerystring: "lng"
    }
  });

export default i18n;
