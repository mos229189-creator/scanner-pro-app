import { useState, useEffect } from "react";

export interface SavedQR {
  id: string;
  label: string;
  text: string;
  type: string;
  timestamp: number;
  fgColor: string;
  bgColor: string;
}

export function useFavorites() {
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("qr_saved");
    if (saved) {
      try {
        setSavedQRs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved QRs", e);
      }
    }
  }, []);

  const saveQR = (qr: Omit<SavedQR, "id" | "timestamp">) => {
    setSavedQRs((prev) => {
      const newQR: SavedQR = {
        ...qr,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      const updated = [newQR, ...prev].slice(0, 100);
      localStorage.setItem("qr_saved", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSavedQR = (id: string) => {
    setSavedQRs((prev) => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem("qr_saved", JSON.stringify(updated));
      return updated;
    });
  };

  return { savedQRs, saveQR, deleteSavedQR };
}
