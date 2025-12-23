/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/InstallPrompt.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share, Plus, Check } from "lucide-react";

export const InstallPrompt = () => {
  // Calculate initial values directly instead of using effects
  const isInStandaloneMode =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://"));

  const iOS =
    typeof window !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if user has dismissed before
    const dismissed = localStorage.getItem("installPromptDismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Show prompt if not installed, not dismissed recently (delayed)
    if (!isInStandaloneMode && dismissedTime < sevenDaysAgo) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);

      // Listen for beforeinstallprompt event (Android)
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }

    // Listen for beforeinstallprompt even if not showing prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isInStandaloneMode]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("installPromptDismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  if (isInStandaloneMode || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-96"
      >
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-[32px] shadow-cartoon border-2 border-white p-6 relative">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>

          {/* Content */}
          <div className="flex gap-4">
            <div className="bg-brand-primary/10 p-3 rounded-2xl shrink-0 h-fit">
              <Smartphone size={32} className="text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800 mb-1">
                Install The Weekly Shop
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Add to your home screen for quick access & offline use
              </p>

              {iOS ? (
                // iOS Instructions
                <div className="space-y-3 mb-4">
                  <div className="flex items-start gap-3 text-xs text-slate-700">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                      <Share size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold">1. Tap the Share button</span>
                      <p className="text-slate-500">
                        (square with arrow, bottom of screen)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                      <Plus size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold">
                        2. Tap "Add to Home Screen"
                      </span>
                      <p className="text-slate-500">
                        Scroll down if you don't see it
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-slate-700">
                    <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                      <Check size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold">3. Tap "Add"</span>
                      <p className="text-slate-500">
                        The app will appear on your home screen
                      </p>
                    </div>
                  </div>
                </div>
              ) : deferredPrompt ? (
                // Android with install prompt
                <button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-accent text-white px-6 py-3 rounded-2xl font-bold shadow-cartoon hover:shadow-lg transition-all flex items-center justify-center gap-2 mb-2"
                >
                  <Download size={20} />
                  Install App
                </button>
              ) : (
                // Android without install prompt (or other browsers)
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-slate-700">
                    <span className="font-bold">
                      Tap your browser menu (⋮) and select "Add to Home screen"
                      or "Install app"
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
