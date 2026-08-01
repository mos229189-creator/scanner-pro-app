import { useState, useEffect } from "react";
import { generateId } from "../lib/uuid";

export interface ScanResult {
  id: string;
  text: string;
  timestamp: number;
  format?: string;
  isURL: boolean;
  isFavorite?: boolean;
}

/** Safely parse + validate localStorage history — discards malformed entries */
function loadHistory(): ScanResult[] {
  try {
    const raw = localStorage.getItem("qr_history");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ScanResult =>
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

export function useHistory() {
  const [history, setHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addScan = (text: string, format?: string): boolean => {
    let added = false;
    const isURL = /^https?:\/\//i.test(text);

    setHistory((prev) => {
      // Prevent consecutive identical scans within 2 seconds
      if (
        prev.length > 0 &&
        prev[0].text === text &&
        Date.now() - prev[0].timestamp < 2000
      ) {
        return prev; // duplicate — do not add
      }

      added = true;
      const newScan: ScanResult = {
        id: generateId(),
        text,
        timestamp: Date.now(),
        format,
        isURL,
        isFavorite: false,
      };

      const updated = [newScan, ...prev].slice(0, 500);
      localStorage.setItem("qr_history", JSON.stringify(updated));
      return updated;
    });

    return added;
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem("qr_history", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    setHistory((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      localStorage.setItem("qr_history", JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("qr_history");
  };

  return { history, addScan, deleteItem, toggleFavorite, clearHistory };
}
