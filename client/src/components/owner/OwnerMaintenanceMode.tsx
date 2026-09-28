import { useEffect, useState } from "react";
import { Construction, ExternalLink, Loader2, LockKeyhole } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type MaintenanceDraft = { enabled: boolean; title: string; message: string };

const emptyMaintenanceDraft: MaintenanceDraft = {
  enabled: false,
  title: "Nous préparons quelque chose de beau",
  message: "La boutique est momentanément en maintenance. Revenez très bientôt.",
};

/** Tenant-scoped public pause control. The owner workspace stays accessible. */
export default function OwnerMaintenanceMode({ canManage }: { canManage: boolean }) {
  const utils = trpc.useUtils();
  const maintenance = trpc.owner.getMaintenanceMode.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [draft, setDraft] = useState<MaintenanceDraft>(emptyMaintenanceDraft);

  useEffect(() => {
    if (!maintenance.data) return;
    setDraft({
      enabled: maintenance.data.enabled,
      title: maintenance.data.title,
      message: maintenance.data.message,
    });
  }, [maintenance.data]);

  const save = trpc.owner.saveMaintenanceMode.useMutation({
    onSuccess: saved => {
      setDraft(saved);
      toast.success(saved.enabled ? "Mode maintenance activé pour cette boutique." : "Mode maintenance désactivé : la boutique est de nouveau accessible.");
      utils.owner.getMaintenanceMode.invalidate();
      utils.storefront.getMaintenanceMode.invalidate();
    },
    onError: error => toast.error(error.message || "Le mode maintenance n’a pas pu être enregistré."),
  });

  const disabled = !canManage || save.isPending;
  const valid = draft.title.trim().length >= 2 && draft.message.trim().length >= 2;

  return (
    <Card className={draft.enabled ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-white"}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Construction className="h-5 w-5 text-amber-700" /> Mode maintenance de la boutique</CardTitle>
            <CardDescription className="mt-1 max-w-3xl">Mettez votre vitrine en pause pendant une mise à jour. Le panneau propriétaire, MAZIGHO Studio et la connexion restent accessibles.</CardDescription>
          </div>
          <span className={draft.enabled ? "rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950" : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800"}>{draft.enabled ? "Vitrine en pause" : "Vitrine accessible"}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!canManage && <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /> Seul le propriétaire de cette boutique peut modifier ce réglage.</div>}
        {maintenance.isLoading ? <div className="h-28 animate-pulse rounded-xl bg-slate-100" /> : <>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="min-w-0"><Label htmlFor="owner-maintenance-toggle" className="cursor-pointer font-semibold text-slate-950">Suspendre temporairement la vitrine publique</Label><p className="mt-1 text-xs leading-5 text-slate-600">Panier et checkout sont aussi bloqués côté serveur tant que le mode est actif.</p></div>
            <Switch id="owner-maintenance-toggle" checked={draft.enabled} onCheckedChange={enabled => setDraft(current => ({ ...current, enabled }))} disabled={disabled} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="owner-maintenance-title">Titre visible</Label><Input id="owner-maintenance-title" value={draft.title} maxLength={160} disabled={disabled} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="owner-maintenance-message">Message pour les visiteurs</Label><Textarea id="owner-maintenance-message" value={draft.message} maxLength={2000} rows={3} disabled={disabled} onChange={event => setDraft(current => ({ ...current, message: event.target.value }))} /></div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href="/?preview_store_maintenance=1" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-950"><ExternalLink className="h-4 w-4" /> Aperçu de la page d’attente</a>
            <Button type="button" className="min-h-11 bg-amber-700 hover:bg-amber-800" disabled={disabled || !valid} onClick={() => save.mutate({ enabled: draft.enabled, title: draft.title.trim(), message: draft.message.trim() })}>{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{draft.enabled ? "Enregistrer la pause" : "Enregistrer le réglage"}</Button>
          </div>
        </>}
      </CardContent>
    </Card>
  );
}
