import { Download, Loader2, Share } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PWAInstallPromptProps = {
  brandName: string;
  accentColor: string;
};

function isAppleMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * This control never stores storefront content. It only asks the browser to
 * install the current HTTPS origin when the browser exposes that capability.
 */
export default function PWAInstallPrompt({ brandName, accentColor }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showAppleGuide, setShowAppleGuide] = useState(false);
  const [isAppleMobile, setIsAppleMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(() => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));

  useEffect(() => {
    setIsAppleMobile(isAppleMobileDevice());
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt || isInstalling) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled || (!deferredPrompt && !isAppleMobile)) return null;

  const label = `Installer ${brandName} sur cet appareil`;
  return (
    <>
      <button
        type="button"
        onClick={() => isAppleMobile ? setShowAppleGuide(true) : void install()}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: accentColor }}
        aria-label={label}
        title={label}
        data-testid="pwa-install-button"
      >
        {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : isAppleMobile ? <Share className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        <span className="hidden xl:inline">Installer</span>
      </button>

      <Dialog open={showAppleGuide} onOpenChange={setShowAppleGuide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Installer {brandName}</DialogTitle>
            <DialogDescription>Ajoutez cette boutique à l’écran d’accueil pour l’ouvrir ensuite comme une application.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm leading-6 text-slate-700">
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">1</span><span>Ouvrez cette page dans <strong>Safari</strong> si ce n’est pas déjà le cas.</span></li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">2</span><span>Appuyez sur <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" aria-label="Partager" /> <strong>Partager</strong> dans la barre Safari.</span></li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">3</span><span>Choisissez <strong>Sur l’écran d’accueil</strong>, puis confirmez <strong>Ajouter</strong>.</span></li>
          </ol>
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">Le catalogue, le compte et le panier restent synchronisés en ligne. Cette installation ne sauvegarde pas vos données de commande dans l’appareil.</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
