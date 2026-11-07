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
import { ArrowLeft, ArrowRight, CheckCircle2, Crown, Eye, History, Loader2, Palette, Rocket, RotateCcw, Sparkles, Store, WandSparkles } from "lucide-react";
import { toast } from "sonner";

const themes = storefrontThemeCatalog;

const statusLabels: Record<string, string> = {
  setup: "À préparer",
  active: "Active",
  limited: "Accès limité",
  suspended: "Suspendue",
  closed: "Clôturée",
};

function ThemePreviewFrame({ theme, label }: { theme: (typeof themes)[number]; label: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.palette.card}`}>
      <div className="flex items-center justify-between border-b border-black/10 bg-white/90 px-3 py-2 text-[10px] font-bold text-slate-700">
        <span className="truncate uppercase tracking-[0.14em]">{theme.label}</span><span className="rounded-full bg-slate-950 px-2 py-1 text-[9px] text-white">APERÇU</span>
      </div>
      <div className="relative h-52 overflow-hidden">
        <img src={theme.visual} alt={theme.visualAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-4 text-white">
          <div className="flex items-center justify-between text-[9px] font-semibold"><span>Accueil</span><span className="hidden sm:inline">Boutique&nbsp;&nbsp; Collections&nbsp;&nbsp; Contact</span><span>☰</span></div>
          <div className="max-w-[75%]"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-orange-200">{theme.eyebrow}</p><p className="mt-1 text-xl font-bold leading-tight">Une sélection pensée pour vous.</p><p className="mt-1 text-[10px] leading-4 text-white/80">Découvrez l’univers de votre boutique.</p><button type="button" className="mt-3 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-slate-950">Découvrir la boutique</button></div>
        </div>
      </div>
      <div className="bg-white/90 p-3"><p className="text-center text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p><div className="mt-2 grid grid-cols-3 gap-2"><span className="rounded-lg bg-slate-100 px-2 py-2 text-center text-[9px] text-slate-600">Nouveautés</span><span className="rounded-lg bg-slate-100 px-2 py-2 text-center text-[9px] text-slate-600">Collections</span><span className="rounded-lg bg-slate-100 px-2 py-2 text-center text-[9px] text-slate-600">Promotions</span></div></div>
    </div>
  );
}

export default function AdminStudioThemes() {
  const [, setLocation] = useLocation();
  const inventoryQuery = trpc.admin.studio.getInventory.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [selectedThemeId, setSelectedThemeId] = useState<StorefrontThemeId>("violetCraft");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string | null>(null);
  const [assignedThemeIds, setAssignedThemeIds] = useState<StorefrontThemeId[]>([]);

  const selectedTheme = themes.find(theme => theme.id === selectedThemeId) ?? themes[0];
  const availableStores = useMemo(() => (inventoryQuery.data?.stores ?? []).filter(store => !store.isPlatformStore && store.status !== "closed"), [inventoryQuery.data?.stores]);
  const selectedStore = useMemo(() => availableStores.find(store => String(store.id) === selectedStoreId) ?? null, [availableStores, selectedStoreId]);
  const themeAccessQuery = trpc.admin.studio.getStorefrontThemeAccess.useQuery({ storeId: selectedStore?.id ?? 0 }, { enabled: Boolean(selectedStore), retry: false });
  const themeHistoryQuery = trpc.admin.studio.getStorefrontThemeHistory.useQuery({ storeId: selectedStore?.id ?? 0 }, { enabled: Boolean(selectedStore), retry: false });
  const themeComparisonQuery = trpc.admin.studio.getStorefrontThemeComparison.useQuery({ storeId: selectedStore?.id ?? 0, snapshotId: comparisonSnapshotId ?? "none" }, { enabled: Boolean(selectedStore && comparisonSnapshotId), retry: false });

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

  const restoreThemeMutation = trpc.admin.studio.restoreStorefrontTheme.useMutation({
    onSuccess: async (_, input) => {
      toast.success("La version visuelle précédente a été restaurée. Le catalogue et le commerce restent inchangés.");
      await Promise.all([
        utils.admin.studio.getStorefrontThemeHistory.invalidate({ storeId: input.storeId }),
        utils.admin.studio.getOwnerPublicStorefrontContent.invalidate({ storeId: input.storeId }),
        utils.admin.studio.getPrivateStorefrontPreview.invalidate({ storeId: input.storeId }),
      ]);
      setLocation(`/admin/studio/contenu-public/${input.storeId}`);
    },
    onError: error => toast.error(error.message || "La restauration n’a pas pu être effectuée."),
  });

  const canConfirm = Boolean(selectedStore && acknowledged && confirmationName.trim() === selectedStore.displayName.trim());

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge>
              <Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">
                Thèmes Shopify Premium
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Thèmes & Chartes de boutiques</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Attribuez des thèmes Shopify Premium à vos boutiques clientes en fonction de leur formule d’abonnement SaaS (Free, Basic, Pro, VIP). Chaque univers installe une charte éditoriale et une structure visuelle haute conversion.
            </p>
          </div>
          <Link href="/admin/studio" className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio
          </Link>
        </header>

        <section className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-lg md:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">Catalogues & Formules d'Abonnement</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Débloquez des univers d'exception pour vos clients.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Les boutiques sur la formule FREE disposent d'un choix restreint. En montant vers la formule PRO ou VIP/Lifetime, débloquez les thèmes Shopify Premium avancés (Haute Joaillerie, Herboristerie, Cyber Gaming, Design Scandinave).
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-400/15 p-2.5 text-violet-200">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Gestion par Boutique</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">Ajustez la bibliothèque autorisée pour chaque marchand en 1 clic.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="theme-library-title">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Choisir le modèle</p>
              <h2 id="theme-library-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Bibliothèque disponible
              </h2>
            </div>
            <Badge variant="outline" className="w-fit border-slate-200 bg-white text-slate-700">
              {themes.length} thèmes prêts
            </Badge>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {themes.map(theme => {
              const selected = theme.id === selectedThemeId;
              return (
                <article
                  key={theme.id}
                  className={`overflow-hidden rounded-2xl border shadow-sm transition ${
                    selected ? "ring-2 ring-slate-950 ring-offset-2" : "hover:shadow-md"
                  } ${theme.palette.card}`}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => setSelectedThemeId(theme.id)}
                    aria-pressed={selected}
                  >
                    <div className="relative">
                      <img src={theme.visual} alt={theme.visualAlt} className="h-44 w-full object-cover" />
                      <Badge className="absolute left-3 top-3 border-0 bg-slate-950/80 text-white text-[10px] uppercase font-bold">
                        Thème Studio
                      </Badge>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.palette.label}`}>{theme.eyebrow}</p>
                          <h3 className={`mt-2 text-xl font-bold ${theme.palette.title}`}>{theme.label}</h3>
                        </div>
                        {selected && <Badge className={`border-0 ${theme.palette.badge}`}>Sélectionné</Badge>}
                      </div>
                      <p className={`mt-3 text-sm leading-6 ${theme.palette.text}`}>{theme.description}</p>
                      <ul className={`mt-4 space-y-2 text-xs leading-5 ${theme.palette.text}`}>
                        {theme.benefits.map(benefit => (
                          <li key={benefit} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,.88fr)]">
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-950 p-2.5 text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription>Appliquer à une boutique déjà enregistrée</CardDescription>
                  <CardTitle className="mt-1 text-2xl">Installer {selectedTheme.label}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <img src={selectedTheme.visual} alt="Aperçu du thème choisi" className="h-20 w-32 rounded-xl object-cover" />
                  <div>
                    <p className="font-semibold text-slate-950">{selectedTheme.label}</p>
                    <p className="mt-1 text-xs font-bold uppercase text-violet-700">Bibliothèque MAZIGHO Studio</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      L’installation prépare l’identité, l’accueil, le carrousel, le menu et les visuels de catégories. La boutique peut rester ouverte ou en préparation : son statut ne change pas.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme-store">Boutique concernée</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger id="theme-store" className="min-h-11">
                    <SelectValue placeholder={inventoryQuery.isLoading ? "Chargement des boutiques…" : "Choisir une boutique"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStores.map(store => (
                      <SelectItem key={store.id} value={String(store.id)}>
                        {store.displayName} · {statusLabels[store.status] ?? store.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableStores.length === 0 && !inventoryQuery.isLoading && (
                  <p className="text-sm leading-6 text-slate-600">Aucune boutique cliente disponible. Créez une préparation ci-dessous pour utiliser ce thème plus tard.</p>
                )}
              </div>

              {selectedStore && (
                <div className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-violet-950">Bibliothèque attribuée au propriétaire</p>
                      <p className="mt-1 text-xs leading-5 text-violet-900">
                        Choisissez exactement les thèmes visibles dans son panneau. Les packs par formule d’abonnement sont un raccourci modifiable.
                      </p>
                    </div>
                    <Badge className="border-0 bg-violet-700 text-white hover:bg-violet-700">
                      {assignedThemeIds.length || themeAccessQuery.data?.themeIds.length || 0} thème(s)
                    </Badge>
                  </div>
                  {themeAccessQuery.isLoading ? (
                    <div className="h-24 animate-pulse rounded-xl bg-violet-100" />
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {([5, 8, 14, 18] as const).map(count => (
                          <Button
                            key={count}
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100"
                            data-testid={`studio-theme-access-pack-${count}`}
                            onClick={() => setAssignedThemeIds(themes.slice(0, Math.min(count, themes.length)).map(theme => theme.id))}
                          >
                            {count} thèmes
                          </Button>
                        ))}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-violet-200 bg-white text-violet-900 hover:bg-violet-100"
                          data-testid="studio-theme-access-pack-all"
                          onClick={() => setAssignedThemeIds(themes.map(theme => theme.id))}
                        >
                          Tous les thèmes ({themes.length})
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {themes.map(theme => {
                          const checked = assignedThemeIds.includes(theme.id);
                          return (
                            <label
                              key={theme.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${
                                checked ? "border-violet-300 bg-white text-violet-950" : "border-violet-100 bg-white/60 text-slate-700"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={event =>
                                  setAssignedThemeIds(current =>
                                    event.target.checked ? [...current, theme.id] : current.filter(id => id !== theme.id)
                                  )
                                }
                                className="h-4 w-4 rounded border-violet-300 text-violet-700 focus:ring-violet-600"
                              />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{theme.label}</span>
                                <span className="block truncate text-xs opacity-75">
                                  {theme.eyebrow} · Thème Studio
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-violet-700 hover:bg-violet-800"
                        disabled={assignedThemeIds.length === 0 || saveThemeAccessMutation.isPending}
                        onClick={() => selectedStore && saveThemeAccessMutation.mutate({ storeId: selectedStore.id, themeIds: assignedThemeIds })}
                      >
                        {saveThemeAccessMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Enregistrer la bibliothèque
                      </Button>
                    </>
                  )}
                </div>
              )}
              <Button
                type="button"
                className="min-h-11 w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
                disabled={!selectedStore || applyThemeMutation.isPending}
                onClick={() => {
                  setConfirmationName("");
                  setAcknowledged(false);
                  setConfirmOpen(true);
                }}
              >
                <WandSparkles className="mr-2 h-4 w-4" /> Appliquer à cette boutique
              </Button>
              {selectedStore && (themeHistoryQuery.data?.length ?? 0) > 0 && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <History className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-amber-950">Versions visuelles sauvegardées</p>
                      <p className="mt-1 text-xs leading-5 text-amber-900">Chaque changement de thème conserve automatiquement l’état précédent de cette boutique. Restaurer ne modifie jamais le catalogue, les prix, les stocks ou le statut public.</p>
                      <div className="mt-3 space-y-2">
                        {[...(themeHistoryQuery.data ?? [])].reverse().slice(0, 5).map(snapshot => (
                          <div key={snapshot.id} className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0 text-sm text-amber-950">
                              <p className="font-medium">{themes.find(theme => theme.id === snapshot.themeId)?.label ?? "Version personnalisée"}</p>
                              <p className="text-xs text-amber-800">{new Date(snapshot.createdAt).toLocaleString("fr-FR")} · {snapshot.categoryCount} catégorie(s) concernée(s)</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" variant="outline" className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100" onClick={() => setComparisonSnapshotId(snapshot.id)}>
                                <Eye className="mr-2 h-4 w-4" /> Comparer
                              </Button>
                              <Button type="button" size="sm" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100" disabled={restoreThemeMutation.isPending} onClick={() => restoreThemeMutation.mutate({ storeId: selectedStore.id, snapshotId: snapshot.id, confirmationName: selectedStore.displayName })}>
                                {restoreThemeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />} Restaurer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/60">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-orange-100 p-2.5 text-orange-800">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <CardDescription className="text-orange-800">Nouvelle boutique</CardDescription>
                  <CardTitle className="mt-1 text-2xl text-orange-950">Partir de ce thème</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-orange-950">
                Le thème choisi sera prérempli dans le brouillon de préparation. Vous pourrez ensuite choisir le nom, le domaine, le propriétaire et la devise avant toute création réelle.
              </p>
              <Button
                type="button"
                className="mt-5 min-h-11 w-full bg-orange-700 hover:bg-orange-800"
                onClick={() => setLocation(`/admin/studio?theme=${selectedTheme.id}#studio-provisioning`)}
              >
                <Sparkles className="mr-2 h-4 w-4" /> Préparer une nouvelle boutique <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-3 text-xs leading-5 text-orange-900">
                Aucune boutique, invitation, e-mail, domaine public, abonnement ou paiement n’est créé à cette étape.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-sky-950">
          <div className="flex gap-3">
            <Eye className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <div>
              <p className="font-semibold">Après l’installation</p>
              <p className="mt-1">
                Vous êtes envoyé vers le contenu de la boutique pour ajuster les textes, images et bannières. Le menu reste modifiable, et le propriétaire garde la main sur son univers.
              </p>
            </div>
          </div>
        </section>

        <Dialog open={confirmOpen} onOpenChange={open => { if (!applyThemeMutation.isPending) setConfirmOpen(open); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <WandSparkles className="h-5 w-5 text-violet-700" /> Appliquer le thème à une boutique existante
              </DialogTitle>
              <DialogDescription>
                Cette action remplace les contenus visuels de départ de la boutique sélectionnée. Elle ne touche pas au catalogue, aux produits, aux prix, aux stocks, aux propriétaires ou au statut de la boutique.
              </DialogDescription>
            </DialogHeader>
            {selectedStore && (
              <div className="space-y-4">
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950">
                  <p><strong>Boutique :</strong> {selectedStore.displayName}</p>
                  <p className="mt-1"><strong>Thème :</strong> {selectedTheme.label}</p>
                  <p className="mt-1"><strong>Statut conservé :</strong> {statusLabels[selectedStore.status] ?? selectedStore.status}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme-confirm-name">Recopiez le nom de la boutique</Label>
                  <Input id="theme-confirm-name" value={confirmationName} onChange={event => setConfirmationName(event.target.value)} placeholder={selectedStore.displayName} />
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={event => setAcknowledged(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600"
                  />
                  <span>Je confirme remplacer les contenus visuels de départ de cette boutique par le thème sélectionné. Je pourrai ensuite les modifier, les remplacer ou les masquer.</span>
                </label>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={applyThemeMutation.isPending} onClick={() => setConfirmOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                className={selectedTheme.palette.button}
                disabled={!canConfirm || applyThemeMutation.isPending}
                onClick={() => selectedStore && applyThemeMutation.mutate({ storeId: selectedStore.id, themeId: selectedTheme.id })}
              >
                {applyThemeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
                Appliquer le thème
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(comparisonSnapshotId)} onOpenChange={open => { if (!open) setComparisonSnapshotId(null); }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-violet-700" /> Comparaison avant / après</DialogTitle>
              <DialogDescription>Comparez l’univers actuellement actif avec la version sauvegardée avant de demander sa restauration. Aucun changement n’est effectué ici.</DialogDescription>
            </DialogHeader>
            {themeComparisonQuery.isLoading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> : themeComparisonQuery.data && (() => {
              const before = themes.find(theme => theme.id === themeComparisonQuery.data?.currentThemeId) ?? themes[0];
              const after = themes.find(theme => theme.id === themeComparisonQuery.data?.snapshot.themeId) ?? themes[0];
              return <div className="grid gap-4 md:grid-cols-2">
                <ThemePreviewFrame theme={before} label="Avant — actuellement actif" />
                <ThemePreviewFrame theme={after} label="Après — version sauvegardée" />
              </div>;
            })()}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComparisonSnapshotId(null)}>Fermer</Button>
              <Button type="button" className="bg-amber-700 text-white hover:bg-amber-800" disabled={!selectedStore || !comparisonSnapshotId || restoreThemeMutation.isPending} onClick={() => { if (selectedStore && comparisonSnapshotId) { restoreThemeMutation.mutate({ storeId: selectedStore.id, snapshotId: comparisonSnapshotId, confirmationName: selectedStore.displayName }); setComparisonSnapshotId(null); } }}><RotateCcw className="mr-2 h-4 w-4" /> Restaurer cette version</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </DashboardLayout>
  );
}
