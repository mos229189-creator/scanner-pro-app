import { useState, useEffect } from "react";

export interface ScanResult {
  id: string;
  text: string;
  timestamp: number;
  format?: string;
  isURL: boolean;
  type?: string;
  isFavorite?: boolean;
}

export function useHistory() {
  const [history, setHistory] = useState<ScanResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("qr_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const addScan = (text: string, format?: string) => {
    const isURL = /^(https?:\/\/)/i.test(text);
    
    setHistory((prev) => {
      // Prevent consecutive identical scans within 2 seconds
      if (prev.length > 0 && prev[0].text === text && (Date.now() - prev[0].timestamp) < 2000) {
        return prev;
      }
      
      const newScan: ScanResult = {
        id: crypto.randomUUID(),
        text,
        timestamp: Date.now(),
        format,
        isURL,
        isFavorite: false,
      };
      
      const updated = [newScan, ...prev].slice(0, 500); // Keep last 500
      localStorage.setItem("qr_history", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem("qr_history", JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (id: string) => {
    setHistory((prev) => {
      const updated = prev.map(item => 
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
