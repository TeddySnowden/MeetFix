import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    // Hide if already in standalone
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    } else {
      setShowFallback(true);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center border border-[#00ff41] bg-[rgba(0,255,65,0.15)] backdrop-blur-md shadow-[0_0_14px_rgba(0,255,65,0.4)] hover:shadow-[0_0_24px_rgba(0,255,65,0.6)] hover:scale-110 active:scale-95 transition-all animate-[pwa-pulse_2s_ease-in-out_infinite]"
              aria-label="Install app"
            >
              <Download className="w-5 h-5 text-white drop-shadow-[0_0_6px_#00ff41]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-black/90 border-[#00ff41] text-[#00ffff]">
            Install PWA
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showFallback && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowFallback(false)}
        >
          <div
            className="bg-black/95 border border-[#00ff41] rounded-t-3xl p-6 w-full max-w-md animate-slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#00ff41] mb-3">Install Meetfix</h3>
            <div className="space-y-3 text-white/80 text-sm">
              <p className="font-medium text-white">On Android Chrome:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the <strong>⋮ menu</strong> (top right)</li>
                <li>Select <strong>"Add to Home screen"</strong></li>
                <li>Tap <strong>"Add"</strong></li>
              </ol>
              <p className="font-medium text-white mt-4">On iPhone Safari:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tap the <strong>Share</strong> button (bottom)</li>
                <li>Select <strong>"Add to Home Screen"</strong></li>
                <li>Tap <strong>"Add"</strong></li>
              </ol>
            </div>
            <button
              onClick={() => setShowFallback(false)}
              className="mt-5 w-full py-3 rounded-xl border border-[#00ff41] text-[#00ff41] font-semibold hover:bg-[#00ff41]/10 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
