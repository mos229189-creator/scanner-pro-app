import { useState, useEffect } from "react";
import { generateId } from "../lib/uuid";

export interface SavedQR {
  id: string;
  label: string;
  text: string;
  type: string;
  timestamp: number;
  fgColor: string;
  bgColor: string;
}

/** Safely parse + validate localStorage saved QRs — discards malformed entries */
function loadSavedQRs(): SavedQR[] {
  try {
    const raw = localStorage.getItem("qr_saved");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedQR =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.text === "string" &&
        typeof item.timestamp === "number"
    );
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);

  useEffect(() => {
    setSavedQRs(loadSavedQRs());
  }, []);

  const saveQR = (qr: Omit<SavedQR, "id" | "timestamp">) => {
    setSavedQRs((prev) => {
      const newQR: SavedQR = {
        ...qr,
        id: generateId(),
        timestamp: Date.now(),
      };
      const updated = [newQR, ...prev].slice(0, 100);
      localStorage.setItem("qr_saved", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteSavedQR = (id: string) => {
    setSavedQRs((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("qr_saved", JSON.stringify(updated));
      return updated;
    });
  };

  return { savedQRs, saveQR, deleteSavedQR };
}
