import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileSearch,
  Globe2,
  Languages,
  ListChecks,
  Map,
  SearchCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

const publicPages = [
  { path: "/", label: "Accueil", purpose: "Présente la sélection et les catégories" },
  { path: "/boutique", label: "Boutique", purpose: "Catalogue public" },
  { path: "/creations", label: "Collections créatives", purpose: "Univers créatif de la boutique" },
  { path: "/nouveautes", label: "Nouveautés", purpose: "Sélection récemment ajoutée" },
  { path: "/best-sellers", label: "Meilleures ventes", purpose: "Produits les plus consultés" },
  { path: "/promos", label: "Promotions", purpose: "Offres actives" },
  { path: "/a-propos", label: "À propos", purpose: "Identité et démarche MAZIGHO" },
  { path: "/contact", label: "Contact", purpose: "Point de contact public" },
  { path: "/faq", label: "Aide", purpose: "Réponses aux questions fréquentes" },
];

const actions = [
  {
    title: "Soigner les contenus visibles",
    description: "Modifiez titres, descriptions, bannières et sections depuis l’éditeur simple.",
    href: "/admin/editeur",
    icon: FileSearch,
    tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    title: "Préparer les langues",
    description: "Les fiches produits non traduites restent masquées hors français pour préserver la qualité.",
    href: "/admin/traductions",
    icon: Languages,
    tone: "bg-sky-50 text-sky-700 border-sky-100",
  },
  {
    title: "Valider la livraison",
    description: "Ne rendez un produit disponible que lorsqu’un devis pays est confirmé.",
    href: "/admin/produits",
    icon: Truck,
    tone: "bg-amber-50 text-amber-700 border-amber-100",
  },
];

export default function AdminSEO() {
  const { data: stats, isLoading } = trpc.admin.getStats.useQuery();
  const productsWithoutDeliveryProfiles = stats?.catalogReadiness?.productsWithoutDeliveryProfiles ?? [];
  const productsNeedingTranslations = stats?.catalogReadiness?.productsNeedingTranslations ?? [];

  const checks = [
    {
      title: "Titre et description",
      description: "Le socle SEO de MAZIGHO est défini dans la page d’entrée de la boutique.",
      icon: SearchCheck,
      tone: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "URL canonique",
      description: "Une URL principale limite la concurrence entre variantes d’adresse.",
      icon: Globe2,
      tone: "bg-sky-100 text-sky-700",
    },
    {
      title: "Robots et sitemap",
      description: "Les fichiers publics indiquent les pages à explorer et leurs adresses.",
      icon: Map,
      tone: "bg-violet-100 text-violet-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
          <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-800"><SearchCheck className="h-4 w-4" /> Visibilité & indexation</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">SEO & indexation</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Pilotez ici les éléments qui rendent MAZIGHO compréhensible par les moteurs de recherche. Les réglages sensibles restent protégés : aucune clé, automatisation, publication catalogue ou paiement n’est géré depuis cet écran.</p>
            </div>
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-[2rem] bg-sky-600 text-white shadow-lg shadow-sky-100 md:mx-0"><Globe2 className="h-12 w-12" /></div>
          </div>
          <div className="flex flex-col gap-3 border-t border-sky-100 bg-white/70 px-6 py-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><p><strong>Approche sûre :</strong> le contenu public, les langues et les profils de livraison sont contrôlés avant d’être mis en avant.</p></div>
            <a className="inline-flex shrink-0 items-center font-semibold text-sky-700 hover:underline" href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Ouvrir Search Console <ExternalLink className="ml-1 h-4 w-4" /></a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {checks.map(({ title, description, icon: Icon, tone }) => (
            <Card key={title} className="border-slate-200 shadow-sm"><CardContent className="p-5"><div className={`w-fit rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div><div className="mt-4 flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">{title}</h2><Badge className="border-0 bg-emerald-100 text-emerald-800"><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> En place</Badge></div><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></CardContent></Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/70 pb-5"><CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-sky-600" /> Contrôle avant mise en avant</CardTitle><CardDescription>Des produits complets et cohérents sont la base d’une visibilité durable.</CardDescription></CardHeader>
            <CardContent className="divide-y divide-border/70 p-0">
              <Link href="/admin/produits" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-slate-900">Profils de livraison manquants</p><p className="mt-1 text-xs text-muted-foreground">Sans devis pays validé, aucun produit ne doit être présenté comme disponible.</p></div>{isLoading ? <Skeleton className="h-6 w-9" /> : <Badge className={`border-0 ${productsWithoutDeliveryProfiles.length ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{productsWithoutDeliveryProfiles.length}</Badge>}</div></Link>
              <Link href="/admin/traductions" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-slate-900">Traductions à compléter</p><p className="mt-1 text-xs text-muted-foreground">Les fiches doivent être prêtes dans la langue proposée au client.</p></div>{isLoading ? <Skeleton className="h-6 w-9" /> : <Badge className={`border-0 ${productsNeedingTranslations.length ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{productsNeedingTranslations.length}</Badge>}</div></Link>
              <Link href="/admin/contenu" className="block px-5 py-4 transition-colors hover:bg-slate-50"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold text-slate-900">Contenus publics</p><p className="mt-1 text-xs text-muted-foreground">Bannières, catégories et profil design se gèrent depuis les outils de contenu.</p></div><ArrowUpRight className="h-4 w-4 text-sky-700" /></div></Link>
            </CardContent>
          </Card>

          <Card className="border-sky-100 bg-sky-50/40 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-sky-700" /> Ce que vous pouvez faire</CardTitle><CardDescription>Des actions simples, sans risque technique.</CardDescription></CardHeader><CardContent className="space-y-3">{actions.map(({ title, description, href, icon: Icon, tone }) => <Link key={title} href={href}><div className={`group cursor-pointer rounded-xl border p-4 transition-colors hover:bg-white ${tone}`}><div className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{description}</p><p className="mt-2 flex items-center text-xs font-semibold text-sky-700">Ouvrir <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></p></div></div></div></Link>)}</CardContent></Card>
        </section>

        <Card className="shadow-sm"><CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Pages publiques suivies</CardTitle><CardDescription>Les pages de découverte incluses dans le fichier sitemap public.</CardDescription></div><Button asChild variant="outline" className="border-sky-200 bg-white text-sky-800 hover:bg-sky-50"><a href="/sitemap.xml" target="_blank" rel="noreferrer"><Map className="mr-2 h-4 w-4" /> Voir le sitemap</a></Button></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{publicPages.map(page => <a key={page.path} href={page.path} target="_blank" rel="noreferrer" className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 hover:bg-sky-50"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{page.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{page.purpose}</p></div><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-sky-700" /></div></a>)}</div></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
