import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { storefrontThemeCatalog, type StorefrontThemeId } from "@shared/storefrontThemeCatalog";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Eye, Layers3, Loader2, Palette, Rocket, Sparkles, Store, WandSparkles } from "lucide-react";
import { toast } from "sonner";

const themes = storefrontThemeCatalog;

const statusLabels: Record<string, string> = {
  setup: "À préparer",
  active: "Active",
  limited: "Accès limité",
  suspended: "Suspendue",
  closed: "Clôturée",
};

export default function AdminStudioThemes() {
  const [, setLocation] = useLocation();
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [selectedThemeId, setSelectedThemeId] = useState<StorefrontThemeId>("violetCraft");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignedThemeIds, setAssignedThemeIds] = useState<StorefrontThemeId[]>([]);

  const selectedTheme = themes.find(theme => theme.id === selectedThemeId) ?? themes[0];
  const availableStores = useMemo(() => (inventoryQuery.data?.stores ?? []).filter(store => !store.isPlatformStore && store.status !== "closed"), [inventoryQuery.data?.stores]);
  const selectedStore = useMemo(() => availableStores.find(store => String(store.id) === selectedStoreId) ?? null, [availableStores, selectedStoreId]);
  const themeAccessQuery = trpc.admin.studio.getStorefrontThemeAccess.useQuery({ storeId: selectedStore?.id ?? 0 }, { enabled: Boolean(selectedStore), retry: false });
  useEffect(() => {
    if (themeAccessQuery.data?.themeIds) setAssignedThemeIds(themeAccessQuery.data.themeIds);
  }, [themeAccessQuery.data?.themeIds, selectedStore?.id]);
  const saveThemeAccessMutation = trpc.admin.studio.saveStorefrontThemeAccess.useMutation({
    onSuccess: async saved => {
      setAssignedThemeIds(saved.themeIds);
      toast.success(`${saved.themeIds.length} thème${saved.themeIds.length > 1 ? "s" : ""} attribué${saved.themeIds.length > 1 ? "s" : ""} à ${selectedStore?.displayName ?? "la boutique"}.`);
      await utils.admin.studio.getStorefrontThemeAccess.invalidate({ storeId: selectedStore?.id ?? 0 });
    },
    onError: error => toast.error(error.message || "La bibliothèque de thèmes n’a pas pu être enregistrée."),
  });

  const applyThemeMutation = trpc.admin.studio.applyStorefrontTheme.useMutation({
    onSuccess: async (_, input) => {
      toast.success(`Modèle « ${themes.find(theme => theme.id === input.themeId)?.label ?? "sélectionné"} » appliqué à ${selectedStore?.displayName ?? "la boutique"}.`);
      setConfirmOpen(false);
      setAcknowledged(false);
      setConfirmationName("");
      await Promise.all([
        utils.admin.studio.getInventory.invalidate(),
        utils.admin.studio.getOwnerPublicStorefrontContent.invalidate({ storeId: input.storeId }),
        utils.admin.studio.getPrivateStorefrontPreview.invalidate({ storeId: input.storeId }),
      ]);
      setLocation(`/admin/studio/contenu-public/${input.storeId}`);
    },
    onError: error => toast.error(error.message || "Le modèle n’a pas pu être appliqué."),
  });

  const canConfirm = Boolean(selectedStore && acknowledged && confirmationName.trim() === selectedStore.displayName.trim());

  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">Bibliothèque de thèmes</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Thèmes de boutiques</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choisissez un univers de départ, appliquez-le à une boutique existante ou démarrez une nouvelle préparation avec ce thème déjà sélectionné. Chaque élément reste ensuite modifiable par le propriétaire.</p></div>
      <Link href="/admin/studio" className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio</Link>
    </header>

    <section className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-lg md:p-6"><div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Une base, jamais une contrainte</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Un thème installe un point de départ visuel cohérent.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Le thème peut modifier l’identité, les textes de l’accueil, le carrousel, le menu et les illustrations de catégories. Il ne touche ni aux produits, ni aux prix, ni aux stocks, ni aux propriétaires, ni au statut public de la boutique.</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-violet-400/15 p-2.5 text-violet-200"><Palette className="h-5 w-5" /></div><div><p className="font-semibold">Toujours réversible</p><p className="mt-1 text-xs leading-5 text-slate-300">Les réglages restent accessibles dans Contenu storefront et Navigation.</p></div></div></div></div></section>

    <section aria-labelledby="theme-library-title"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Choisir le modèle</p><h2 id="theme-library-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Bibliothèque disponible</h2></div><Badge variant="outline" className="w-fit border-slate-200 bg-white text-slate-700">{themes.length} thèmes prêts</Badge></div><div className="mt-4 grid gap-4 xl:grid-cols-3">{themes.map(theme => { const selected = theme.id === selectedThemeId; return <article key={theme.id} className={`overflow-hidden rounded-2xl border shadow-sm transition ${selected ? "ring-2 ring-slate-950 ring-offset-2" : "hover:shadow-md"} ${theme.palette.card}`}><button type="button" className="block w-full text-left" onClick={() => setSelectedThemeId(theme.id)} aria-pressed={selected}><img src={theme.visual} alt={theme.visualAlt} className="h-44 w-full object-cover" /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.palette.label}`}>{theme.eyebrow}</p><h3 className={`mt-2 text-xl font-bold ${theme.palette.title}`}>{theme.label}</h3></div>{selected && <Badge className={`border-0 ${theme.palette.badge}`}>Sélectionné</Badge>}</div><p className={`mt-3 text-sm leading-6 ${theme.palette.text}`}>{theme.description}</p><ul className={`mt-4 space-y-2 text-xs leading-5 ${theme.palette.text}`}>{theme.benefits.map(benefit => <li key={benefit} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{benefit}</li>)}</ul></div></button></article>; })}</div></section>

    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,.88fr)]"><Card className="border-slate-200"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-slate-950 p-2.5 text-white"><Store className="h-5 w-5" /></div><div><CardDescription>Appliquer à une boutique déjà enregistrée</CardDescription><CardTitle className="mt-1 text-2xl">Installer {selectedTheme.label}</CardTitle></div></div></CardHeader><CardContent className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><img src={selectedTheme.visual} alt="Aperçu du thème choisi" className="h-20 w-32 rounded-xl object-cover" /><div><p className="font-semibold text-slate-950">{selectedTheme.label}</p><p className="mt-1 text-sm leading-5 text-slate-600">L’installation prépare l’identité, l’accueil, le carrousel, le menu et les visuels de catégories. La boutique peut rester ouverte ou en préparation : son statut ne change pas.</p></div></div></div><div className="space-y-2"><Label htmlFor="theme-store">Boutique concernée</Label><Select value={selectedStoreId} onValueChange={setSelectedStoreId}><SelectTrigger id="theme-store" className="min-h-11"><SelectValue placeholder={inventoryQuery.isLoading ? "Chargement des boutiques…" : "Choisir une boutique"} /></SelectTrigger><SelectContent>{availableStores.map(store => <SelectItem key={store.id} value={String(store.id)}>{store.displayName} · {statusLabels[store.status] ?? store.status}</SelectItem>)}</SelectContent></Select>{availableStores.length === 0 && !inventoryQuery.isLoading && <p className="text-sm leading-6 text-slate-600">Aucune boutique cliente disponible. Créez une préparation ci-dessous pour utiliser ce thème plus tard.</p>}</div>{selectedStore && <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold text-violet-950">Bibliothèque attribuée au propriétaire</p><p className="mt-1 text-xs leading-5 text-violet-900">Choisissez exactement les thèmes visibles dans son panneau. Les packs sont un raccourci modifiable, jamais une obligation.</p></div><Badge className="border-0 bg-violet-700 text-white hover:bg-violet-700">{assignedThemeIds.length || themeAccessQuery.data?.themeIds.length || 0} thème(s)</Badge></div>{themeAccessQuery.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-violet-100" /> : <><div className="flex flex-wrap gap-2">{([5, 8, 15] as const).map(count => <Button key={count} type="button" size="sm" variant="outline" className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100" data-testid={`studio-theme-access-pack-${count}`} onClick={() => setAssignedThemeIds(themes.slice(0, Math.min(count, themes.length)).map(theme => theme.id))}>{count} thèmes</Button>)}<Button type="button" size="sm" variant="outline" className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100" data-testid="studio-theme-access-pack-all" onClick={() => setAssignedThemeIds(themes.map(theme => theme.id))}>Tous les thèmes</Button></div><div className="grid gap-2 sm:grid-cols-2">{themes.map(theme => { const checked = assignedThemeIds.includes(theme.id); return <label key={theme.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${checked ? "border-violet-300 bg-white text-violet-950" : "border-violet-100 bg-white/60 text-slate-700"}`}><input type="checkbox" checked={checked} onChange={event => setAssignedThemeIds(current => event.target.checked ? [...current, theme.id] : current.filter(id => id !== theme.id))} className="h-4 w-4 rounded border-violet-300 text-violet-700 focus:ring-violet-600" /><span className="min-w-0"><span className="block truncate font-medium">{theme.label}</span><span className="block truncate text-xs opacity-75">{theme.eyebrow}</span></span></label>; })}</div><Button type="button" size="sm" className="bg-violet-700 hover:bg-violet-800" disabled={assignedThemeIds.length === 0 || saveThemeAccessMutation.isPending} onClick={() => selectedStore && saveThemeAccessMutation.mutate({ storeId: selectedStore.id, themeIds: assignedThemeIds })}>{saveThemeAccessMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Enregistrer la bibliothèque</Button></>}</div>}<Button type="button" className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto" disabled={!selectedStore || applyThemeMutation.isPending} onClick={() => { setConfirmationName(""); setAcknowledged(false); setConfirmOpen(true); }}><WandSparkles className="mr-2 h-4 w-4" /> Appliquer à cette boutique</Button></CardContent></Card>

      <Card className="border-orange-200 bg-orange-50/60"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-orange-100 p-2.5 text-orange-800"><Rocket className="h-5 w-5" /></div><div><CardDescription className="text-orange-800">Nouvelle boutique</CardDescription><CardTitle className="mt-1 text-2xl text-orange-950">Partir de ce thème</CardTitle></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-orange-950">Le thème choisi sera prérempli dans le brouillon de préparation. Vous pourrez ensuite choisir le nom, le domaine, le propriétaire et la devise avant toute création réelle.</p><Button type="button" className="mt-5 min-h-11 w-full bg-orange-700 hover:bg-orange-800" onClick={() => setLocation(`/admin/studio?theme=${selectedTheme.id}#studio-provisioning`)}><Sparkles className="mr-2 h-4 w-4" /> Préparer une nouvelle boutique <ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-3 text-xs leading-5 text-orange-900">Aucune boutique, invitation, e-mail, domaine public, abonnement ou paiement n’est créé à cette étape.</p></CardContent></Card>
    </section>

    <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950"><div className="flex gap-3"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" /><div><p className="font-semibold">Après l’installation</p><p className="mt-1">Vous êtes envoyé vers le contenu de la boutique pour ajuster les textes, images et bannières. Le menu reste modifiable, et le propriétaire garde la main sur son univers.</p></div></div></section>

    <Dialog open={confirmOpen} onOpenChange={open => { if (!applyThemeMutation.isPending) setConfirmOpen(open); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><WandSparkles className="h-5 w-5 text-violet-700" /> Appliquer le thème à une boutique existante</DialogTitle><DialogDescription>Cette action remplace les contenus visuels de départ de la boutique sélectionnée. Elle ne touche pas au catalogue, aux produits, aux prix, aux stocks, aux propriétaires ou au statut de la boutique.</DialogDescription></DialogHeader>{selectedStore && <div className="space-y-4"><div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><p><strong>Boutique :</strong> {selectedStore.displayName}</p><p className="mt-1"><strong>Thème :</strong> {selectedTheme.label}</p><p className="mt-1"><strong>Statut conservé :</strong> {statusLabels[selectedStore.status] ?? selectedStore.status}</p></div><div className="space-y-2"><Label htmlFor="theme-confirm-name">Recopiez le nom de la boutique</Label><Input id="theme-confirm-name" value={confirmationName} onChange={event => setConfirmationName(event.target.value)} placeholder={selectedStore.displayName} /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>Je confirme remplacer les contenus visuels de départ de cette boutique par le thème sélectionné. Je pourrai ensuite les modifier, les remplacer ou les masquer.</span></label></div>}<DialogFooter><Button type="button" variant="outline" disabled={applyThemeMutation.isPending} onClick={() => setConfirmOpen(false)}>Annuler</Button><Button type="button" className={selectedTheme.palette.button} disabled={!canConfirm || applyThemeMutation.isPending} onClick={() => selectedStore && applyThemeMutation.mutate({ storeId: selectedStore.id, themeId: selectedTheme.id })}>{applyThemeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}Appliquer le thème</Button></DialogFooter></DialogContent></Dialog>
  </main></DashboardLayout>;
}
