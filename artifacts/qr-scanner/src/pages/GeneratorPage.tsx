import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Link as LinkIcon, Type } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function GeneratorPage() {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = url;
    link.click();
  };

  const isUrl = /^(https?:\/\/)/i.test(text);

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden p-6 relative">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        
        <div className="w-full mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground">
              {isUrl ? <LinkIcon className="w-5 h-5" /> : <Type className="w-5 h-5" />}
            </div>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("Enter text or URL...")}
              className="w-full h-14 pl-12 pr-4 bg-card border-2 border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium text-base shadow-sm"
              dir="auto"
            />
          </div>
        </div>

        <div className="w-full aspect-square max-w-[280px] bg-white rounded-3xl shadow-xl flex items-center justify-center p-6 border border-border/50 relative isolate transition-all duration-500 hover:shadow-2xl">
          {text ? (
            <div ref={qrRef} className="animate-in fade-in zoom-in-95 duration-300">
              <QRCodeCanvas
                value={text}
                size={220}
                level="H"
                includeMargin={false}
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          ) : (
            <div className="w-full h-full border-2 border-dashed border-muted rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
              <Type className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm font-medium">{t("Generate QR Code")}</span>
            </div>
          )}
        </div>

        <div className="mt-10 w-full">
          <button
            onClick={handleDownload}
            disabled={!text}
            className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-primary/20"
          >
            <Download className="w-5 h-5" />
            {t("Download")}
          </button>
        </div>

      </div>
    </div>
  );
}
