import { useState, useRef, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  Download, 
  Link as LinkIcon, 
  Type, 
  Wifi, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Share2,
  ChevronDown,
  Palette,
  Settings2,
  Star,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAdMob } from "../hooks/use-admob";
import { useFavorites } from "../hooks/use-favorites";

type QRType = "url" | "text" | "wifi" | "contact" | "phone" | "email" | "sms" | "location" | "social";

const TYPES: { id: QRType; icon: React.ElementType; label: string }[] = [
  { id: "url", icon: LinkIcon, label: "URL" },
  { id: "text", icon: Type, label: "Text" },
  { id: "wifi", icon: Wifi, label: "Wi-Fi" },
  { id: "contact", icon: User, label: "Contact" },
  { id: "phone", icon: Phone, label: "Phone" },
  { id: "email", icon: Mail, label: "Email" },
  { id: "sms", icon: MessageSquare, label: "SMS" },
  { id: "location", icon: MapPin, label: "Location" },
  { id: "social", icon: Share2, label: "Social" },
];

const PRESETS = [
  { id: "classic", name: "Classic", fg: "#000000", bg: "#ffffff" },
  { id: "dark", name: "Dark", fg: "#ffffff", bg: "#1a1a2e" },
  { id: "ocean", name: "Ocean", fg: "#10b981", bg: "#0f172a" },
  { id: "sunset", name: "Sunset", fg: "#f97316", bg: "#fffbeb" },
];

