import { useMemo, useState } from "react";
import { BarChart3, CalendarClock, Copy, Edit3, Eye, EyeOff, Loader2, Megaphone, Plus, ShieldCheck, Timer, TicketPercent } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getOwnerCampaignPublicationConfirmation, getOwnerCampaignStatusPresentation } from "@shared/ownerCampaignOperationsPresentation";
import { toast } from "sonner";

type Placement = "announcement" | "products" | "both";
type CampaignForm = {
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

const pad = (value: number) => String(value).padStart(2, "0");
function toLocalInput(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function afterHours(hours: number) { return toLocalInput(new Date(Date.now() + hours * 3_600_000)); }
function emptyForm(): CampaignForm {
  return {
    name: "",
    message: "",
    startsAt: toLocalInput(new Date()),
    endsAt: afterHours(72),
    imageDesktopUrl: "",
    imageMobileUrl: "",
    linkUrl: "",
    promoCode: "none",
    showCountdown: true,
    placement: "announcement",
    enabled: false,
  };
}
function statusClass(tone: "neutral" | "info" | "success" | "muted") {
  return tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : tone === "info" ? "border-sky-200 bg-sky-50 text-sky-800" : tone === "muted" ? "border-slate-200 bg-slate-100 text-slate-600" : "border-amber-200 bg-amber-50 text-amber-900";
}
function formatMoney(cents: number, currencyCode: string) {
  try { return new Intl.NumberFormat("fr-CH", { style: "currency", currency: currencyCode, maximumFractionDigits: 2 }).format(cents / 100); }
  catch { return `${(cents / 100).toFixed(2)} ${currencyCode}`; }
}

/** Owner-only commercial campaigns. Publishing remains a direct human confirmation. */
export default function OwnerCampaignCenter({ canManage, currencyCode }: { canManage: boolean; currencyCode: string }) {
  const utils = trpc.useUtils();
  const campaigns = trpc.owner.getCampaignInsights.useQuery(undefined, { refetchOnWindowFocus: false });
  const promotions = trpc.owner.getPromotions.useQuery(undefined, { refetchOnWindowFocus: false });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm());

  const invalidate = () => {
    void utils.owner.getCampaignInsights.invalidate();
    void utils.content.getActiveCampaign.invalidate();
  };
  const create = trpc.owner.createCampaign.useMutation({ onSuccess: () => { toast.success("Campagne enregistrée"); setOpen(false); invalidate(); }, onError: error => toast.error(error.message || "La campagne n’a pas pu être enregistrée.") });
  const update = trpc.owner.updateCampaign.useMutation({ onSuccess: () => { toast.success("Campagne mise à jour"); setOpen(false); invalidate(); }, onError: error => toast.error(error.message || "La campagne n’a pas pu être mise à jour.") });
  const toggle = trpc.owner.setCampaignEnabled.useMutation({ onSuccess: (_, input) => { toast.success(input.enabled ? "Campagne activée" : "Campagne arrêtée"); invalidate(); }, onError: error => toast.error(error.message || "Cette action n’a pas pu être appliquée.") });

  const activePromoCodes = useMemo(() => (promotions.data || []).filter((promotion: any) => promotion.active === 1 || promotion.active === true).map((promotion: any) => promotion.code as string), [promotions.data]);
  const rows = campaigns.data || [];
  const totals = useMemo(() => rows.reduce((summary: { active: number; scheduled: number; redemptions: number; discountCents: number }, campaign: any) => {
    const status = getOwnerCampaignStatusPresentation(campaign);
    if (status.status === "live") summary.active += 1;
    if (status.status === "scheduled") summary.scheduled += 1;
    summary.redemptions += Number(campaign.redemptions || 0);
    summary.discountCents += Number(campaign.discountCents || 0);
    return summary;
  }, { active: 0, scheduled: 0, redemptions: 0, discountCents: 0 }), [rows]);

  const start = () => { setForm(emptyForm()); setOpen(true); };
  const edit = (campaign: any) => {
    setForm({
      id: campaign.id,
      name: campaign.name,
      message: campaign.message || "",
      startsAt: toLocalInput(campaign.startsAt),
      endsAt: toLocalInput(campaign.endsAt),
      imageDesktopUrl: campaign.imageDesktopUrl || "",
      imageMobileUrl: campaign.imageMobileUrl || "",
      linkUrl: campaign.linkUrl || "",
      promoCode: campaign.promoCode || "none",
      showCountdown: campaign.showCountdown === 1 || campaign.showCountdown === true,
      placement: campaign.placement,
      enabled: campaign.enabled === 1 || campaign.enabled === true,
    });
    setOpen(true);
  };
  const submit = () => {
    if (form.name.trim().length < 2) return toast.error("Indiquez un nom de campagne.");
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) return toast.error("La période de la campagne doit être valide.");
    const confirmation = getOwnerCampaignPublicationConfirmation({ name: form.name, startsAt, endsAt, enabled: form.enabled });
    if (confirmation && !window.confirm(confirmation)) return;
    const payload = {
      name: form.name.trim(), message: form.message.trim() || null, startsAt, endsAt,
      imageDesktopUrl: form.imageDesktopUrl.trim() || null, imageMobileUrl: form.imageMobileUrl.trim() || null,
      linkUrl: form.linkUrl.trim() || null, promoCode: form.promoCode === "none" ? null : form.promoCode,
      showCountdown: form.showCountdown, placement: form.placement, enabled: form.enabled,
    };
    if (form.id) update.mutate({ id: form.id, ...payload }); else create.mutate(payload);
  };
  const setCampaignEnabled = (campaign: any, enabled: boolean) => {
    if (enabled) {
      const confirmation = getOwnerCampaignPublicationConfirmation({ name: campaign.name, startsAt: campaign.startsAt, endsAt: campaign.endsAt, enabled });
      if (confirmation && !window.confirm(confirmation)) return;
    }
    toggle.mutate({ id: campaign.id, enabled });
  };
  const copyCampaignLink = async (campaign: any) => {
    if (!campaign.linkUrl) return;
    try { await navigator.clipboard.writeText(campaign.linkUrl); toast.success("Lien de campagne copié."); }
    catch { toast.error("Le lien n’a pas pu être copié automatiquement."); }
  };
  const copyCampaignShareText = async (campaign: any) => {
    const url = campaign.linkUrl
      ? campaign.linkUrl.startsWith("/") ? `${window.location.origin}${campaign.linkUrl}` : campaign.linkUrl
      : "";
    const text = [campaign.name, campaign.message, campaign.promoCode ? `Code : ${campaign.promoCode}` : "", url].filter(Boolean).join("\n\n");
    try { await navigator.clipboard.writeText(text); toast.success("Texte prêt à partager copié."); }
    catch { toast.error("Le texte n’a pas pu être copié automatiquement."); }
  };

  return <section className="space-y-5" data-testid="owner-campaign-center">
    <Card className="border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50">
      <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-fuchsia-700" /> Campagnes de vitrine</CardTitle><CardDescription className="mt-1 max-w-3xl">Programmez une bannière, liez un code promotionnel et suivez uniquement les utilisations agrégées de ce code. Aucun e-mail, pixel publicitaire, réseau social ni relance n’est activé ici.</CardDescription></div>{canManage && <Button type="button" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" onClick={start} data-testid="owner-campaign-new"><Plus className="mr-2 h-4 w-4" /> Nouvelle campagne</Button>}</div></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "En cours", value: totals.active, tone: "text-emerald-700" },
        { label: "Programmées", value: totals.scheduled, tone: "text-sky-700" },
        { label: "Utilisations de codes", value: totals.redemptions, tone: "text-fuchsia-700" },
        { label: "Remises accordées", value: formatMoney(totals.discountCents, currencyCode), tone: "text-slate-900" },
      ].map(item => <div key={item.label} className="rounded-xl border border-white/80 bg-white/80 p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p><p className={`mt-2 text-2xl font-bold ${item.tone}`}>{item.value}</p></div>)}</CardContent>
    </Card>

    {!canManage && <Card className="border-amber-200 bg-amber-50"><CardContent className="p-5 text-sm leading-6 text-amber-950">Les campagnes de vitrine sont visibles pour les membres autorisés, mais seul le propriétaire de cette boutique peut les modifier ou les diffuser.</CardContent></Card>}
    {campaigns.isLoading ? <div className="h-48 animate-pulse rounded-2xl bg-slate-100" /> : rows.length === 0 ? <Card className="border-dashed border-fuchsia-200"><CardContent className="p-8 text-center"><Megaphone className="mx-auto h-8 w-8 text-fuchsia-700" /><p className="mt-3 font-semibold text-slate-950">Aucune campagne programmée</p><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Préparez une campagne en brouillon, puis confirmez sa diffusion lorsque son message, son lien et sa période sont prêts.</p>{canManage && <Button type="button" variant="outline" className="mt-4 min-h-11 border-fuchsia-300 text-fuchsia-800 hover:bg-fuchsia-50" onClick={start}>Préparer une campagne</Button>}</CardContent></Card> : <div className="grid gap-4 xl:grid-cols-2">{rows.map((campaign: any) => {
      const presentation = getOwnerCampaignStatusPresentation(campaign);
      const isEnabled = campaign.enabled === 1 || campaign.enabled === true;
      return <Card key={campaign.id} className="border-slate-200"><CardContent className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-bold text-slate-950">{campaign.name}</h3><Badge variant="outline" className={statusClass(presentation.tone)}>{presentation.label}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{campaign.message || "Sans texte secondaire : le nom de la campagne sera affiché."}</p></div>{campaign.showCountdown === 1 || campaign.showCountdown === true ? <Badge variant="outline" className="shrink-0 border-violet-200 bg-violet-50 text-violet-800"><Timer className="mr-1 h-3.5 w-3.5" /> Compte à rebours</Badge> : null}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> Période</p><p className="mt-1 text-xs leading-5 text-slate-700">{new Date(campaign.startsAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}<br />jusqu’au {new Date(campaign.endsAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><BarChart3 className="h-3.5 w-3.5" /> Mesure commerciale</p><p className="mt-1 text-sm font-bold text-slate-950">{campaign.redemptions || 0} utilisation{Number(campaign.redemptions || 0) > 1 ? "s" : ""}</p><p className="mt-0.5 text-xs text-slate-600">{campaign.measurement === "promo" ? `${formatMoney(Number(campaign.discountCents || 0), currencyCode)} de remise` : campaign.measurement === "promo_missing" ? "Code lié introuvable" : "Aucun code lié"}</p></div></div>
        <div className="mt-3 flex flex-wrap gap-2">{campaign.promoCode ? <Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900"><TicketPercent className="mr-1 h-3.5 w-3.5" /> {campaign.promoCode}</Badge> : <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Sans code promotionnel</Badge>}<Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{campaign.placement === "announcement" ? "Barre d’annonce" : campaign.placement === "products" ? "Fiches produits" : "Deux emplacements"}</Badge>{campaign.linkUrl ? <Button type="button" size="sm" variant="ghost" className="h-8 text-sky-800 hover:bg-sky-50 hover:text-sky-950" onClick={() => void copyCampaignLink(campaign)}><Copy className="mr-1 h-3.5 w-3.5" /> Copier le lien</Button> : null}<Button type="button" size="sm" variant="ghost" className="h-8 text-fuchsia-800 hover:bg-fuchsia-50 hover:text-fuchsia-950" onClick={() => void copyCampaignShareText(campaign)}><Copy className="mr-1 h-3.5 w-3.5" /> Texte à partager</Button></div>
        <p className="mt-3 text-xs leading-5 text-slate-500">{presentation.description}</p>
        {canManage && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"><div className="flex items-center gap-2"><Switch checked={isEnabled} disabled={toggle.isPending} onCheckedChange={enabled => setCampaignEnabled(campaign, enabled)} aria-label={isEnabled ? `Arrêter ${campaign.name}` : `Activer ${campaign.name}`} /><span className="text-sm font-medium text-slate-700">{isEnabled ? "Diffusion autorisée" : "Brouillon arrêté"}</span></div><div className="flex gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => edit(campaign)}><Edit3 className="mr-1.5 h-3.5 w-3.5" /> Modifier</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-slate-300" onClick={() => setCampaignEnabled(campaign, !isEnabled)} disabled={toggle.isPending}>{isEnabled ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> Arrêter</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> Activer</>}</Button></div></div>}</CardContent></Card>;
    })}</div>}

    <Card className="border-dashed border-slate-300"><CardContent className="flex gap-3 p-5 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" /><div><p className="font-semibold text-slate-800">Mesure limitée et respectueuse</p><p className="mt-1">Le panneau ne mesure ni visiteurs, ni identités, ni clics, ni appareils. Les seuls indicateurs sont les utilisations et les remises des codes liés, agrégées par campagne et par période. Les campagnes sont locales à cette boutique.</p></div></CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" data-testid="owner-campaign-dialog"><DialogHeader><DialogTitle>{form.id ? "Modifier la campagne" : "Préparer une campagne"}</DialogTitle><DialogDescription>Enregistrez-la en brouillon ou confirmez sa diffusion. La vitrine ne publie rien sur un réseau social et n’envoie aucun message.</DialogDescription></DialogHeader><div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="owner-campaign-name">Nom de la campagne</Label><Input id="owner-campaign-name" value={form.name} maxLength={200} placeholder="Ex. Weekend créatif" onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="owner-campaign-message">Message affiché</Label><Textarea id="owner-campaign-message" rows={3} maxLength={300} value={form.message} placeholder="Ex. Une attention créative pour vos projets du week-end." onChange={event => setForm(current => ({ ...current, message: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="owner-campaign-start">Début</Label><Input id="owner-campaign-start" type="datetime-local" value={form.startsAt} onChange={event => setForm(current => ({ ...current, startsAt: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="owner-campaign-end">Fin</Label><Input id="owner-campaign-end" type="datetime-local" value={form.endsAt} onChange={event => setForm(current => ({ ...current, endsAt: event.target.value }))} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-campaign-promo">Code promotionnel lié</Label><select id="owner-campaign-promo" className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.promoCode} onChange={event => setForm(current => ({ ...current, promoCode: event.target.value }))}><option value="none">Aucun code</option>{activePromoCodes.map(code => <option key={code} value={code}>{code}</option>)}</select><p className="text-xs leading-5 text-slate-500">Seules les utilisations de ce code seront comptées.</p></div><div className="space-y-2"><Label htmlFor="owner-campaign-placement">Emplacement</Label><select id="owner-campaign-placement" className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={form.placement} onChange={event => setForm(current => ({ ...current, placement: event.target.value as Placement }))}><option value="announcement">Barre d’annonce</option><option value="products">Fiches produits</option><option value="both">Les deux</option></select></div></div><div className="space-y-2"><Label htmlFor="owner-campaign-link">Lien de destination</Label><Input id="owner-campaign-link" value={form.linkUrl} maxLength={300} placeholder="/boutique ou https://…" onChange={event => setForm(current => ({ ...current, linkUrl: event.target.value }))} /><p className="text-xs leading-5 text-slate-500">Facultatif. Utilisez un chemin de votre boutique ou une URL https://.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="owner-campaign-image-desktop">Visuel desktop</Label><Input id="owner-campaign-image-desktop" value={form.imageDesktopUrl} maxLength={1000} placeholder="https://…/banniere.webp" onChange={event => setForm(current => ({ ...current, imageDesktopUrl: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="owner-campaign-image-mobile">Visuel mobile</Label><Input id="owner-campaign-image-mobile" value={form.imageMobileUrl} maxLength={1000} placeholder="https://…/banniere-mobile.webp" onChange={event => setForm(current => ({ ...current, imageMobileUrl: event.target.value }))} /></div></div><div className="grid gap-3 sm:grid-cols-2"><div className="flex items-center justify-between rounded-xl border border-slate-200 p-4"><Label htmlFor="owner-campaign-countdown" className="cursor-pointer text-sm leading-5">Afficher un compte à rebours</Label><Switch id="owner-campaign-countdown" checked={form.showCountdown} onCheckedChange={showCountdown => setForm(current => ({ ...current, showCountdown }))} /></div><div className="flex items-center justify-between rounded-xl border border-fuchsia-200 bg-fuchsia-50/50 p-4"><Label htmlFor="owner-campaign-enabled" className="cursor-pointer text-sm leading-5 text-fuchsia-950">Autoriser la diffusion dans la vitrine</Label><Switch id="owner-campaign-enabled" checked={form.enabled} onCheckedChange={enabled => setForm(current => ({ ...current, enabled }))} /></div></div><p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">L’activation vous demandera une confirmation explicite au moment de l’enregistrement. Les paramètres n’activent ni e-mail, ni publicité, ni pixel, ni relance automatique.</p></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button><Button type="button" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" disabled={create.isPending || update.isPending} onClick={submit}>{create.isPending || update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{form.enabled ? "Confirmer et enregistrer" : "Enregistrer le brouillon"}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
