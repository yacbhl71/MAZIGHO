import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Copy, FileStack, Image, Layers3, Loader2, LockKeyhole, Package, Palette, ShieldCheck, Store, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type CopyScope = "storefrontStyle" | "navigation" | "collections" | "pages" | "categories" | "products" | "productMedia" | "variants";
type CopySelection = Record<CopyScope, boolean>;
type Currency = "CHF" | "EUR" | "USD" | "GBP" | "DZD";
type Template = "standard" | "algeria";

type StoreCopySource = {
  id: number;
  displayName: string;
  primaryDomain: string;
  status: "setup" | "active" | "limited";
  categoryCount: number;
  productCount: number;
  activeProductCount: number;
};

const defaultSelection: CopySelection = {
  storefrontStyle: true,
  navigation: true,
  collections: false,
  pages: false,
  categories: false,
  products: false,
  productMedia: false,
  variants: false,
};

const scopeContent: Record<CopyScope, { title: string; text: string; icon: typeof Palette }> = {
  storefrontStyle: { title: "Style storefront", text: "Palette, typographies et disposition. Logo, identité, textes, bannières, images et URLs externes restent dans la source.", icon: Palette },
  navigation: { title: "Navigation", text: "Libellés et destinations internes du menu ; les liens externes ne sont jamais repris.", icon: Layers3 },
  collections: { title: "Collections privées", text: "Plans de collections du créateur, sans publication automatique.", icon: FileStack },
  pages: { title: "Pages privées", text: "Brouillons de pages à vérifier dans la nouvelle boutique ; leurs images demandent aussi l’option médias.", icon: FileStack },
  categories: { title: "Catégories", text: "Structure et contenus des catégories ; les visuels demandent l’option médias.", icon: Layers3 },
  products: { title: "Produits", text: "Fiches, prix, stock, descriptions et options. Fournisseurs, coûts et liens fournisseur restent exclus.", icon: Package },
  productMedia: { title: "Images catalogue", text: "Références de visuels associés aux produits et catégories ; aucun octet d’archive n’est stocké en base.", icon: Image },
  variants: { title: "Variantes", text: "Libellés, SKU, prix et stock par variante ; aucun mapping fournisseur.", icon: Copy },
};

function toggleSelection(current: CopySelection, scope: CopyScope, checked: boolean): CopySelection {
  const next = { ...current, [scope]: checked };
  if ((scope === "productMedia" || scope === "variants") && checked) {
    next.products = true;
    next.categories = true;
  }
  if (scope === "products" && !checked) {
    next.productMedia = false;
    next.variants = false;
  }
  return next;
}

