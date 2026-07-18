import { createContext, useContext } from "react";

interface LanguageContextType {
  t: (key: string) => string;
}

const translations: Record<string, string> = {
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
  Advertisement: "Advertisement",
};

const LanguageContext = createContext<LanguageContextType>({
  t: (key) => translations[key] ?? key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const t = (key: string) => translations[key] ?? key;
  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
