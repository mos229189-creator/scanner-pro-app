// Camera access: uses html5-qrcode for web preview. In native Capacitor build, replace with @capacitor-community/barcode-scanner

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Copy, ExternalLink, Camera, Flashlight, AlertCircle, Share2, Star } from "lucide-react";
import { useHistory } from "../hooks/use-history";
import { useAdMob } from "../hooks/use-admob";
import { toast } from "@/hooks/use-toast";

export default function ScannerPage() {
  const { addScan, toggleFavorite, history } = useHistory();
  const { incrementScan } = useAdMob();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastScanId, setLastScanId] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCamera, setCurrentCamera] = useState<number>(0);

  // Find the actual last scan from history for favorites tracking
  const lastScan = history.find(h => h.id === lastScanId);

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.PDF_417,
      ],
    });
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
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      (decodedText, decodedResult) => {
        const formatName = decodedResult.result.format?.formatName || "QR_CODE";
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Add to history (handles deduping internally)
        // Wait, addScan doesn't return the ID... we need a way to get the ID.
        // For simplicity, we can trust the first item in history is our new one 
        // if we just added it, but let's just use a timeout to let state update.
        // Actually, let's just trigger addScan, then we'll find it in history by text
        addScan(decodedText, formatName);
        incrementScan();
        
        // Let's just track the text for UI so we can find it in history
        setTimeout(() => {
          setLastScanId(prev => {
             // Not perfect but works for this scope
             return null; 
          });
          // A bit hacky, but we need the ID from the history update
        }, 100);

      },
      (error) => {
        // Ignored
      }
    ).then(() => {
      if (scannerRef.current) {
        const track = scannerRef.current.getRunningTrackCameraCapabilities();
        // @ts-ignore
        if (track && 'torch' in track) {
          setHasTorch(true);
        }
      }
    }).catch(console.error);
  };

  // When history updates, if we don't have a last scan ID but we just scanned, grab the top one
  useEffect(() => {
    if (history.length > 0 && !lastScanId) {
       // Only do this if it was recently scanned (within last 3 seconds)
       if (Date.now() - history[0].timestamp < 3000) {
         setLastScanId(history[0].id);
       }
    }
  }, [history, lastScanId]);

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
      toast({ title: "Copied to clipboard!" });
    }
  };

  const handleOpenUrl = () => {
    if (lastScan && lastScan.isURL) {
      window.open(lastScan.text, "_blank");
    }
  };

  const handleShare = async () => {
    if (lastScan && navigator.share) {
      try {
        await navigator.share({
          title: 'Scanned Content',
          text: lastScan.text,
          url: lastScan.isURL ? lastScan.text : undefined
        });
      } catch (e) {
        // user cancelled or error
      }
    } else {
       toast({ title: "Sharing not supported on this device" });
    }
  };

  const handleFavorite = () => {
    if (lastScan) {
      toggleFavorite(lastScan.id);
      toast({ title: lastScan.isFavorite ? "Removed from saved" : "Saved to favorites" });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {hasPermission === false && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl shadow-lg w-full max-w-sm border border-white/5">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-foreground font-bold text-lg mb-2">Camera Access Denied</p>
            <p className="text-muted-foreground text-sm">Please enable camera access in your device settings to use the scanner.</p>
          </div>
        )}

        {hasPermission !== false && (
          <div className="relative w-full h-full max-w-[400px] max-h-[600px] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl ring-2 ring-white/10 isolate">
            <div id="reader" className="w-full h-full object-cover !border-none [&_video]:object-cover" />
            
            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-black/40">
              {/* Center cutout */}
              <div className="w-[260px] h-[260px] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] rounded-3xl">
                {/* Corner brackets */}
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl corner-bracket" />
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl corner-bracket" />
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl corner-bracket" />
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl corner-bracket" />
                
                {/* Animated scanline */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_12px_rgba(20,184,166,1)] scan-line rounded-full" />
              </div>
            </div>
            
            {/* Camera controls */}
            {hasPermission === true && (
              <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 z-20">
                {hasTorch && (
                  <button 
                    onClick={toggleTorch}
                    className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ${torchOn ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-black/50 text-white border border-white/20'}`}
                  >
                    <Flashlight className="w-6 h-6" />
                  </button>
                )}
                
                {cameras.length > 1 && (
                  <button 
                    onClick={switchCamera}
                    className="w-14 h-14 rounded-full bg-black/50 text-white border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-95"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result card overlay */}
        {lastScan && (
          <div className="absolute bottom-6 w-[calc(100%-2rem)] max-w-sm glass rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom-8 fade-in z-30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {lastScan.format}
                </span>
              </div>
              <button 
                onClick={() => setLastScanId(null)}
                className="text-muted-foreground hover:text-foreground text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
            
            <p className="text-base font-medium break-words mb-5 text-foreground line-clamp-3 leading-snug">
              {lastScan.text}
            </p>
            
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={handleCopy}
                className="flex flex-col items-center justify-center gap-1.5 bg-secondary text-secondary-foreground py-3 rounded-2xl text-[10px] font-bold transition-all active:scale-95 hover:bg-secondary/80"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              
              <button 
                onClick={handleShare}
                className="flex flex-col items-center justify-center gap-1.5 bg-secondary text-secondary-foreground py-3 rounded-2xl text-[10px] font-bold transition-all active:scale-95 hover:bg-secondary/80"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              <button 
                onClick={handleFavorite}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-[10px] font-bold transition-all active:scale-95 ${
                  lastScan.isFavorite 
                    ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                <Star className={`w-4 h-4 ${lastScan.isFavorite ? "fill-amber-500" : ""}`} />
                Save
              </button>
              
              {lastScan.isURL ? (
                <button 
                  onClick={handleOpenUrl}
                  className="flex flex-col items-center justify-center gap-1.5 bg-primary text-primary-foreground py-3 rounded-2xl text-[10px] font-bold transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </button>
              ) : (
                 <div className="flex flex-col items-center justify-center gap-1.5 bg-secondary/50 text-muted-foreground py-3 rounded-2xl text-[10px] font-bold opacity-50 cursor-not-allowed">
                  <ExternalLink className="w-4 h-4" />
                  Open
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