export default function GeneratorPage() {
  const { incrementGenerate, requestRewardedAd } = useAdMob();
  const { saveQR } = useFavorites();
  
  const [activeType, setActiveType] = useState<QRType>("url");
  const [showCustomization, setShowCustomization] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Customization State
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(24);

  // Input States
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiSec, setWifiSec] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);
  
  const [contactFirst, setContactFirst] = useState("");
  const [contactLast, setContactLast] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  const [contactWeb, setContactWeb] = useState("");

  const [phone, setPhone] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubj, setEmailSubj] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");
  
  const [locLat, setLocLat] = useState("");
  const [locLng, setLocLng] = useState("");
  
  const [socialPlat, setSocialPlat] = useState("https://twitter.com/");
  const [socialUser, setSocialUser] = useState("");

  // Derived content
  const getQRContent = () => {
    switch (activeType) {
      case "url": return url;
      case "text": return text;
      case "wifi": return `WIFI:T:${wifiSec};S:${wifiSsid};P:${wifiPass};H:${wifiHidden ? 'true' : 'false'};;`;
      case "contact": return `BEGIN:VCARD\nVERSION:3.0\nN:${contactLast};${contactFirst};;;\nFN:${contactFirst} ${contactLast}\nORG:${contactCompany}\nTEL;TYPE=CELL:${contactPhone}\nEMAIL;TYPE=WORK:${contactEmail}\nURL:${contactWeb}\nEND:VCARD`;
      case "phone": return `tel:${phone}`;
      case "email": return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailBody)}`;
      case "sms": return `sms:${smsPhone}?body=${encodeURIComponent(smsMsg)}`;
      case "location": return `geo:${locLat},${locLng}`;
      case "social": return `${socialPlat}${socialUser}`;
      default: return "";
    }
  };

  const getQRTitle = () => {
    switch (activeType) {
      case "url": return url ? url : "URL";
      case "text": return text ? text.slice(0, 20) + "..." : "Text";
      case "wifi": return wifiSsid ? `Wi-Fi: ${wifiSsid}` : "Wi-Fi";
      case "contact": return contactFirst ? `${contactFirst} ${contactLast}` : "Contact";
      case "phone": return phone ? `Call ${phone}` : "Phone";
      case "email": return emailTo ? `Email ${emailTo}` : "Email";
      case "sms": return smsPhone ? `Text ${smsPhone}` : "SMS";
      case "location": return locLat ? `Lat: ${locLat}, Lng: ${locLng}` : "Location";
      case "social": return socialUser ? `@${socialUser}` : "Social Profile";
      default: return "QR Code";
    }
  };

  const content = getQRContent();
  const isValid = content.length > 0 && content !== "WIFI:T:WPA;S:;P:;H:false;;" && content !== "BEGIN:VCARD\nVERSION:3.0\nN:;;;;\nFN: \nORG:\nTEL;TYPE=CELL:\nEMAIL;TYPE=WORK:\nURL:\nEND:VCARD" && content !== "tel:" && content !== "mailto:?subject=&body=" && content !== "sms:?body=" && content !== "geo:," && content !== "https://twitter.com/";

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPNG = () => {
    if (!qrRef.current || !isValid) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const imgUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR_${getQRTitle().replace(/[^a-z0-9]/gi, '_')}.png`;
    link.href = imgUrl;
    link.click();
    
    incrementGenerate();
    toast({ title: "Downloaded as PNG" });
  };

  const downloadPDF = () => {
    if (!qrRef.current || !isValid) return;
    
    // PDF download requires watching a rewarded ad
    requestRewardedAd(async () => {
      const canvas = qrRef.current?.querySelector("canvas");
      if (!canvas) return;
      
      try {
        const tempCanvas = await html2canvas(qrRef.current as HTMLElement, {
          backgroundColor: bgColor,
          scale: 2
        });
        
        const imgData = tempCanvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4"
        });
        
        // Add title
        pdf.setFontSize(20);
        pdf.text(getQRTitle(), 105, 30, { align: "center" });
        
        // Add QR (centered)
        const qrSize = 100;
        pdf.addImage(imgData, 'PNG', 55, 50, qrSize, qrSize);
        
        // Add footer
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("Generated with ScannerPro", 105, 280, { align: "center" });
        
        pdf.save(`QR_${getQRTitle().replace(/[^a-z0-9]/gi, '_')}.pdf`);
        incrementGenerate();
        toast({ title: "Downloaded as High-Quality PDF" });
      } catch (err) {
        toast({ title: "Failed to generate PDF", variant: "destructive" });
      }
    });
  };

  const handleSaveToFavorites = () => {
    if (!isValid) return;
    saveQR({
      label: getQRTitle(),
      text: content,
      type: activeType,
      fgColor,
      bgColor
    });
    toast({ title: "Saved to your favorites!" });
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Section A: Type Selector */}
        <div className="w-full bg-card/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20 shadow-sm">
          <div className="flex overflow-x-auto hide-scrollbar px-4 py-4 gap-3 items-center">
            {TYPES.map((type) => {
              const Icon = type.icon;
              const isActive = activeType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveType(type.id)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl min-w-[72px] transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105" 
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold tracking-wide">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 flex flex-col gap-6">
          
          {/* Section B: Input Form */}
          <div className="glass rounded-3xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
               <FileText className="w-4 h-4 text-primary" /> Content
            </h3>
            
            <div className="space-y-4">
              {activeType === "url" && (
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all" />
              )}

              {activeType === "text" && (
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Enter your text here..." rows={4} className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all resize-none" />
              )}

              {activeType === "wifi" && (
                <div className="space-y-3">
                  <input type="text" value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="Network Name (SSID)" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
                  <input type="password" value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="Password" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
                  <div className="flex gap-3">
                    <select value={wifiSec} onChange={e => setWifiSec(e.target.value)} className="flex-1 h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm appearance-none">
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None</option>
                    </select>
                    <label className="flex-1 flex items-center gap-2 px-4 border border-border rounded-xl bg-background text-sm text-muted-foreground">
                      <input type="checkbox" checked={wifiHidden} onChange={e => setWifiHidden(e.target.checked)} className="rounded text-primary accent-primary" />
                      Hidden
                    </label>
                  </div>
                </div>
              )}

              {activeType === "contact" && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input type="text" value={contactFirst} onChange={e => setContactFirst(e.target.value)} placeholder="First Name" className="flex-1 h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                    <input type="text" value={contactLast} onChange={e => setContactLast(e.target.value)} placeholder="Last Name" className="flex-1 h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                  <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone Number" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <input type="text" value={contactCompany} onChange={e => setContactCompany(e.target.value)} placeholder="Company (Optional)" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <input type="url" value={contactWeb} onChange={e => setContactWeb(e.target.value)} placeholder="Website (Optional)" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
              )}

              {activeType === "phone" && (
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm" />
              )}

              {activeType === "email" && (
                <div className="space-y-3">
                  <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="Recipient Email" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <input type="text" value={emailSubj} onChange={e => setEmailSubj(e.target.value)} placeholder="Subject" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Message..." rows={3} className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" />
                </div>
              )}

              {activeType === "sms" && (
                <div className="space-y-3">
                  <input type="tel" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="Phone Number" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  <textarea value={smsMsg} onChange={e => setSmsMsg(e.target.value)} placeholder="Message..." rows={3} className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none" />
                </div>
              )}

              {activeType === "location" && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <input type="number" step="any" value={locLat} onChange={e => setLocLat(e.target.value)} placeholder="Latitude" className="flex-1 h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                    <input type="number" step="any" value={locLng} onChange={e => setLocLng(e.target.value)} placeholder="Longitude" className="flex-1 h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                  </div>
                  <p className="text-xs text-muted-foreground px-1">Use decimal degrees (e.g. 40.7128, -74.0060)</p>
                </div>
              )}

              {activeType === "social" && (
                <div className="space-y-3">
                  <select value={socialPlat} onChange={e => setSocialPlat(e.target.value)} className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm appearance-none">
                    <option value="https://twitter.com/">Twitter / X</option>
                    <option value="https://instagram.com/">Instagram</option>
                    <option value="https://linkedin.com/in/">LinkedIn</option>
                    <option value="https://youtube.com/@">YouTube</option>
                    <option value="https://github.com/">GitHub</option>
                    <option value="https://tiktok.com/@">TikTok</option>
                    <option value="https://facebook.com/">Facebook</option>
                  </select>
                  <input type="text" value={socialUser} onChange={e => setSocialUser(e.target.value)} placeholder="Username" className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm" />
                </div>
              )}
            </div>
          </div>

          {/* Section C: Preview & Customize */}
          <div className="glass rounded-3xl p-5 shadow-sm mb-8">
            <button 
              onClick={() => setShowCustomization(!showCustomization)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Appearance
              </h3>
              <div className={`p-2 rounded-full bg-secondary text-muted-foreground transition-transform duration-300 ${showCustomization ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Customization Panel */}
            <div className={`overflow-hidden transition-all duration-300 ${showCustomization ? 'max-h-[800px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-5 pt-2 border-t border-border">
                
                {/* Presets */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Quick Themes</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESETS.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => { setFgColor(p.fg); setBgColor(p.bg); }}
                        className="h-10 rounded-lg text-[10px] font-bold border border-border transition-all active:scale-95"
                        style={{ backgroundColor: p.bg, color: p.fg }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Foreground</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                      <input type="text" value={fgColor} onChange={e => setFgColor(e.target.value)} className="flex-1 h-10 px-3 bg-background border border-border rounded-xl text-xs uppercase font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Background</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0 bg-transparent" />
                      <input type="text" value={bgColor} onChange={e => setBgColor(e.target.value)} className="flex-1 h-10 px-3 bg-background border border-border rounded-xl text-xs uppercase font-mono" />
                    </div>
                  </div>
                </div>

                {/* Logo */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Center Logo</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 h-10 border border-dashed border-primary/50 bg-primary/5 text-primary rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-primary/10 transition-colors">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      Upload Image
                    </label>
                    {logoDataUrl && (
                      <button onClick={() => setLogoDataUrl(null)} className="h-10 px-4 bg-destructive/10 text-destructive rounded-xl text-xs font-bold">
                        Clear
                      </button>
                    )}
                  </div>
                  {logoDataUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Size</span>
                      <input type="range" min="10" max="35" value={logoSize} onChange={e => setLogoSize(parseInt(e.target.value))} className="flex-1 accent-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="mt-6 flex flex-col items-center">
              <div 
                className="p-4 rounded-3xl shadow-xl transition-all relative group"
                style={{ backgroundColor: bgColor }}
              >
                <div 
                  ref={qrRef} 
                  className={`transition-all duration-300 ${isValid ? 'opacity-100 scale-100' : 'opacity-30 scale-95 blur-sm'}`}
                >
                  <QRCodeCanvas
                    value={isValid ? content : "preview"}
                    size={220}
                    level={errorLevel}
                    includeMargin={false}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    imageSettings={logoDataUrl ? {
                      src: logoDataUrl,
                      height: 220 * (logoSize / 100),
                      width: 220 * (logoSize / 100),
                      excavate: true,
                    } : undefined}
                  />
                </div>
                {!isValid && (
                  <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                    <QrCode className="w-8 h-8 text-muted-foreground opacity-50" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Enter Details</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="w-full mt-8 grid grid-cols-2 gap-3">
                <button
                  onClick={downloadPNG}
                  disabled={!isValid}
                  className="h-14 bg-secondary text-secondary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  <Download className="w-5 h-5" />
                  Save PNG
                </button>
                <button
                  onClick={downloadPDF}
                  disabled={!isValid}
                  className="h-14 bg-primary text-primary-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-primary/20 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-yellow-400 text-amber-900 text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg">PRO</div>
                  <Download className="w-5 h-5" />
                  PDF (Ad)
                </button>
              </div>
              
              <button
                onClick={handleSaveToFavorites}
                disabled={!isValid}
                className="w-full mt-3 h-12 border border-border text-foreground font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:bg-secondary/50"
              >
                <Star className="w-4 h-4" />
                Add to Favorites
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// Temporary QrCode icon since it's used inside the file but imported from lucide
import { QrCode } from "lucide-react";
