import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ScanLine, QrCode, History, Moon, Sun, Star } from "lucide-react";
import ScannerPage from "./pages/ScannerPage";
import GeneratorPage from "./pages/GeneratorPage";
import HistoryPage from "./pages/HistoryPage";
import FavoritesPage from "./pages/FavoritesPage";
import { AdBanner } from "./components/AdBanner";
import { AdInterstitial } from "./components/AdInterstitial";
import { useAdMob } from "./hooks/use-admob";

import { AnimatePresence, motion } from "framer-motion";

const queryClient = new QueryClient();

function MainLayout() {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
  const { 
    showInterstitial, 
    showRewarded, 
    handleInterstitialClose, 
    handleRewardedClose 
  } = useAdMob();

  const getActiveTab = () => {
    if (location === '/generator') return 'generator';
    if (location === '/history') return 'history';
    if (location === '/favorites') return 'favorites';
    return 'scanner';
  };

  const activeTab = getActiveTab();

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-[480px] mx-auto bg-background text-foreground sm:border-x sm:border-border shadow-2xl overflow-hidden relative isolate sm:h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-white/5 bg-card/80 backdrop-blur-xl z-20 shrink-0">
        <div className="font-bold text-lg text-foreground tracking-tight flex items-center gap-2">
          <ScanLine className="w-5 h-5 text-primary" />
          Scanner<span className="text-primary">Pro</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-background">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <Switch location={location}>
              <Route path="/generator" component={GeneratorPage} />
              <Route path="/history" component={HistoryPage} />
              <Route path="/favorites" component={FavoritesPage} />
              <Route path="/" component={ScannerPage} />
              <Route component={ScannerPage} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AdMob Banner */}
      <AdBanner />

      {/* Bottom Tab Bar */}
      <nav className="h-[68px] w-full bg-card border-t border-white/5 flex justify-around items-center px-2 pb-safe shrink-0 z-20 relative">
        <button
          onClick={() => setLocation("/")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            activeTab === "scanner" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "scanner" ? "bg-primary/10" : ""}`}>
            <ScanLine className={`w-6 h-6 ${activeTab === "scanner" ? "fill-primary/10" : ""}`} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Scanner</span>
        </button>

        <button
          onClick={() => setLocation("/generator")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            activeTab === "generator" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "generator" ? "bg-primary/10" : ""}`}>
            <QrCode className={`w-6 h-6 ${activeTab === "generator" ? "fill-primary/10" : ""}`} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Generate</span>
        </button>

        <button
          onClick={() => setLocation("/history")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            activeTab === "history" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "history" ? "bg-primary/10" : ""}`}>
            <History className={`w-6 h-6 ${activeTab === "history" ? "fill-primary/10" : ""}`} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">History</span>
        </button>

        <button
          onClick={() => setLocation("/favorites")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            activeTab === "favorites" ? "text-primary scale-105" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-colors ${activeTab === "favorites" ? "bg-primary/10" : ""}`}>
            <Star className={`w-6 h-6 ${activeTab === "favorites" ? "fill-primary/10" : ""}`} />
          </div>
          <span className="text-[10px] font-bold tracking-wide">Saved</span>
        </button>
      </nav>

      {/* Interstitials */}
      <AnimatePresence>
        {showInterstitial && (
          <AdInterstitial type="interstitial" onClose={handleInterstitialClose} />
        )}
        {showRewarded && (
          <AdInterstitial type="rewarded" onClose={handleRewardedClose} />
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <div className="min-h-[100dvh] bg-black/90 flex justify-center items-center font-sans">
            <MainLayout />
          </div>
        </WouterRouter>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
