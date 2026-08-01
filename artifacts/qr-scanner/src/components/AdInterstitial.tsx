import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface AdInterstitialProps {
  onClose: (completed: boolean) => void;
}

export function AdInterstitial({ onClose }: AdInterstitialProps) {
  const [timeLeft, setTimeLeft] = useState(3);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
    setCanDismiss(true);
    return undefined;
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        {!canDismiss && (
          <div className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-medium">
            Skip in {timeLeft}s
          </div>
        )}

        <button
          onClick={() => onClose(true)}
          disabled={!canDismiss}
          className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all ${
            canDismiss ? "text-white hover:bg-white/20 active:scale-95" : "text-white/30 cursor-not-allowed"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-sm p-6 mx-4 bg-card rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-muted rounded-2xl mb-4 flex items-center justify-center">
          <span className="text-xs font-bold uppercase text-muted-foreground">AD</span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-2">Advertisement</h3>

        <p className="text-sm text-muted-foreground mb-8">
          This space helps keep the app free. Thank you for your support.
        </p>

        <div className="w-full aspect-video bg-muted/50 rounded-2xl border border-border flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    </div>
  );
}
