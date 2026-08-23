import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Loader2,
  PackageSearch,
  ShieldCheck,
  Store,
  Search,
  MapPin,
  Workflow,
  ClipboardPenLine,
  ImagePlus,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const providerCards = [
  {
    name: "CJdropshipping",
    priority: "Priorité 1",
    tone: "emerald",
    state: "À préparer",
    description: "Le premier fournisseur à connecter : catalogue, produits et traitement des commandes pourront être reliés après l’autorisation officielle.",
    benefits: ["Catalogue et sourcing", "Synchronisation prévue", "Traitement fournisseur après validation"],
    href: "https://cjdropshipping.com/",
    action: "Ouvrir CJdropshipping",
  },
  {
    name: "AliExpress",
    priority: "Priorité 2",
    tone: "orange",
    state: "Après CJdropshipping",
    description: "Connexion prévue via l’Open Platform officielle, avec autorisation sécurisée et validation manuelle de chaque produit.",
    benefits: ["Import depuis le catalogue", "Prix et variantes à contrôler", "Aucune commande automatique"],
    href: "https://openservice.aliexpress.com/",
    action: "Voir la plateforme AliExpress",
  },
];

function ProviderCard({ provider }: { provider: typeof providerCards[number] }) {
  const isCj = provider.tone === "emerald";
  const palette = isCj
    ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
    : "border-orange-200 bg-orange-50/60 text-orange-700";
  const button = isCj ? "bg-emerald-600 hover:bg-emerald-700" : "bg-orange-500 hover:bg-orange-600";

  return (
    <Card className={`overflow-hidden border shadow-sm ${isCj ? "border-emerald-100" : "border-orange-100"}`}>
      <CardHeader className="border-b bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className={`${palette} border px-2.5 py-1 hover:${palette}`}>{provider.priority}</Badge>
              <span className="text-xs font-medium text-slate-500">{provider.state}</span>
            </div>
            <CardTitle className="text-xl text-slate-950">{provider.name}</CardTitle>
          </div>
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${isCj ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
            <Boxes className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="min-h-[72px] text-sm leading-6 text-slate-600">{provider.description}</p>
        <div className="space-y-2.5">
          {provider.benefits.map(benefit => <div key={benefit} className="flex items-center gap-2 text-sm text-slate-700"><BadgeCheck className={`h-4 w-4 shrink-0 ${isCj ? "text-emerald-600" : "text-orange-600"}`} /> {benefit}</div>)}
        </div>
        <a href={provider.href} target="_blank" rel="noreferrer" className="block">
          <Button className={`w-full text-white ${button}`}><ExternalLink className="mr-2 h-4 w-4" /> {provider.action}</Button>
        </a>
      </CardContent>
    </Card>
  );
}

export default function AdminSuppliers() {
  const utils = trpc.useUtils();
  const cjStatusQuery = trpc.admin.suppliers.cjStatus.useQuery();
  const verifyCj = trpc.admin.suppliers.verifyCj.useMutation({
    onSuccess: async (result) => {
      await utils.admin.suppliers.cjStatus.invalidate();
      result.verified ? toast.success("Connexion CJdropshipping vérifiée.") : toast.error(result.message);
    },
    onError: () => toast.error("La vérification CJdropshipping a échoué. Réessayez plus tard."),
  });
  const cjStatus = cjStatusQuery.data;
  const [cjKeyword, setCjKeyword] = useState("");
  const [cjCountry, setCjCountry] = useState("CH");
  const searchCj = trpc.admin.suppliers.searchCj.useMutation({
    onError: (error) => toast.error(error.message || "La recherche CJ a échoué."),
  });
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const searchCjByImage = trpc.admin.suppliers.searchCjByImage.useMutation({
    onError: (error) => toast.error(error.message || "La recherche à partir de l’image a échoué."),
  });

  const submitCjSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (cjKeyword.trim().length < 2) {
      toast.error("Saisissez au moins 2 caractères pour rechercher un produit.");
      return;
    }
    searchCj.mutate({ keyword: cjKeyword.trim(), countryCode: cjCountry || undefined });
  };

  const selectPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type)) {
      toast.error("Choisissez une image JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("L’image doit faire au maximum 4 Mo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
        setPhotoName(file.name);
      }
    };
    reader.onerror = () => toast.error("Impossible de lire cette image.");
    reader.readAsDataURL(file);
  };

  const submitImageSearch = () => {
    if (!photoDataUrl) {
      toast.error("Ajoutez d’abord une photo de référence.");
      return;
    }
    searchCjByImage.mutate({ imageDataUrl: photoDataUrl, countryCode: cjCountry || undefined });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><Workflow className="h-4 w-4" /> Hub fournisseurs</div>
              <h1 className="max-w-2xl font-serif text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Vos sources produits, sans perdre le contrôle.</h1>
              <p className="mt-3 max-w-2xl leading-7 text-slate-600">MAZIGHO centralise les futurs canaux fournisseurs. Vous gardez toujours la main sur le choix du produit, la marge, le prix de vente et la publication.</p>
            </div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-sky-600 text-white shadow-lg shadow-sky-200 md:mx-0"><Globe2 className="h-12 w-12" /></div>
          </div>
          <div className="flex items-start gap-3 border-t border-sky-100 bg-white/70 px-6 py-4 text-sm text-slate-700 md:px-8"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><span><strong>Protection active :</strong> aucun produit n’est publié et aucune commande fournisseur n’est envoyée sans votre validation explicite.</span></div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cjStatus?.verified ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-950">Connexion CJdropshipping</h2><Badge className={cjStatus?.verified ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{cjStatus?.verified ? "Vérifiée" : cjStatus?.configured ? "À vérifier" : "En attente de clé"}</Badge></div>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{cjStatusQuery.isLoading ? "Lecture de l’état de connexion…" : (cjStatus?.message || "État de connexion indisponible.")}</p>
              </div>
            </div>
            {cjStatus?.configured ? <Button onClick={() => verifyCj.mutate()} disabled={verifyCj.isPending} className="bg-emerald-600 text-white hover:bg-emerald-700">{verifyCj.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Vérifier la connexion</Button> : <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">La clé sera ajoutée plus tard dans les variables sécurisées Vercel, jamais dans ce formulaire.</div>}
          </div>
        </section>

        <section className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-sky-700"><PackageSearch className="h-4 w-4" /> Catalogue CJ — aperçu</div>
              <h2 className="text-xl font-semibold text-slate-950">Rechercher avant de choisir</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Cette recherche lit uniquement le catalogue officiel CJ. Aucun produit n’est importé, publié ou commandé à cette étape.</p>
            </div>
            <Badge variant="secondary" className="w-fit bg-white text-slate-700">Résultats limités à 12 produits</Badge>
          </div>
          <form onSubmit={submitCjSearch} className="mt-5 grid gap-3 md:grid-cols-[1fr_150px_auto]">
            <label className="block">
              <span className="sr-only">Mot-clé CJ</span>
              <input value={cjKeyword} onChange={event => setCjKeyword(event.target.value)} placeholder="Ex. lampe de bureau, accessoire fitness…" className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-sky-500" />
            </label>
            <label className="block">
              <span className="sr-only">Pays d’entrepôt</span>
              <select value={cjCountry} onChange={event => setCjCountry(event.target.value)} className="h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                <option value="CH">Suisse (CH)</option>
                <option value="FR">France (FR)</option>
                <option value="DE">Allemagne (DE)</option>
                <option value="">Tous entrepôts</option>
              </select>
            </label>
            <Button type="submit" disabled={!cjStatus?.configured || searchCj.isPending} className="h-11 bg-sky-600 text-white hover:bg-sky-700">{searchCj.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Rechercher</Button>
          </form>
          {!cjStatus?.configured && <p className="mt-3 text-xs text-slate-500">Configurez et vérifiez d’abord la clé CJ dans le bloc situé au-dessus.</p>}

          <div className="mt-5 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-semibold text-violet-800"><ImagePlus className="h-4 w-4" /> Rechercher à partir d’une photo</div><p className="mt-1 max-w-2xl text-xs leading-5 text-violet-900/80">Ajoutez une photo de référence : MAZIGHO en déduit un mot-clé générique, puis interroge le catalogue CJ officiel. Elle est transmise une seule fois au service d’analyse, mais n’est ni enregistrée dans le catalogue ni publiée. N’ajoutez pas de photo personnelle.</p></div><Badge variant="secondary" className="bg-white text-violet-800">JPG, PNG ou WebP · 4 Mo max.</Badge></div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-medium text-violet-900 hover:bg-violet-100"><ImagePlus className="h-4 w-4" /> {photoName || "Choisir une photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} className="sr-only" /></label>
              <Button type="button" onClick={submitImageSearch} disabled={!cjStatus?.configured || !photoDataUrl || searchCjByImage.isPending} className="h-11 bg-violet-600 text-white hover:bg-violet-700">{searchCjByImage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Trouver des produits similaires</Button>
            </div>
            {photoDataUrl && <div className="mt-4 flex items-center gap-3 rounded-lg border border-violet-100 bg-white p-2"><img src={photoDataUrl} alt="Photo de référence" className="h-16 w-16 rounded-md border bg-slate-50 object-contain p-1" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{photoName}</p><p className="text-xs text-slate-500">Photo prête pour une seule analyse à votre demande.</p></div><Button type="button" variant="ghost" size="icon" aria-label="Retirer la photo" onClick={() => { setPhotoDataUrl(null); setPhotoName(""); searchCjByImage.reset(); }}><X className="h-4 w-4" /></Button></div>}
          </div>

          {searchCj.data && (
            <div className="mt-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-600"><strong className="text-slate-900">{searchCj.data.total.toLocaleString("fr-CH")}</strong> résultats possibles pour « {searchCj.data.keyword} »</p><p className="text-xs text-slate-500">Prix fournisseur indicatif en USD — expédition à confirmer.</p></div>
              {searchCj.data.products.length === 0 ? <div className="rounded-xl border border-dashed border-sky-200 bg-white p-6 text-sm text-slate-600">Aucun produit n’a été renvoyé avec ces critères. Essayez un autre mot-clé ou sélectionnez « Tous entrepôts ».</div> : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {searchCj.data.products.map(product => <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex h-36 items-center justify-center bg-slate-50">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <Boxes className="h-8 w-8 text-slate-300" />}</div>
                    <div className="space-y-3 p-4"><div><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{product.name}</h3><p className="mt-1 truncate text-xs text-slate-500">SKU : {product.sku || "Non communiqué"}</p></div>
                      <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">Prix fournisseur</p><p className="font-semibold text-slate-900">{product.supplierPriceUsd == null ? "—" : `$${product.supplierPriceUsd.toFixed(2)} USD`}</p></div><div className="text-right"><p className="text-xs text-slate-500">Stock vérifié</p><p className="font-medium text-slate-700">{product.verifiedStock == null ? "À confirmer" : product.verifiedStock.toLocaleString("fr-CH")}</p></div></div>
                      <div className="flex flex-wrap gap-1.5">{product.category && <Badge variant="secondary" className="max-w-full truncate bg-slate-100 text-slate-600">{product.category}</Badge>}{product.hasCeCertification && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">CE indiqué</Badge>}{product.isFreeShipping && <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Livraison gratuite indiquée</Badge>}</div>
                      <p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> Délai CJ : {product.deliveryCycle ? `${product.deliveryCycle} jours` : "à confirmer"}</p>
                      <Link href={`/admin/import-cj?pid=${encodeURIComponent(product.id)}${cjCountry ? `&country=${encodeURIComponent(cjCountry)}` : ""}`}><Button type="button" variant="outline" size="sm" className="w-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"><ClipboardPenLine className="mr-2 h-4 w-4" /> Préparer l’import</Button></Link>
                    </div>
                  </article>)}
                </div>
              )}
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Avant toute importation :</strong> vérifiez le prix rendu, la livraison vers votre pays, les variantes, la qualité, les droits d’image et la conformité. Ce module ne crée aucun produit MAZIGHO et aucune commande CJ.</div>
            </div>
          )}

          {searchCjByImage.data && <div className="mt-6 border-t border-violet-100 pt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm text-slate-700"><strong className="text-violet-900">{searchCjByImage.data.total.toLocaleString("fr-CH")}</strong> résultats possibles à partir du mot-clé « {searchCjByImage.data.keyword} »</p><p className="mt-1 text-xs text-slate-500">Interprétation : {searchCjByImage.data.interpretation || "produit de référence"} · confiance {searchCjByImage.data.confidence === "high" ? "élevée" : searchCjByImage.data.confidence === "low" ? "faible" : "moyenne"}.</p></div><Badge variant="secondary" className="bg-violet-50 text-violet-800">Suggestion à vérifier</Badge></div>
            {searchCjByImage.data.products.length === 0 ? <div className="rounded-xl border border-dashed border-violet-200 bg-white p-6 text-sm text-slate-600">Aucun produit CJ n’a été renvoyé pour cette suggestion. Essayez une photo plus nette ou utilisez un mot-clé.</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{searchCjByImage.data.products.map(product => <article key={`image-${product.id}`} className="overflow-hidden rounded-xl border border-violet-100 bg-white shadow-sm"><div className="flex h-36 items-center justify-center bg-violet-50/50">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-contain p-2" /> : <Boxes className="h-8 w-8 text-slate-300" />}</div><div className="space-y-3 p-4"><div><h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900">{product.name}</h3><p className="mt-1 truncate text-xs text-slate-500">SKU : {product.sku || "Non communiqué"}</p></div><div className="flex items-end justify-between gap-3"><div><p className="text-xs text-slate-500">Prix fournisseur</p><p className="font-semibold text-slate-900">{product.supplierPriceUsd == null ? "—" : `$${product.supplierPriceUsd.toFixed(2)} USD`}</p></div><div className="text-right"><p className="text-xs text-slate-500">Stock vérifié</p><p className="font-medium text-slate-700">{product.verifiedStock == null ? "À confirmer" : product.verifiedStock.toLocaleString("fr-CH")}</p></div></div><p className="flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" /> Délai CJ : {product.deliveryCycle ? `${product.deliveryCycle} jours` : "à confirmer"}</p><Link href={`/admin/import-cj?pid=${encodeURIComponent(product.id)}${cjCountry ? `&country=${encodeURIComponent(cjCountry)}` : ""}`}><Button type="button" variant="outline" size="sm" className="w-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"><ClipboardPenLine className="mr-2 h-4 w-4" /> Préparer l’import</Button></Link></div></article>)}</div>}
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Résultats indicatifs :</strong> une photo produit une suggestion de mot-clé, pas une identification certaine. Vérifiez toujours prix, livraison, variantes, conformité et droits d’image avant toute préparation de brouillon.</div>
          </div>}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700"><PackageSearch className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">1. Importer en aperçu</h2><p className="mt-2 text-sm leading-6 text-slate-600">Le produit arrive d’abord en brouillon : titre, images, prix et conformité restent à vérifier.</p></CardContent></Card>
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-orange-100 text-orange-700"><Store className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">2. Décider la publication</h2><p className="mt-2 text-sm leading-6 text-slate-600">Vous choisissez la marge, le stock, les variantes et le statut avant que le client ne voie le produit.</p></CardContent></Card>
          <Card className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><LockKeyhole className="h-4 w-4" /></div><h2 className="font-semibold text-slate-900">3. Connecter officiellement</h2><p className="mt-2 text-sm leading-6 text-slate-600">Les API seront reliées seulement par les pages et autorisations officielles des plateformes.</p></CardContent></Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {providerCards.map(provider => <ProviderCard key={provider.name} provider={provider} />)}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle>Canal de vente Amazon</CardTitle><CardDescription>Amazon viendra après les fournisseurs et les paiements MAZIGHO.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><strong>À préparer plus tard :</strong> compte Seller Central, produits testés, délais fiables, politique de retour et mode de livraison conforme. Amazon sera un canal de vente distinct, pas un fournisseur.</div>
              <a href="https://developer.amazonservices.com/" target="_blank" rel="noreferrer"><Button variant="outline" className="border-amber-200 bg-white text-amber-900 hover:bg-amber-50"><ExternalLink className="mr-2 h-4 w-4" /> Découvrir Amazon SP-API</Button></a>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader><CardTitle>Shein et Temu</CardTitle><CardDescription>En attente d’un cadre autorisé adapté.</CardDescription></CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-600"><p>Ces plateformes restent dans la feuille de route, mais ne seront pas automatisées comme fournisseurs sans un programme officiel correspondant au modèle MAZIGHO.</p><Badge variant="secondary" className="bg-slate-100 text-slate-700">En attente — aucun scraping ni commande automatisée</Badge></CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-semibold text-emerald-950">Vous avez déjà une fiche produit fournisseur ?</h2><p className="mt-1 text-sm text-emerald-800">Le flux actuel reste disponible : analyse, vérification puis import en brouillon.</p></div>
          <Link href="/admin/importation"><Button className="bg-emerald-600 text-white hover:bg-emerald-700">Importer manuellement <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
