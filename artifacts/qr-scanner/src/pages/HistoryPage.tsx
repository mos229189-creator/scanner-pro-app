import { Trash2, Copy, ExternalLink, QrCode, Barcode, History as HistoryIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useHistory } from "../hooks/use-history";
import { toast } from "@/hooks/use-toast";

export default function HistoryPage() {
  const { t, language } = useLanguage();
  const { history, clearHistory } = useHistory();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t("Copied!") });
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(timestamp));
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <HistoryIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{t("Scan History")}</h2>
        <p className="text-muted-foreground text-sm max-w-[200px]">{t("No scans yet")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm z-10 sticky top-0">
        <h2 className="text-lg font-semibold text-foreground">{t("Scan History")}</h2>
        <button 
          onClick={clearHistory}
          className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors py-2 px-3 rounded-md hover:bg-destructive/10"
        >
          {t("Clear All")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {history.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="flex items-center gap-2">
                {item.format === 'QR_CODE' ? (
                  <QrCode className="w-4 h-4 text-primary" />
                ) : (
                  <Barcode className="w-4 h-4 text-primary" />
                )}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {item.format || 'QR_CODE'}
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(item.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-card-foreground font-medium break-words mb-4 line-clamp-2" dir="auto">
              {item.text}
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleCopy(item.text)}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-lg text-xs font-semibold transition-colors active:bg-secondary/80"
              >
                <Copy className="w-3.5 h-3.5" />
                {t("Copy")}
              </button>
              
              {item.isURL && (
                <button 
                  onClick={() => handleOpenUrl(item.text)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-xs font-semibold transition-colors active:bg-primary/90"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t("Open URL")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
