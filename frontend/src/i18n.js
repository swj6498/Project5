// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ko from "./locales/ko/translation.json";
import en from "./locales/en/translation.json";
import ja from "./locales/ja/translation.json";

const savedLang = localStorage.getItem("i18nextLng") || "ko";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: savedLang,
    fallbackLng: "ko",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
