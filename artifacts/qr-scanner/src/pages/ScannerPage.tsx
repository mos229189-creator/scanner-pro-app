import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Capacitor } from "@capacitor/core";
import { Copy, ExternalLink, Camera, Flashlight, AlertCircle, Share2, Star, Settings, RefreshCw } from "lucide-react";
import { useHistory } from "../hooks/use-history";
import { useAdMob } from "../hooks/use-admob";
import { toast } from "@/hooks/use-toast";

// Permission state machine
type CameraPermState =
  | "checking"    // querying existing permission state
  | "requesting"  // OS dialog in-flight
  | "granted"     // camera ready
  | "denied"      // user said No to the OS dialog (can retry)
  | "blocked";    // permanently denied — must go to Settings

export default function ScannerPage() {
  const { addScan, toggleFavorite, history } = useHistory();
  const { incrementScan } = useAdMob();

  const [permState, setPermState] = useState<CameraPermState>("checking");
  const [lastScanId, setLastScanId] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCamera, setCurrentCamera] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // ─── Scanner lifecycle ───────────────────────────────────────────────────

  const startScanner = useCallback((cameraId: string) => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    const doStart = () => {
      scanner
        .start(
          cameraId,
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText, decodedResult) => {
            const formatName =
              decodedResult.result.format?.formatName ?? "QR_CODE";
            if (navigator.vibrate) navigator.vibrate(50);
            addScan(decodedText, formatName);
            incrementScan();
          },
          () => { /* per-frame decode errors are noise — ignore */ }
        )
        .then(() => {
          try {
            const caps = scanner.getRunningTrackCameraCapabilities();
            // @ts-ignore — torch isn't in the official type but exists at runtime
            if (caps && "torch" in caps) setHasTorch(true);
          } catch (_) {}
        })
        .catch(console.error);
    };

    if (scanner.isScanning) {
      scanner.stop().then(doStart).catch(console.error);
    } else {
      doStart();
    }
  }, [addScan, incrementScan]);

  const initScanner = useCallback((devices: { id: string; label: string }[]) => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader", {
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
    }
    setCameras(devices);
    setCurrentCamera(0);
    setPermState("granted");
    // Prefer rear camera on mobile
    const preferBack = devices.find(d =>
      /back|rear|environment/i.test(d.label)
    );
    startScanner((preferBack ?? devices[0]).id);
  }, [startScanner]);

  // ─── Permission request ──────────────────────────────────────────────────

  const requestPermission = useCallback(async () => {
    setPermState("requesting");

    try {
      // Explicitly call getUserMedia — this triggers the Android OS dialog.
      // html5-qrcode's getCameras() does this internally too but swallows errors;
      // calling it ourselves lets us distinguish denied vs blocked.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      // Permission granted — stop the probe stream immediately then hand off
      // to html5-qrcode which will open its own stream.
      activeStreamRef.current = stream;
      stream.getTracks().forEach(t => t.stop());
      activeStreamRef.current = null;

      // Now enumerate cameras (permission is already granted, so this works)
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        initScanner(devices);
      } else {
        // Permission granted but no camera found (rare edge case)
        setPermState("denied");
      }
    } catch (err: any) {
      const name: string = err?.name ?? "";
      const msg: string = (err?.message ?? "").toLowerCase();

      if (
        name === "NotAllowedError" ||
        name === "PermissionDeniedError"
      ) {
        // "blocked" = user previously denied and OS won't ask again;
        // "denied" = just said No to this prompt (can retry).
        // The Permissions API (if available) can tell us which.
        if (navigator.permissions) {
          try {
            const status = await navigator.permissions.query({
              name: "camera" as PermissionName,
            });
            setPermState(status.state === "denied" ? "blocked" : "denied");
          } catch {
            setPermState("denied");
          }
        } else {
          setPermState("denied");
        }
      } else {
        // Some other error (NotFoundError, OverconstrainedError, etc.)
        setPermState("denied");
      }
    }
  }, [initScanner]);

  // ─── On mount: check existing permission then auto-request ───────────────

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Fast-path: if the Permissions API says it's already granted, skip the dialog
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          if (cancelled) return;

          if (status.state === "granted") {
            // Camera already allowed — go straight to scanning
            const devices = await Html5Qrcode.getCameras();
            if (!cancelled && devices?.length) {
              initScanner(devices);
              return;
            }
          } else if (status.state === "denied") {
            if (!cancelled) setPermState("blocked");
            return;
          }
          // state === "prompt" — fall through to requestPermission()
        } catch {
          // Permissions API not supported or camera name not recognized — fall through
        }
      }

      if (!cancelled) requestPermission();
    };

    bootstrap();

    return () => {
      cancelled = true;
      // Stop any lingering probe stream
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(t => t.stop());
        activeStreamRef.current = null;
      }
      // Stop the scanner
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── History tracking ────────────────────────────────────────────────────

  useEffect(() => {
    if (history.length > 0 && !lastScanId) {
      if (Date.now() - history[0].timestamp < 3000) {
        setLastScanId(history[0].id);
      }
    }
  }, [history, lastScanId]);

  const lastScan = history.find(h => h.id === lastScanId);

  // ─── Camera controls ──────────────────────────────────────────────────────

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const next = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next } as any],
      });
      setTorchOn(next);
    } catch (e) {
      console.error("Torch toggle failed", e);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const next = (currentCamera + 1) % cameras.length;
    setCurrentCamera(next);
    startScanner(cameras[next].id);
  };

  // ─── Open device app-settings (best-effort) ───────────────────────────────

  const openSettings = () => {
    if (isNative) {
      // On Capacitor Android the "_system" target opens the URL in the OS handler.
      // "app-settings:" works on iOS; on Android we use the package deep-link.
      try {
        // Android: open this app's Settings page via intent URI
        window.open(
          `android.settings.APPLICATION_DETAILS_SETTINGS`,
          "_system"
        );
      } catch {
        // Fallback: can't open settings without a native plugin, show toast
        toast({
          title: "Open Settings manually",
          description:
            "Settings › Apps › Scanner Pro › Permissions › Camera",
        });
      }
    } else {
      // Browser: can't navigate to settings, just advise the user
      toast({
        title: "Enable camera in your browser",
        description:
          "Click the camera/lock icon in the address bar and allow camera access, then refresh.",
      });
    }
  };

  // ─── Result-card handlers ─────────────────────────────────────────────────

  const handleCopy = () => {
    if (lastScan) {
      navigator.clipboard.writeText(lastScan.text);
      toast({ title: "Copied to clipboard!" });
    }
  };

  const handleOpenUrl = () => {
    if (lastScan?.isURL) window.open(lastScan.text, "_blank");
  };

  const handleShare = async () => {
    if (!lastScan) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Scanned Content",
          text: lastScan.text,
          url: lastScan.isURL ? lastScan.text : undefined,
        });
      } catch {}
    } else {
      toast({ title: "Sharing not supported on this device" });
    }
  };

  const handleFavorite = () => {
    if (lastScan) {
      toggleFavorite(lastScan.id);
      toast({
        title: lastScan.isFavorite ? "Removed from saved" : "Saved to favorites",
      });
    }
  };

  // ─── UI helpers ───────────────────────────────────────────────────────────

  const PermissionMessage = ({
    icon,
    title,
    body,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    body: string;
    children?: React.ReactNode;
  }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl shadow-lg w-full max-w-sm border border-white/5 gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-foreground font-bold text-lg mb-1">{title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
      </div>
      {children}
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="flex-1 relative flex flex-col items-center justify-center p-4">

        {/* ── Checking / Requesting ── */}
        {(permState === "checking" || permState === "requesting") && (
          <PermissionMessage
            icon={<Camera className="w-8 h-8 text-primary animate-pulse" />}
            title={permState === "checking" ? "Initialising camera…" : "Requesting camera access…"}
            body="Please allow camera access when your device asks."
          />
        )}

        {/* ── Denied (can retry) ── */}
        {permState === "denied" && (
          <PermissionMessage
            icon={<AlertCircle className="w-8 h-8 text-amber-500" />}
            title="Camera permission needed"
            body="Scanner Pro needs your camera to scan QR codes and barcodes. Tap the button below to try again."
          >
            <button
              onClick={requestPermission}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Grant Camera Access
            </button>
          </PermissionMessage>
        )}

        {/* ── Blocked (permanently denied — must go to Settings) ── */}
        {permState === "blocked" && (
          <PermissionMessage
            icon={<Settings className="w-8 h-8 text-destructive" />}
            title="Camera access blocked"
            body={
              isNative
                ? "Camera permission was permanently denied. Open Settings › Apps › Scanner Pro › Permissions and enable Camera, then return to the app."
                : "Camera access was blocked. Click the camera icon in your browser's address bar, allow access, then refresh the page."
            }
          >
            <button
              onClick={openSettings}
              className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-2xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Settings className="w-4 h-4" />
              {isNative ? "Open App Settings" : "How to fix this"}
            </button>
            <button
              onClick={requestPermission}
              className="text-muted-foreground text-sm underline underline-offset-4"
            >
              Try again anyway
            </button>
          </PermissionMessage>
        )}

        {/* ── Camera viewfinder ── */}
        {permState === "granted" && (
          <div className="relative w-full h-full max-w-[400px] max-h-[600px] rounded-[2.5rem] overflow-hidden bg-black shadow-2xl ring-2 ring-white/10 isolate">
            <div
              id="reader"
              className="w-full h-full object-cover !border-none [&_video]:object-cover"
            />

            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center bg-black/40">
              <div className="w-[260px] h-[260px] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] rounded-3xl">
                <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl corner-bracket" />
                <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl corner-bracket" />
                <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl corner-bracket" />
                <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl corner-bracket" />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_12px_rgba(20,184,166,1)] scan-line rounded-full" />
              </div>
            </div>

            {/* Camera controls */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-8 z-20">
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 ${
                    torchOn
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                      : "bg-black/50 text-white border border-white/20"
                  }`}
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
          </div>
        )}

        {/* Result card */}
        {lastScan && (
          <div className="absolute bottom-6 w-[calc(100%-2rem)] max-w-sm glass rounded-3xl shadow-2xl p-5 animate-in slide-in-from-bottom-8 fade-in z-30">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                {lastScan.format}
              </span>
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
