import { useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronUp, Compass, LayoutDashboard, Rocket, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getSetupOwnerPanelPath } from "@shared/setupStoreOwnerAccess";

const SURFACES = [
  { id: "storefront", label: "Boutique MAZIGHO", domain: "mazigho.ch", href: "https://mazigho.ch/", icon: Store },
  { id: "turnkey", label: "Boutique Clé en main", domain: "mazigho.ch/creation-boutique", href: "https://mazigho.ch/creation-boutique", icon: Sparkles },
  { id: "studio", label: "MAZIGHO Studio", domain: "studio.mazigho.ch", href: "https://studio.mazigho.ch/admin/studio", icon: Building2 },
  { id: "admin", label: "Admin Boutique", domain: "mazigho.ch/admin", href: "https://mazigho.ch/admin", icon: LayoutDashboard },
] as const;

export function PrincipalSurfaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth() as any;
  const storesQuery = trpc.owner.getStoreSwitcherOptions.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data]);
  const isAdmin = user?.role === "admin";

  if (!user || (!isAdmin && stores.length === 0)) return null;

  const hostname = typeof window === "undefined" ? "" : window.location.hostname.toLowerCase();
  const activeSurface = hostname === "studio.mazigho.ch" || location.startsWith("/admin/studio")
    ? SURFACES[2]
    : location.startsWith("/creation-boutique")
      ? SURFACES[1]
      : location.startsWith("/admin")
        ? SURFACES[3]
        : SURFACES[0];

  const openHref = (href: string) => {
    setOpen(false);
    window.location.assign(href);
  };

  const openStore = (store: (typeof stores)[number]) => {
    setOpen(false);
    const domain = store.primaryDomain.trim().toLowerCase();
    if (!domain) return;
    const path = store.status === "setup" ? getSetupOwnerPanelPath(store.id) : "/gestion-boutique";
    window.location.assign(`https://${domain}${path}`);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[90] font-sans" data-testid="principal-surface-switcher">
      {open && (
        <div className="mb-2 max-h-[80vh] w-80 overflow-y-auto rounded-2xl border border-teal-900/80 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 border-b border-slate-800 px-1 pb-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">Navigation multi-espaces</p>
            <p className="text-xs text-slate-300">Espaces Principal et boutiques .ch uniquement</p>
          </div>
          {isAdmin && (
            <div className="space-y-1">
              <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Espaces Principal</p>
              {SURFACES.map(surface => {
                const Icon = surface.icon;
                const active = activeSurface.id === surface.id;
                return <button key={surface.id} type="button" onClick={() => openHref(surface.href)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-teal-700 text-white" : "text-slate-200 hover:bg-slate-800/90"}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{surface.label}</span><span className="block truncate text-[10px] text-slate-400">{surface.domain}</span></span>
                </button>;
              })}
            </div>
          )}
          {stores.length > 0 && <div className="mt-2 border-t border-slate-800 pt-2">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Mes boutiques .ch ({stores.length})</p>
            {stores.map(store => <button key={store.id} type="button" onClick={() => openStore(store)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-200 transition hover:bg-slate-800/90">
              <ShoppingBag className="h-4 w-4 shrink-0 text-emerald-400" />
              <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{store.displayName}</span><span className="block truncate text-[10px] text-slate-400">{store.primaryDomain}</span></span>
            </button>)}
          </div>}
        </div>
      )}
      <button type="button" onClick={() => setOpen(value => !value)} data-testid="principal-surface-switcher-toggle" className="inline-flex items-center gap-2.5 rounded-full border border-teal-900/80 bg-slate-950/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900">
        <Compass className="h-4 w-4 text-teal-300" />
        <span>Espace : {activeSurface.label}</span>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronUp className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </div>
  );
}
