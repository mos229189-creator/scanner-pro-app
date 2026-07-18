import { createContext, useContext, useEffect, useState } from "react";

export type Language = "en" | "ar";

type Translations = Record<string, string>;

const enTranslations: Translations = {
  Scanner: "Scanner",
  Generator: "Generator",
  History: "History",
  "Scan Result": "Scan Result",
  Copy: "Copy",
  "Open URL": "Open URL",
  "Generate QR Code": "Generate QR Code",
  Download: "Download",
  "Scan History": "Scan History",
  "Clear All": "Clear All",
  "No scans yet": "No scans yet",
  "Enter text or URL...": "Enter text or URL...",
  "Dark Mode": "Dark Mode",
  "Light Mode": "Light Mode",
  "Copied!": "Copied!",
  "Camera permission denied": "Camera permission denied",
  "Switch Camera": "Switch Camera",
  Torch: "Torch",
  "Advertisement": "Advertisement",
};

const arTranslations: Translations = {
  Scanner: "الماسح الضوئي",
  Generator: "المولّد",
  History: "السجل",
  "Scan Result": "نتيجة المسح",
  Copy: "نسخ",
  "Open URL": "فتح الرابط",
  "Generate QR Code": "توليد رمز QR",
  Download: "تحميل",
  "Scan History": "سجل المسح",
  "Clear All": "مسح الكل",
  "No scans yet": "لا توجد عمليات مسح بعد",
  "Enter text or URL...": "أدخل نصاً أو رابطاً...",
  "Dark Mode": "الوضع الداكن",
  "Light Mode": "الوضع الفاتح",
  "Copied!": "تم النسخ!",
  "Camera permission denied": "تم رفض إذن الكاميرا",
  "Switch Camera": "تبديل الكاميرا",
  Torch: "المصباح",
  "Advertisement": "إعلان",
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = (key: string) => {
    if (language === "ar") {
      return arTranslations[key] || key;
    }
    return enTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
