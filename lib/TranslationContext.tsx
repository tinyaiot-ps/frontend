import React, { createContext, useContext, useState, useEffect } from "react";
import en from "./locales/en.json";
import de from "./locales/de.json";

const translations = { en, de };

type Language = "en" | "de";

interface TranslationContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextProps | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en"); // Default to English

  useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as Language | null;
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  const t = (key: string): string => {
    const keys = key.split(".");
    let result: any = translations[language];
    keys.forEach(k => {
      result = result?.[k];
    });
    return result || key;
  };

  const changeLanguage = (lang: Language) => {
    localStorage.setItem("language", lang); // Save to localStorage
    setLanguage(lang); // Update state
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextProps => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};
