import { Link } from "wouter";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

function SeoSnippetPreview() {
  const query = trpc.admin.seo.get.useQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  useEffect(() => { if (query.data) { setTitle(query.data.title); setDescription(query.data.description); } }, [query.data]);
  const save = trpc.admin.seo.save.useMutation({ onSuccess: () => toast.success("Aperçu SEO enregistré"), onError: e => toast.error(e.message) });
  const siteUrl = query.data?.siteUrl ?? "https://www.mazigho.ch";
  const host = siteUrl.replace(/^https?:\/\//, "");

  return (
    <Card className="shadow-sm" data-testid="seo-preview-card">
      <CardHeader className="border-b border-border/70 pb-5"><CardTitle className="flex items-center gap-2"><SearchCheck className="h-5 w-5 text-sky-600" /> Aperçu moteur de recherche</CardTitle><CardDescription>Visualisez en direct votre extrait Google et réseaux sociaux, puis ajustez-le.</CardDescription></CardHeader>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2"><label className="text-sm font-medium">Titre ({title.length}/70)</label><Input value={title} maxLength={70} onChange={e => setTitle(e.target.value)} data-testid="seo-title-input" /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Méta-description ({description.length}/320)</label><Textarea rows={4} value={description} maxLength={320} onChange={e => setDescription(e.target.value)} data-testid="seo-description-input" /></div>
          <Button className="bg-sky-600 hover:bg-sky-700" disabled={save.isPending || title.trim().length < 3 || description.trim().length < 10} onClick={() => save.mutate({ title: title.trim(), description: description.trim() })} data-testid="seo-save-button">{save.isPending ? "…" : "Enregistrer l'aperçu"}</Button>
        </div>
        <div className="space-y-4">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résultat Google</p><div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-600">{host}</p><p className="truncate text-lg text-[#1a0dab]">{title || "Titre de la page"}</p><p className="mt-1 line-clamp-2 text-sm text-slate-600">{description || "La méta-description apparaîtra ici."}</p></div></div>
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Partage réseaux sociaux</p><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><div className="flex h-24 items-center justify-center bg-gradient-to-r from-sky-500 to-emerald-500 text-white"><Globe2 className="h-8 w-8 opacity-80" /></div><div className="p-3"><p className="text-[10px] uppercase text-slate-400">{host}</p><p className="truncate text-sm font-semibold text-slate-900">{title || "Titre de la page"}</p><p className="line-clamp-2 text-xs text-slate-600">{description || "La méta-description apparaîtra ici."}</p></div></div></div>
        </div>
      </CardContent>
    </Card>
  );
}

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

        <SeoSnippetPreview />

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
