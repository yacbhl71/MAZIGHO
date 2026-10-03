import { ExternalLink, Store } from "lucide-react";
import { getSetupOwnerPanelPath } from "@shared/setupStoreOwnerAccess";
import { getOwnerStoreStatusPresentation } from "@shared/ownerStoreStatus";
import { getStoreMembershipRolePresentation } from "@shared/storeMembershipRole";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type OwnerStoreSwitcherOption = {
  id: number;
  displayName: string;
  primaryDomain: string;
  status: string;
  role: string;
};

type Props = {
  stores: OwnerStoreSwitcherOption[];
  currentStoreId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getOwnerStoreWorkspaceHref(store: OwnerStoreSwitcherOption) {
  if (store.status === "setup") {
    return `https://www.mazigho.ch${getSetupOwnerPanelPath(store.id)}`;
  }
  const domain = store.primaryDomain.trim();
  return domain ? `https://${domain}/gestion-boutique` : "https://www.mazigho.ch/gestion-boutique";
}

export default function OwnerStoreSwitcher({ stores, currentStoreId, open, onOpenChange }: Props) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-xl"><Store className="h-5 w-5 text-teal-700" /> Mes boutiques</DialogTitle>
        <DialogDescription className="max-w-xl leading-6">Un seul compte peut gérer plusieurs boutiques qui vous sont attribuées. Chaque ouverture bascule vers son espace isolé : catalogue, commandes, clients, paiements et équipe ne se mélangent jamais.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 pt-2">
        {stores.map(store => {
          const current = store.id === currentStoreId;
          const status = getOwnerStoreStatusPresentation(store.status);
          const membership = getStoreMembershipRolePresentation(store.role);
          return <div key={store.id} className={`rounded-2xl border p-4 ${current ? "border-teal-500 bg-teal-50" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold text-slate-950">{store.displayName}</p>{current && <Badge className="border-0 bg-teal-700 text-white hover:bg-teal-700">Boutique ouverte</Badge>}</div>
                <p className="mt-1 break-all text-xs text-slate-600">{store.status === "setup" ? "Espace privé de préparation" : store.primaryDomain || "Domaine en préparation"}</p>
                <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{membership.label}</Badge><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{status.label}</Badge></div>
              </div>
              {current ? <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={() => onOpenChange(false)}>Rester ici</Button> : <Button asChild className="min-h-11 shrink-0 bg-teal-700 hover:bg-teal-800"><a href={getOwnerStoreWorkspaceHref(store)}>Ouvrir la boutique <ExternalLink className="ml-2 h-4 w-4" /></a></Button>}
            </div>
          </div>;
        })}
      </div>
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">Ce sélecteur ne crée ni boutique, ni rôle, ni partage d’accès. Pour offrir une boutique à une autre personne, transférez ensuite sa propriété depuis MAZIGHO Studio : elle aura son propre compte et ne verra pas les vôtres.</p>
    </DialogContent>
  </Dialog>;
}
