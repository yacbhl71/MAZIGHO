import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ExternalLink,
  Globe2,
  LockKeyhole,
  PackageSearch,
  ShieldCheck,
  Store,
  Workflow,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
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
