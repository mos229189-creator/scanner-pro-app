import { useState } from "react";
import { 
  Trash2, 
  Copy, 
  ExternalLink, 
  QrCode, 
  Barcode, 
  History as HistoryIcon,
  Search,
  Filter,
  Star,
  Globe,
  Type,
  Wifi,
  User,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Share2
} from "lucide-react";
import { useHistory, ScanResult } from "../hooks/use-history";
import { toast } from "@/hooks/use-toast";

const getFormatIcon = (format: string) => {
  if (format === 'QR_CODE') return QrCode;
  return Barcode;
};

const getTypeIcon = (item: ScanResult) => {
  // Infer type from text if not strictly set
  const t = item.text.toLowerCase();
  if (t.startsWith('http')) return Globe;
  if (t.startsWith('wifi:')) return Wifi;
  if (t.startsWith('begin:vcard')) return User;
  if (t.startsWith('tel:')) return Phone;
  if (t.startsWith('mailto:')) return Mail;
  if (t.startsWith('sms:')) return MessageSquare;
  if (t.startsWith('geo:')) return MapPin;
  return Type;
};

export default function HistoryPage() {
  const { history, clearHistory, deleteItem, toggleFavorite } = useHistory();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az">("newest");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank");
  };

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric'
    }).format(new Date(timestamp));
  };

  // Filter and sort
  const filtered = history.filter(item => {
    if (search && !item.text.toLowerCase().includes(search.toLowerCase())) return false;
    
    if (filterType !== "all") {
      const type = getTypeIcon(item);
      if (filterType === "url" && type !== Globe) return false;
      if (filterType === "text" && type !== Type) return false;
      if (filterType === "wifi" && type !== Wifi) return false;
      if (filterType === "contact" && type !== User) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") return b.timestamp - a.timestamp;
    if (sortBy === "oldest") return a.timestamp - b.timestamp;
    return a.text.localeCompare(b.text);
  });

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      
      {/* Header & Controls */}
      <div className="px-5 pt-5 pb-3 border-b border-white/5 bg-card/80 backdrop-blur-xl z-20 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-foreground tracking-tight">History</h2>
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {history.length}
            </span>
          </div>
          {history.length > 0 && (
            <button 
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scans..."
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>All</button>
          <button onClick={() => setFilterType("url")} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === "url" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>Links</button>
          <button onClick={() => setFilterType("text")} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === "text" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>Text</button>
          <button onClick={() => setFilterType("wifi")} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === "wifi" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>Wi-Fi</button>
          
          <div className="w-px h-6 bg-border mx-1 my-auto shrink-0" />
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-foreground outline-none appearance-none cursor-pointer pr-4"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-3">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <HistoryIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-bold text-foreground">No history yet</p>
            <p className="text-sm text-muted-foreground">Scanned codes will appear here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center opacity-50">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-bold text-foreground">No matches found</p>
          </div>
        ) : (
          filtered.map((item, i) => {
            const TypeIcon = getTypeIcon(item);
            const FormatIcon = getFormatIcon(item.format || "QR_CODE");
            
            return (
              <div 
                key={item.id} 
                className="glass rounded-2xl p-4 shadow-sm relative overflow-hidden group"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <FormatIcon className="w-3 h-3" />
                          {item.format || 'QR_CODE'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    </button>
                  </div>
                </div>
                
                <div className="bg-background rounded-xl p-3 mb-3 border border-border">
                  <p className="text-sm font-medium text-foreground break-all line-clamp-2" dir="auto">
                    {item.text}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(item.text)}
                    className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-95"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>
                  
                  {item.isURL && (
                    <button 
                      onClick={() => handleOpenUrl(item.text)}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-bold transition-colors active:scale-95 shadow-md shadow-primary/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </button>
                  )}
                  
                  <button 
                    onClick={() => deleteItem(item.id)}
                    className="w-10 flex items-center justify-center bg-destructive/10 text-destructive py-2.5 rounded-xl transition-colors hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-[300px] text-center animate-in zoom-in-95 duration-200">
            <Trash2 className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-black text-foreground mb-2">Clear History?</h3>
            <p className="text-sm text-muted-foreground mb-6">This action cannot be undone. All scanned items will be deleted.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-12 bg-secondary text-foreground font-bold rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={() => { clearHistory(); setShowClearConfirm(false); }}
                className="flex-1 h-12 bg-destructive text-white font-bold rounded-xl shadow-lg shadow-destructive/20"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
