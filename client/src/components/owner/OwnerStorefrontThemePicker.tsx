import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, LockKeyhole, Loader2, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { isPremiumStorefrontTheme, storefrontThemeCatalog, type StorefrontThemeCatalogItem, type StorefrontThemeId } from "@shared/storefrontThemeCatalog";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OwnerStorefrontThemePicker({
  storeName,
  onApplied,
}: {
  storeName: string;
  onApplied: (profile: unknown) => void;
}) {
  const [selectedThemeId, setSelectedThemeId] = useState<StorefrontThemeId>("violetCraft");
  const themeAccessQuery = trpc.owner.getStorefrontThemeAccess.useQuery(undefined, { refetchOnWindowFocus: false });
  const availableThemes = useMemo(() => {
    const ids = themeAccessQuery.data?.themeIds;
    return ids ? storefrontThemeCatalog.filter(theme => ids.includes(theme.id)) : [];
  }, [themeAccessQuery.data?.themeIds]);
  useEffect(() => {
    if (availableThemes.length > 0 && !availableThemes.some(theme => theme.id === selectedThemeId)) setSelectedThemeId(availableThemes[0]!.id);
  }, [availableThemes, selectedThemeId]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<StorefrontThemeCatalogItem | null>(null);
  const [confirmationName, setConfirmationName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const lockedThemes = useMemo(() => storefrontThemeCatalog.filter(theme => !availableThemes.some(available => available.id === theme.id)), [availableThemes]);
  const selectedTheme = useMemo(
    () => availableThemes.find(theme => theme.id === selectedThemeId) ?? availableThemes[0],
    [availableThemes, selectedThemeId],
  );
  const applyTheme = trpc.owner.applyStorefrontTheme.useMutation({
    onSuccess: result => {
      onApplied(result.profile);
      toast.success(`L’univers « ${selectedTheme.label} » est prêt. Vous pouvez maintenant modifier chaque élément.`);
      setConfirmOpen(false);
      setAcknowledged(false);
      setConfirmationName("");
    },
    onError: error => toast.error(error.message || "Le thème n’a pas pu être appliqué."),
  });
  const canConfirm = acknowledged && confirmationName.trim() === storeName.trim();

  if (themeAccessQuery.isLoading) return <section className="space-y-5"><div className="h-56 animate-pulse rounded-2xl bg-slate-100" /></section>;
  if (themeAccessQuery.isError || !selectedTheme) return <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm leading-6 text-rose-950">La bibliothèque de thèmes attribuée à cette boutique est indisponible. Réessayez plus tard ou demandez à MAZIGHO Studio de vérifier l’attribution.</section>;

  return <section className="space-y-5">
    <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white shadow-sm">
      <CardHeader className="pb-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-xl text-white"><Sparkles className="h-5 w-5 text-amber-300" /> Thèmes de votre boutique</CardTitle><CardDescription className="mt-2 max-w-3xl text-slate-300">Choisissez un univers de départ fort. Il prépare les couleurs, la mise en page, le menu, les textes, le carrousel et les images de catégories — puis tout reste éditable, remplaçable ou masquable.</CardDescription></div><Badge className="w-fit border-0 bg-white/10 text-white hover:bg-white/10">{availableThemes.length} univers attribué{availableThemes.length > 1 ? "s" : ""}</Badge></div></CardHeader>
      <CardContent><div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 text-xs leading-5 text-slate-200">Le thème ne modifie jamais vos produits, prix, stocks, commandes, membres, domaine ou statut public. Les visuels de catégories existants peuvent être remplacés afin de créer un ensemble cohérent.</div></CardContent>
    </Card>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {availableThemes.map(theme => {
        const selected = theme.id === selectedThemeId;
        return <article key={theme.id} className={`overflow-hidden rounded-2xl border shadow-sm transition ${selected ? "ring-2 ring-slate-950 ring-offset-2" : "hover:-translate-y-0.5 hover:shadow-md"} ${theme.palette.card}`}>
          <button type="button" onClick={() => setSelectedThemeId(theme.id)} aria-pressed={selected} className="block w-full text-left focus:outline-none">
            <div className="relative"><img src={theme.visual} alt={theme.visualAlt} className="h-44 w-full object-cover" loading="lazy" /><div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />{selected && <Badge className={`absolute right-3 top-3 border-0 shadow-sm ${theme.palette.badge}`}>Sélectionné</Badge>}</div>
            <div className="p-5"><p className={`text-[11px] font-bold uppercase tracking-[0.15em] ${theme.palette.label}`}>{theme.eyebrow}</p><h3 className={`mt-2 text-xl font-bold ${theme.palette.title}`}>{theme.label}</h3><p className={`mt-3 text-sm leading-6 ${theme.palette.text}`}>{theme.description}</p><ul className={`mt-4 space-y-1.5 text-xs leading-5 ${theme.palette.text}`}>{theme.benefits.map(benefit => <li key={benefit} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{benefit}</li>)}</ul></div>
          </button>
        </article>;
      })}
    </div>

    {lockedThemes.length > 0 && <section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Aperçus verrouillés</p><h3 className="mt-1 text-xl font-bold text-slate-950">Thèmes à ajouter à votre bibliothèque</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Consultez un aperçu statique de l’accueil. Un thème non attribué ne peut pas être appliqué : son activation doit être demandée à MAZIGHO Studio.</p></div><Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900"><LockKeyhole className="mr-1 h-3.5 w-3.5" />{lockedThemes.length} verrouillé(s)</Badge></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{lockedThemes.map(theme => <article key={theme.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setPreviewTheme(theme)} className="block w-full text-left"><div className="relative"><img src={theme.visual} alt={theme.visualAlt} className="h-40 w-full object-cover grayscale-[0.18]" loading="lazy" /><div className="absolute inset-0 bg-slate-950/35" /><Badge className="absolute right-3 top-3 border-0 bg-slate-950/90 text-white hover:bg-slate-950/90"><LockKeyhole className="mr-1 h-3.5 w-3.5" />{isPremiumStorefrontTheme(theme.id) ? "Premium · à venir" : "Non inclus"}</Badge></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{theme.eyebrow}</p><h4 className="mt-2 text-lg font-bold text-slate-950">{theme.label}</h4><span className="mt-4 inline-flex items-center text-sm font-semibold text-violet-700"><Eye className="mr-2 h-4 w-4" /> Voir l’aperçu</span></div></button></article>)}</div></section>}

    <Card className={`border-2 ${selectedTheme.palette.card}`}><CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 gap-4"><img src={selectedTheme.visual} alt="Aperçu du thème choisi" className="h-20 w-28 shrink-0 rounded-xl object-cover shadow-sm" /><div><p className={`text-xs font-bold uppercase tracking-[0.14em] ${selectedTheme.palette.label}`}>Thème sélectionné</p><p className={`mt-1 text-lg font-bold ${selectedTheme.palette.title}`}>{selectedTheme.label}</p><p className={`mt-1 text-sm leading-6 ${selectedTheme.palette.text}`}>Prêt à donner une vraie direction visuelle à votre vitrine, sans verrouiller aucun élément.</p></div></div><Button type="button" className={`min-h-11 shrink-0 ${selectedTheme.palette.button}`} onClick={() => { setConfirmationName(""); setAcknowledged(false); setConfirmOpen(true); }}><WandSparkles className="mr-2 h-4 w-4" /> Utiliser ce thème</Button></CardContent></Card>

    <Dialog open={previewTheme !== null} onOpenChange={open => { if (!open) setPreviewTheme(null); }}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-violet-700" /> Aperçu statique de l’accueil</DialogTitle><DialogDescription>{previewTheme ? `« ${previewTheme.label} » est visible mais non attribué à votre boutique.` : ""}</DialogDescription></DialogHeader>{previewTheme && <><div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"><div className="relative h-64"><img src={previewTheme.visual} alt={previewTheme.visualAlt} className="h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" /><div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/20 px-5 py-4 text-xs font-semibold text-white"><span>{storeName}</span><span>Accueil · Collections · Contact</span></div><div className="absolute inset-x-5 bottom-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">Aperçu de thème</p><p className="mt-2 text-3xl font-bold">{previewTheme.label}</p><p className="mt-2 max-w-xl text-sm leading-6 text-white/85">{previewTheme.description}</p></div></div><div className="grid gap-3 p-5 sm:grid-cols-3">{previewTheme.benefits.map(benefit => <div key={benefit} className="rounded-xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-5 text-slate-200">{benefit}</div>)}</div></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Thème verrouillé : il ne sera jamais appliqué sans attribution explicite.</p><p className="mt-1">L’activation payante est préparée mais le paiement reste volontairement désactivé tant que le parcours commercial Stripe n’est pas ouvert.</p></div><DialogFooter><Button type="button" onClick={() => { toast.info("Demande d’activation à transmettre à MAZIGHO Studio. Aucun paiement ni changement de thème n’a été effectué."); setPreviewTheme(null); }}><LockKeyhole className="mr-2 h-4 w-4" /> Demander l’activation</Button><Button type="button" variant="outline" onClick={() => setPreviewTheme(null)}>Fermer</Button></DialogFooter></>}</DialogContent></Dialog>

    <Dialog open={confirmOpen} onOpenChange={open => { if (!applyTheme.isPending) setConfirmOpen(open); }}>
      <DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><WandSparkles className="h-5 w-5 text-violet-700" /> Installer un univers visuel</DialogTitle><DialogDescription>Cette action remplace les contenus de départ de votre vitrine par « {selectedTheme.label} ». Chaque élément pourra ensuite être personnalisé, remplacé ou masqué.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950"><p><strong>Boutique :</strong> {storeName}</p><p className="mt-1"><strong>Thème :</strong> {selectedTheme.label}</p><p className="mt-2 text-xs">Le catalogue, les prix, le stock, les commandes, les accès, le domaine et le statut public ne changent pas.</p></div><div className="space-y-2"><Label htmlFor="owner-theme-confirm-name">Recopiez le nom de votre boutique</Label><Input id="owner-theme-confirm-name" value={confirmationName} onChange={event => setConfirmationName(event.target.value)} placeholder={storeName} autoCapitalize="words" /></div><label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" /><span>Je confirme remplacer les contenus visuels de départ. Je garde la main pour modifier, remplacer ou masquer chaque élément ensuite.</span></label></div><DialogFooter><Button type="button" variant="outline" disabled={applyTheme.isPending} onClick={() => setConfirmOpen(false)}>Annuler</Button><Button type="button" disabled={!canConfirm || applyTheme.isPending} className={selectedTheme.palette.button} onClick={() => applyTheme.mutate({ themeId: selectedTheme.id })}>{applyTheme.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}{applyTheme.isPending ? "Installation…" : "Installer le thème"}</Button></DialogFooter></DialogContent>
    </Dialog>
  </section>;
}
