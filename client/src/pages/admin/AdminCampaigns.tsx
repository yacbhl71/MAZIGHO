import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Megaphone, Plus, Pencil, Trash2, Loader2, Timer } from "lucide-react";

type Placement = "announcement" | "products" | "both";
type Form = {
  id?: number;
  name: string;
  message: string;
  startsAt: string;
  endsAt: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  linkUrl: string;
  promoCode: string;
  showCountdown: boolean;
  placement: Placement;
  enabled: boolean;
};

const pad = (n: number) => String(n).padStart(2, "0");
function toLocalInput(value: string | Date) {
  const d = new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function nowPlusHours(h: number) {
  return toLocalInput(new Date(Date.now() + h * 3600000));
}

const emptyForm = (): Form => ({
  name: "",
  message: "",
  startsAt: toLocalInput(new Date()),
  endsAt: nowPlusHours(72),
  imageDesktopUrl: "",
  imageMobileUrl: "",
  linkUrl: "",
  promoCode: "none",
  showCountdown: true,
  placement: "announcement",
  enabled: true,
});

function statusOf(c: any): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  if (!c.enabled) return { label: "Désactivée", variant: "secondary" };
  const now = Date.now();
  const start = new Date(c.startsAt).getTime();
  const end = new Date(c.endsAt).getTime();
  if (now < start) return { label: "À venir", variant: "outline" };
  if (now >= end) return { label: "Terminée", variant: "secondary" };
  return { label: "En cours", variant: "default" };
}

