import { useEffect, useState } from "react";
import {
  getSavedLanguage,
  translations,
  type AppLanguage,
} from "./i18n";

export function useTranslation() {
  const [language, setLanguage] = useState<AppLanguage>(getSavedLanguage());

  useEffect(() => {
    const handleChange = () => {
      setLanguage(getSavedLanguage());
    };

    window.addEventListener("languagechange", handleChange);
    window.addEventListener("storage", handleChange);

    return () => {
      window.removeEventListener("languagechange", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const t = translations[language];

  return { t, language };
}