export default function AdminStudioStoreCopy() {
  const utils = trpc.useUtils();
  const [sourceStoreId, setSourceStoreId] = useState("");
  const [selection, setSelection] = useState<CopySelection>(defaultSelection);
  const [displayName, setDisplayName] = useState("");
  const [requestedDomain, setRequestedDomain] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [template, setTemplate] = useState<Template>("standard");
  const [currency, setCurrency] = useState<Currency>("CHF");
  const [acknowledged, setAcknowledged] = useState(false);
  const [preparedDraft, setPreparedDraft] = useState<{ id: number; sourceStoreId: number } | null>(null);

  const sourcesQuery = trpc.admin.studio.getStoreCopySources.useQuery(undefined, { refetchOnWindowFocus: false });
  const sourcePreviewQuery = trpc.admin.studio.getStoreCopySourcePreview.useQuery(
    { sourceStoreId: Number(sourceStoreId) || 0 },
    { enabled: Boolean(sourceStoreId), refetchOnWindowFocus: false, retry: false },
  );
  const sources = useMemo(() => (sourcesQuery.data ?? []) as StoreCopySource[], [sourcesQuery.data]);
  const selectedScopes = (Object.keys(selection) as CopyScope[]).filter(scope => selection[scope]);
  const canPrepare = Boolean(
    sourcePreviewQuery.data
    && selectedScopes.length
    && displayName.trim().length >= 2
    && requestedDomain.trim().length >= 3
    && ownerName.trim().length >= 2
    && ownerEmail.includes("@")
    && acknowledged,
  );

  const createDraft = trpc.admin.studio.createStoreCopyProvisioningDraft.useMutation({
    onSuccess: async draft => {
      setPreparedDraft({ id: draft.id, sourceStoreId: draft.sourceStoreId });
      await Promise.all([
        utils.admin.studio.getProvisioningDrafts.invalidate(),
        utils.admin.studio.getStoreCopySources.invalidate(),
      ]);
      toast.success("Brouillon de copie contrôlée prêt", { description: "Aucune boutique, domaine, e-mail, paiement ou publication n’a encore été créé." });
    },
    onError: error => toast.error("Préparation impossible", { description: error.message || "Vérifiez la source, le périmètre et les informations de destination." }),
  });

  const submit = () => {
    if (!canPrepare || createDraft.isPending) return;
    createDraft.mutate({
      displayName,
      requestedDomain,
      ownerName,
      ownerEmail,
      businessType: "autre",
      customBusinessTheme: "Copie contrôlée à personnaliser",
      factoryModel: "blank",
      provisioningTemplate: template,
      preferredCurrency: template === "algeria" ? "DZD" : currency,
      copySourceStoreId: Number(sourceStoreId),
      copySelection: selection,
      notes: "Création préparée depuis une boutique existante via le périmètre de copie contrôlée Studio.",
    });
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/admin/studio" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Retour au Studio</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Création isolée</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Depuis une boutique existante</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Préparez une nouvelle boutique <code>setup</code> indépendante. La source reste inchangée ; aucune publication, domaine, accès, e-mail, paiement ou donnée client n’est créé par ce parcours.</p>
          </div>
          <Badge variant="outline" className="w-fit border-violet-200 bg-violet-50 text-violet-900"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Copie bornée & traçable</Badge>
        </div>

        {preparedDraft ? <Card className="border-emerald-200 bg-emerald-50/70">
          <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-950"><CheckCircle2 className="h-5 w-5 text-emerald-700" /> Brouillon de copie #{preparedDraft.id} prêt</CardTitle><CardDescription className="text-emerald-900">La boutique n’existe pas encore. Ouvrez le prévol Studio, vérifiez les conflits puis recopiez le nom pour créer la destination séparée en <code>setup</code>.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-3"><Button asChild className="bg-emerald-700 hover:bg-emerald-800"><Link href="/admin/studio#studio-provisioning">Ouvrir le prévol Studio <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button variant="outline" onClick={() => setPreparedDraft(null)}>Préparer une autre copie</Button></CardContent>
        </Card> : <>
          <section className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
            <Card className="border-violet-200 shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-violet-700" /> 1. Choisir la source</CardTitle><CardDescription>Seules les boutiques clientes en <code>setup</code>, actives ou limitées sont proposées. MAZIGHO principal, boutiques suspendues et clôturées sont exclus.</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="studio-copy-source">Boutique source</Label><Select value={sourceStoreId} onValueChange={value => { setSourceStoreId(value); setAcknowledged(false); }}><SelectTrigger id="studio-copy-source" className="min-h-11"><SelectValue placeholder={sourcesQuery.isLoading ? "Chargement des boutiques…" : "Choisir une boutique"} /></SelectTrigger><SelectContent>{sources.map(store => <SelectItem key={store.id} value={String(store.id)}>{store.displayName} · {store.primaryDomain}</SelectItem>)}</SelectContent></Select></div>
                {sourcesQuery.isError ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900">La liste des boutiques ne peut pas être lue pour le moment. Aucun accès ni contenu n’a été modifié.</div> : null}
                {sourcePreviewQuery.isLoading ? <div className="h-32 animate-pulse rounded-xl bg-slate-100" /> : sourcePreviewQuery.data ? <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-violet-950">{sourcePreviewQuery.data.source.displayName}</p><p className="mt-1 text-xs text-violet-800">{sourcePreviewQuery.data.source.primaryDomain} · état {sourcePreviewQuery.data.source.status}</p></div><Badge variant="outline" className="border-violet-200 bg-white text-violet-900">Lecture seule</Badge></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Catégories</p><p className="mt-1 font-bold text-slate-950">{sourcePreviewQuery.data.summary.categories}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Produits</p><p className="mt-1 font-bold text-slate-950">{sourcePreviewQuery.data.summary.products}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Images</p><p className="mt-1 font-bold text-slate-950">{sourcePreviewQuery.data.summary.images}</p></div><div className="rounded-xl bg-white p-3"><p className="text-xs text-slate-500">Variantes</p><p className="mt-1 font-bold text-slate-950">{sourcePreviewQuery.data.summary.variants}</p></div></div><p className="mt-3 text-xs leading-5 text-violet-900">{sourcePreviewQuery.data.summary.banners} bannière(s) détectée(s), mais les bannières, l’identité et les textes de marque ne font jamais partie de la copie.</p></div> : null}
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-slate-50/70 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><LockKeyhole className="h-5 w-5 text-slate-700" /> Frontière non négociable</CardTitle><CardDescription>La copie n’ouvre jamais un accès entre deux tenants.</CardDescription></CardHeader><CardContent><ul className="space-y-3 text-sm leading-6 text-slate-700"><li className="flex gap-2"><UsersRound className="mt-1 h-4 w-4 shrink-0 text-slate-500" /><span><strong>Jamais :</strong> utilisateurs, memberships, propriétaires, clients, PII, paniers, favoris ou avis privés.</span></li><li className="flex gap-2"><CircleAlert className="mt-1 h-4 w-4 shrink-0 text-slate-500" /><span><strong>Jamais :</strong> commandes, retours, paiements, Stripe, Lemon Squeezy, domaines, DNS, e-mails, mots de passe, clés ou secrets.</span></li><li className="flex gap-2"><Package className="mt-1 h-4 w-4 shrink-0 text-slate-500" /><span><strong>Jamais :</strong> fournisseurs, dropshipping, coûts, liens et mappings fournisseur, plans, commissions, quotas, fiscalité ou livraison.</span></li></ul></CardContent></Card>
          </section>

          <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Copy className="h-5 w-5 text-violet-700" /> 2. Définir exactement le périmètre</CardTitle><CardDescription>Le style et la navigation sont précochés. Le catalogue, les médias et les variantes ne sont repris que sur choix explicite.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{(Object.keys(scopeContent) as CopyScope[]).map(scope => { const content = scopeContent[scope]; const Icon = content.icon; const forced = (scope === "categories" && selection.products) || ((scope === "products") && (selection.productMedia || selection.variants)); return <label key={scope} className={`flex gap-3 rounded-2xl border p-4 ${selection[scope] ? "border-violet-300 bg-violet-50/70" : "border-slate-200 bg-white"} ${forced ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}><input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-600" checked={selection[scope]} disabled={forced} onChange={event => setSelection(current => toggleSelection(current, scope, event.target.checked))} /><span className="min-w-0"><span className="flex items-center gap-2 font-semibold text-slate-950"><Icon className="h-4 w-4 text-violet-700" />{content.title}{forced ? <Badge variant="outline" className="border-violet-200 bg-white text-violet-800">requis</Badge> : null}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{content.text}</span></span></label>; })}</div><p className="mt-4 text-xs leading-5 text-slate-600">Les produits supplémentaires au-delà de la protection FREE sont conservés en brouillon dans la destination : aucun plafond, plan ou dérogation n’est copié ni contourné.</p></CardContent></Card>

          <Card className="border-amber-200 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-amber-700" /> 3. Préparer la nouvelle boutique</CardTitle><CardDescription>Cette étape crée uniquement un brouillon de mise en service. Le prévol et la confirmation du nom restent obligatoires avant la création réelle.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="studio-copy-name">Nom de la nouvelle boutique</Label><Input id="studio-copy-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Ex. Atelier Lune" /></div><div className="space-y-2"><Label htmlFor="studio-copy-domain">Domaine souhaité</Label><Input id="studio-copy-domain" value={requestedDomain} onChange={event => setRequestedDomain(event.target.value)} placeholder="atelier-lune.mazigho.ch" autoCapitalize="none" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="studio-copy-owner">Nom du futur propriétaire</Label><Input id="studio-copy-owner" value={ownerName} onChange={event => setOwnerName(event.target.value)} placeholder="Nom et prénom" /></div><div className="space-y-2"><Label htmlFor="studio-copy-email">E-mail du futur propriétaire</Label><Input id="studio-copy-email" value={ownerEmail} onChange={event => setOwnerEmail(event.target.value)} type="email" placeholder="proprietaire@exemple.ch" autoCapitalize="none" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Base de marché</Label><Select value={template} onValueChange={value => { const next = value as Template; setTemplate(next); if (next === "algeria") setCurrency("DZD"); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="standard">Boutique standard</SelectItem><SelectItem value="algeria">Boutique Algérie — DZD & COD à préparer</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Devise de départ</Label><Select value={currency} onValueChange={value => setCurrency(value as Currency)} disabled={template === "algeria"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CHF">CHF — Franc suisse</SelectItem><SelectItem value="EUR">EUR — Euro</SelectItem><SelectItem value="USD">USD — Dollar US</SelectItem><SelectItem value="GBP">GBP — Livre sterling</SelectItem><SelectItem value="DZD">DZD — Dinar algérien</SelectItem></SelectContent></Select></div></div><label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-700 focus:ring-amber-600" /><span>Je confirme préparer une <strong>nouvelle</strong> boutique séparée à partir de la source choisie, uniquement selon les éléments cochés. Je comprends qu’elle restera en <code>setup</code>, non publique, sans domaine actif, paiement, e-mail, fournisseur, publication ou transfert d’accès.</span></label><div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5"><p className="text-xs leading-5 text-slate-600">{selectedScopes.length} périmètre{selectedScopes.length > 1 ? "s" : ""} sélectionné{selectedScopes.length > 1 ? "s" : ""} · aucune création effective à cette étape.</p><Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!canPrepare || createDraft.isPending} onClick={submit}>{createDraft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Préparer le brouillon</Button></div></CardContent></Card>
        </>}
      </main>
    </DashboardLayout>
  );
}