export default function AdminCampaigns() {
  const utils = trpc.useUtils();
  const campaignsQuery = trpc.admin.campaigns.getAll.useQuery();
  const promosQuery = trpc.admin.promotions.getAll.useQuery();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm());

  const promoCodes = useMemo(() => (promosQuery.data || []).map((p: any) => p.code as string), [promosQuery.data]);

  const invalidate = () => {
    utils.admin.campaigns.getAll.invalidate();
    utils.content.getActiveCampaign.invalidate();
  };

  const createMut = trpc.admin.campaigns.create.useMutation({ onSuccess: () => { toast.success("Campagne créée"); setOpen(false); invalidate(); }, onError: () => toast.error("Création impossible") });
  const updateMut = trpc.admin.campaigns.update.useMutation({ onSuccess: () => { toast.success("Campagne mise à jour"); setOpen(false); invalidate(); }, onError: () => toast.error("Mise à jour impossible") });
  const deleteMut = trpc.admin.campaigns.delete.useMutation({ onSuccess: () => { toast.success("Campagne supprimée"); invalidate(); }, onError: () => toast.error("Suppression impossible") });
  const toggleMut = trpc.admin.campaigns.toggle.useMutation({ onSuccess: () => invalidate(), onError: () => toast.error("Action impossible") });

  const openCreate = () => { setForm(emptyForm()); setOpen(true); };
  const openEdit = (c: any) => {
    setForm({
      id: c.id,
      name: c.name,
      message: c.message || "",
      startsAt: toLocalInput(c.startsAt),
      endsAt: toLocalInput(c.endsAt),
      imageDesktopUrl: c.imageDesktopUrl || "",
      imageMobileUrl: c.imageMobileUrl || "",
      linkUrl: c.linkUrl || "",
      promoCode: c.promoCode || "none",
      showCountdown: c.showCountdown === 1 || c.showCountdown === true,
      placement: c.placement,
      enabled: c.enabled === 1 || c.enabled === true,
    });
    setOpen(true);
  };

  const submit = () => {
    if (form.name.trim().length < 2) { toast.error("Le nom est requis"); return; }
    if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) { toast.error("La date de fin doit être après le début"); return; }
    const payload = {
      name: form.name.trim(),
      message: form.message.trim() || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      imageDesktopUrl: form.imageDesktopUrl.trim() || null,
      imageMobileUrl: form.imageMobileUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      promoCode: form.promoCode === "none" ? null : form.promoCode,
      showCountdown: form.showCountdown,
      placement: form.placement,
      enabled: form.enabled,
    };
    if (form.id) updateMut.mutate({ id: form.id, ...payload });
    else createMut.mutate(payload);
  };

  const campaigns = campaignsQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6" data-testid="admin-campaigns">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
              <Megaphone className="h-6 w-6 text-orange-500" /> Campagnes & bannières
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bannières programmées avec compte à rebours FOMO. Elles s'affichent et disparaissent automatiquement selon l'heure du serveur.
            </p>
          </div>
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="campaign-new-btn">
            <Plus className="mr-2 h-4 w-4" /> Nouvelle campagne
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {campaignsQuery.isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campagne</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Compte à rebours</TableHead>
                    <TableHead>Promo</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Aucune campagne pour le moment.</TableCell></TableRow>
                  ) : campaigns.map((c: any) => {
                    const st = statusOf(c);
                    return (
                      <TableRow key={c.id} data-testid={`campaign-row-${c.id}`}>
                        <TableCell>
                          <div className="font-semibold text-foreground">{c.name}</div>
                          {c.message && <div className="max-w-[280px] truncate text-xs text-muted-foreground">{c.message}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(c.startsAt).toLocaleString("fr-CH", { dateStyle: "short", timeStyle: "short" })}<br />
                          → {new Date(c.endsAt).toLocaleString("fr-CH", { dateStyle: "short", timeStyle: "short" })}
                        </TableCell>
                        <TableCell>{(c.showCountdown === 1 || c.showCountdown === true) ? <Badge variant="outline" className="gap-1"><Timer className="h-3 w-3" /> Oui</Badge> : <span className="text-xs text-muted-foreground">Non</span>}</TableCell>
                        <TableCell>{c.promoCode ? <Badge variant="outline">{c.promoCode}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch checked={c.enabled === 1 || c.enabled === true} onCheckedChange={v => toggleMut.mutate({ id: c.id, enabled: v })} data-testid={`campaign-toggle-${c.id}`} />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => openEdit(c)} data-testid={`campaign-edit-${c.id}`}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => { if (confirm("Supprimer cette campagne ?")) deleteMut.mutate({ id: c.id }); }} data-testid={`campaign-delete-${c.id}`}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" data-testid="campaign-dialog">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier la campagne" : "Nouvelle campagne"}</DialogTitle>
            <DialogDescription>La bannière s'affiche automatiquement pendant la période définie.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-name">Nom *</Label>
              <Input id="c-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Soldes d'hiver" data-testid="campaign-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-message">Message de la bannière</Label>
              <Input id="c-message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="-20% sur tout le site !" data-testid="campaign-message" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="c-start">Début</Label>
                <Input id="c-start" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} data-testid="campaign-start" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-end">Fin</Label>
                <Input id="c-end" type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} data-testid="campaign-end" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-img-d">Visuel desktop (URL)</Label>
              <Input id="c-img-d" value={form.imageDesktopUrl} onChange={e => setForm({ ...form, imageDesktopUrl: e.target.value })} placeholder="https://…/banniere-desktop.jpg" data-testid="campaign-image-desktop" />
              <p className="text-xs text-muted-foreground">Optionnel. Si vide, une barre d'annonce colorée est affichée.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-img-m">Visuel mobile (URL)</Label>
              <Input id="c-img-m" value={form.imageMobileUrl} onChange={e => setForm({ ...form, imageMobileUrl: e.target.value })} placeholder="https://…/banniere-mobile.jpg" data-testid="campaign-image-mobile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-link">Lien de redirection</Label>
              <Input id="c-link" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="/boutique ou https://…" data-testid="campaign-link" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Code promo lié</Label>
                <Select value={form.promoCode} onValueChange={v => setForm({ ...form, promoCode: v })}>
                  <SelectTrigger data-testid="campaign-promo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {promoCodes.map(code => <SelectItem key={code} value={code}>{code}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Emplacement</Label>
                <Select value={form.placement} onValueChange={v => setForm({ ...form, placement: v as Placement })}>
                  <SelectTrigger data-testid="campaign-placement"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Barre d'annonce</SelectItem>
                    <SelectItem value="products">Fiches produits</SelectItem>
                    <SelectItem value="both">Les deux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <Label htmlFor="c-countdown" className="cursor-pointer">Afficher un compte à rebours (FOMO)</Label>
              <Switch id="c-countdown" checked={form.showCountdown} onCheckedChange={v => setForm({ ...form, showCountdown: v })} data-testid="campaign-countdown-toggle" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <Label htmlFor="c-enabled" className="cursor-pointer">Campagne active</Label>
              <Switch id="c-enabled" checked={form.enabled} onCheckedChange={v => setForm({ ...form, enabled: v })} data-testid="campaign-enabled" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="campaign-save-btn">
              {(createMut.isPending || updateMut.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
