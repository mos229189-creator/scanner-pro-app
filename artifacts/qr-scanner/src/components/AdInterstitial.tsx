import { useEffect, useState } from "react";
import { X, PlaySquare, CheckCircle } from "lucide-react";

interface AdInterstitialProps {
  type: "interstitial" | "rewarded";
  onClose: (completed: boolean) => void;
}

export function AdInterstitial({ type, onClose }: AdInterstitialProps) {
  const [timeLeft, setTimeLeft] = useState(type === "interstitial" ? 3 : 5);
  const [canDismiss, setCanDismiss] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      if (type === "interstitial") {
        setCanDismiss(true);
      } else if (type === "rewarded") {
        setCanDismiss(true);
        setCompleted(true);
      }
      return undefined;
    }
  }, [timeLeft, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        {type === "rewarded" && !completed && (
          <div className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-medium">
            Reward in {timeLeft}s
          </div>
        )}
        
        {type === "interstitial" && !canDismiss && (
          <div className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-medium">
            Skip in {timeLeft}s
          </div>
        )}

        <button
          onClick={() => onClose(completed)}
          disabled={!canDismiss}
          className={`w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-all ${
            canDismiss ? "text-white hover:bg-white/20 active:scale-95" : "text-white/30 cursor-not-allowed"
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-sm p-6 mx-4 bg-card rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center">
        {type === "rewarded" ? (
          <PlaySquare className="w-16 h-16 text-primary mb-4" />
        ) : (
          <div className="w-16 h-16 bg-muted rounded-2xl mb-4 flex items-center justify-center">
            <span className="text-xs font-bold uppercase text-muted-foreground">AD</span>
          </div>
        )}
        
        <h3 className="text-xl font-bold text-foreground mb-2">
          {type === "rewarded" ? "Watch to Unlock" : "Advertisement"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-8">
          {type === "rewarded" 
            ? "Support the app by watching this short sponsor message to download your high-quality PDF."
            : "This space helps keep the app free. Thank you for your support."}
        </p>

        <div className="w-full aspect-video bg-muted/50 rounded-2xl border border-border flex items-center justify-center relative overflow-hidden">
          {completed ? (
            <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
              <CheckCircle className="w-12 h-12 text-primary mb-2" />
              <span className="text-white font-medium">Reward Granted</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
        
        {completed && type === "rewarded" && (
          <button
            onClick={() => onClose(true)}
            className="mt-6 w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl animate-in slide-in-from-bottom-2"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
