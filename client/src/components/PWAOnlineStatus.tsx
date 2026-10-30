import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

/** Signals connectivity without claiming that accounts, carts or orders work offline. */
export default function PWAOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);

  useEffect(() => {
    const markOnline = () => setIsOnline(true);
    const markOffline = () => setIsOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  if (isOnline) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-3 z-[100] mx-auto flex max-w-lg items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-xl shadow-slate-900/10" data-testid="pwa-offline-indicator">
      <WifiOff className="h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
      <span><strong>Connexion indisponible.</strong> Les données de la boutique ne sont pas mises en cache ; reconnectez-vous pour consulter le catalogue, le panier ou votre compte.</span>
    </div>
  );
}
