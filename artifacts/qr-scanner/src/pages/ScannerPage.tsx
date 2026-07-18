// Camera access: uses html5-qrcode for web preview. In native Capacitor build, replace with @capacitor-community/barcode-scanner

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Copy, ExternalLink, Camera, Flashlight, AlertCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useHistory } from "../hooks/use-history";
import { toast } from "@/hooks/use-toast";

export default function ScannerPage() {
  const { t } = useLanguage();
  const { addScan } = useHistory();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScan, setLastScan] = useState<{text: string, format: string, isUrl: boolean} | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCamera, setCurrentCamera] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!mounted) return;
        if (devices && devices.length) {
          setCameras(devices);
          setHasPermission(true);
          startScanner(devices[0].id);
        } else {
          setHasPermission(false);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setHasPermission(false);
      });

    return () => {
      mounted = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = (cameraId: string) => {
    if (!scannerRef.current) return;
    
    if (scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        start(cameraId);
      }).catch(console.error);
    } else {
      start(cameraId);
    }
  };

  const start = (cameraId: string) => {
    scannerRef.current?.start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      (decodedText, decodedResult) => {
        const formatName = decodedResult.result.format?.formatName || "QR_CODE";
        const isUrl = /^(https?:\/\/)/i.test(decodedText);
        
        setLastScan({ text: decodedText, format: formatName, isUrl });
        addScan(decodedText, formatName);
        
        // Brief haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      },
      (error) => {
        // Ignored, continuous scanning throws errors constantly when no QR is found
      }
    ).then(() => {
      // Check for torch capability
      if (scannerRef.current) {
        const track = scannerRef.current.getRunningTrackCameraCapabilities();
        // @ts-ignore - torch isn't properly typed in standard dom lib
        if (track && 'torch' in track) {
          setHasTorch(true);
        }
      }
    }).catch((err) => {
      console.error(err);
    });
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    
    try {
      const newState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState } as any]
      });
      setTorchOn(newState);
    } catch (e) {
      console.error("Failed to toggle torch", e);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const nextIdx = (currentCamera + 1) % cameras.length;
    setCurrentCamera(nextIdx);
    startScanner(cameras[nextIdx].id);
  };

  const handleCopy = () => {
    if (lastScan) {
      navigator.clipboard.writeText(lastScan.text);
      toast({ title: t("Copied!") });
    }
  };

  const handleOpenUrl = () => {
    if (lastScan && lastScan.isUrl) {
      window.open(lastScan.text, "_blank");
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {hasPermission === false && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-2xl shadow-lg w-full max-w-sm">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-foreground font-medium mb-2">{t("Camera permission denied")}</p>
            <p className="text-muted-foreground text-sm">Please enable camera access to use the scanner.</p>
          </div>
        )}

        {hasPermission !== false && (
          <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 isolate">
            <div id="reader" className="w-full h-full object-cover !border-none [&_video]:object-cover" />
            
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="w-[200px] h-[200px] relative">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Animated scanline */}
                <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/80 shadow-[0_0_8px_rgba(20,184,166,0.8)] scan-line rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Camera controls */}
        {hasPermission === true && (
          <div className="flex items-center gap-6 mt-8">
            {hasTorch && (
              <button 
                onClick={toggleTorch}
                className={`p-4 rounded-full transition-colors ${torchOn ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              >
                <Flashlight className="w-6 h-6" />
              </button>
            )}
            
            {cameras.length > 1 && (
              <button 
                onClick={switchCamera}
                className="p-4 rounded-full bg-secondary text-secondary-foreground transition-colors active:bg-secondary/80"
              >
                <Camera className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Result card */}
        {lastScan && (
          <div className="absolute bottom-6 w-[calc(100%-2rem)] max-w-sm bg-card rounded-2xl shadow-xl border border-border p-4 animate-in slide-in-from-bottom-4 fade-in z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{lastScan.format}</span>
              <span className="text-xs text-muted-foreground">{t("Scan Result")}</span>
            </div>
            
            <p className="text-sm font-medium break-words mb-4 text-card-foreground line-clamp-3">
              {lastScan.text}
            </p>
            
            <div className="flex gap-2">
              <button 
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-sm font-medium transition-colors active:bg-secondary/80"
              >
                <Copy className="w-4 h-4" />
                {t("Copy")}
              </button>
              
              {lastScan.isUrl && (
                <button 
                  onClick={handleOpenUrl}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-medium transition-colors active:bg-primary/90"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("Open URL")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
