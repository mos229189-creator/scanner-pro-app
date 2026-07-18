import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { 
  Star, 
  Trash2, 
  Copy, 
  ExternalLink,
  QrCode,
  Palette
} from "lucide-react";
import { useHistory } from "../hooks/use-history";
import { useFavorites } from "../hooks/use-favorites";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function FavoritesPage() {
  const [, setLocation] = useLocation();
  const { history, toggleFavorite } = useHistory();
  const { savedQRs, deleteSavedQR } = useFavorites();
  
  const favoriteScans = history.filter(h => h.isFavorite);
  const hasFavorites = favoriteScans.length > 0 || savedQRs.length > 0;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank");
  };

  if (!hasFavorites) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-white/5 bg-card/80 backdrop-blur-xl z-20 shrink-0">
          <h2 className="text-xl font-black text-foreground tracking-tight">Saved</h2>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-60">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
            <Star className="w-10 h-10 text-muted-foreground fill-muted-foreground/20" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">No favorites yet</h2>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            Star a scan in History or save a generated QR to find it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="px-5 pt-5 pb-3 border-b border-white/5 bg-card/80 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-black text-foreground tracking-tight">Saved items</h2>
          <span className="bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full text-xs font-bold">
            {favoriteScans.length + savedQRs.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        
        {/* Saved Generated QRs */}
        {savedQRs.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Generated Designs
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {savedQRs.map((item) => (
                <div key={item.id} className="glass rounded-3xl p-4 flex flex-col items-center shadow-sm relative group text-center">
                  <button 
                    onClick={() => deleteSavedQR(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="bg-white p-2 rounded-2xl mb-3 shadow-inner">
                    <QRCodeCanvas
                      value={item.text}
                      size={80}
                      level="H"
                      includeMargin={false}
                      fgColor={item.fgColor}
                      bgColor={item.bgColor}
                    />
                  </div>
                  
                  <h4 className="text-xs font-bold text-foreground mb-1 line-clamp-1 w-full">{item.label}</h4>
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-3">{item.type}</span>
                  
                  <div className="flex w-full gap-1.5 mt-auto">
                    <button 
                      onClick={() => handleCopy(item.text)}
                      className="flex-1 py-2 bg-secondary text-foreground text-[10px] font-bold rounded-xl"
                    >
                      Copy
                    </button>
                    <button 
                      onClick={() => setLocation("/generator")} // In a real app we'd pass state to prepopulate
                      className="flex-1 py-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-xl"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Favorite Scans */}
        {favoriteScans.length > 0 && (
          <section>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" /> Starred Scans
            </h3>
            <div className="space-y-3">
              {favoriteScans.map((item) => (
                <div key={item.id} className="glass rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {item.format || 'QR_CODE'}
                      </span>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className="text-amber-500 hover:text-amber-600 transition-colors"
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  
                  <p className="text-sm font-medium text-foreground break-all line-clamp-2 mb-4">
                    {item.text}
                  </p>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCopy(item.text)}
                      className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                    
                    {item.isURL && (
                      <button 
                        onClick={() => handleOpenUrl(item.text)}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-xl text-xs font-bold transition-colors active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
