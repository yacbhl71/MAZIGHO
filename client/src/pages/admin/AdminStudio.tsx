import { useMemo, useState } from "react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  Eye,
  Layers3,
  LockKeyhole,
  Palette,
  PanelTop,
  PawPrint,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  UsersRound,
  WandSparkles,
} from "lucide-react";

type BoutiqueTheme = "animalier" | "bijoux" | "vetements";

type ThemePreview = {
  id: BoutiqueTheme;
  label: string;
  owner: string;
  niche: string;
  icon: typeof PawPrint;
  accent: string;
  accentSoft: string;
  canvas: string;
  ink: string;
  headline: string;
  message: string;
  collections: string[];
  clientFocus: string[];
  progress: string;
  tone: string;
};

const previews: Record<BoutiqueTheme, ThemePreview> = {
  animalier: {
    id: "animalier",
    label: "Boutique animalière",
    owner: "Pattes & Compagnie",
    niche: "Bien-être, promenade et quotidien des animaux",
    icon: PawPrint,
    accent: "#0F766E",
    accentSoft: "#CCFBF1",
    canvas: "#F0FDFA",
    ink: "#134E4A",
    headline: "Le meilleur pour leurs grandes aventures.",
    message: "Des essentiels choisis pour rendre chaque sortie plus simple et plus joyeuse.",
    collections: ["Chiens", "Chats", "Promenade"],
    clientFocus: ["Catalogue par espèce", "Conseils de taille", "Livraison & retours"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Teal",
  },
  bijoux: {
    id: "bijoux",
    label: "Boutique bijoux",
    owner: "Éclat Atelier",
    niche: "Bijoux contemporains et cadeaux choisis",
    icon: Sparkles,
    accent: "#9A3412",
    accentSoft: "#FFEDD5",
    canvas: "#FFF7ED",
    ink: "#7C2D12",
    headline: "Des détails qui deviennent des souvenirs.",
    message: "Des pièces lumineuses pour offrir, célébrer et signer votre style.",
    collections: ["Nouveautés", "À offrir", "Essentiels"],
    clientFocus: ["Variantes matière", "Guide cadeaux", "Coffrets & promotions"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Cuivre",
  },
  vetements: {
    id: "vetements",
    label: "Boutique vêtements",
    owner: "Studio Ligne",
    niche: "Mode, silhouettes et essentiels de saison",
    icon: Shirt,
    accent: "#4338CA",
    accentSoft: "#E0E7FF",
    canvas: "#EEF2FF",
    ink: "#312E81",
    headline: "La silhouette juste, pour chaque journée.",
    message: "Une sélection à porter librement, imaginée autour des coupes et des matières.",
    collections: ["Femme", "Homme", "Enfant"],
    clientFocus: ["Tailles & couleurs", "Collections saisonnières", "Retours simplifiés"],
    progress: "Pack métier prêt à personnaliser",
    tone: "Indigo",
  },
};

function StudioRailItem({ icon: Icon, title, detail }: { icon: typeof Building2; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-slate-900 p-2.5 text-white"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

export default function AdminStudio() {
  const [themeId, setThemeId] = useState<BoutiqueTheme>("animalier");
  const theme = previews[themeId];
  const ThemeIcon = theme.icon;
  const themeCollections = useMemo(() => theme.collections, [theme.collections]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="mazigho-studio-page">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_250px] md:items-center md:p-8">
            <div>
              <Badge className="border border-orange-300/35 bg-orange-400/15 px-3 py-1 text-orange-100 hover:bg-orange-400/15"><Building2 className="mr-1.5 h-3.5 w-3.5" /> Console opérateur</Badge>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">MAZIGHO Studio prend forme.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">Cette console vous appartient : elle donnera une vision de la plateforme, tandis que chaque acheteur administrera uniquement sa propre boutique. Les cartes ci-dessous sont des aperçus non publiés, sans boutique cliente créée ni donnée de production modifiée.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Étape actuelle</p>
              <p className="mt-2 text-lg font-semibold">Fondations multi-boutiques</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[58%] rounded-full bg-orange-400" /></div>
              <p className="mt-3 text-xs leading-5 text-slate-300">Identité, catalogue et relations client sont en cours d’isolation avant l’ouverture des premières boutiques clientes.</p>
            </div>
          </div>
          <div className="grid border-t border-white/10 sm:grid-cols-3">
            <div className="border-b border-white/10 px-6 py-4 sm:border-b-0 sm:border-r"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Votre rôle</p><p className="mt-1 font-semibold">Opérateur de plateforme</p></div>
            <div className="border-b border-white/10 px-6 py-4 sm:border-b-0 sm:border-r"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Espace client</p><p className="mt-1 font-semibold">Une boutique, un catalogue, un pilotage</p></div>
            <div className="px-6 py-4"><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Sécurité</p><p className="mt-1 font-semibold">Secrets techniques hors interface</p></div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.06fr_.94fr]">
          <Card className="border-orange-100 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Niveau 1 — vous</p>
                  <CardTitle className="mt-1 flex items-center gap-2 text-2xl"><Layers3 className="h-6 w-6 text-orange-600" /> MAZIGHO Studio</CardTitle>
                </div>
                <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">Réservé opérateur</Badge>
              </div>
              <CardDescription>Le cockpit de l’activité SaaS : il ne sera pas le panneau quotidien de l’acheteur d’une boutique.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StudioRailItem icon={Store} title="Parc de boutiques" detail="Voir les boutiques actives, leur état d’accès et leur domaine, sans ouvrir leur contenu." />
              <StudioRailItem icon={ClipboardCheck} title="Mises en service" detail="Suivre les étapes de lancement : identité, catalogue, domaine et contrôles de sécurité." />
              <StudioRailItem icon={ShieldCheck} title="Protection plateforme" detail="Contrôler les états limité, suspendu ou révoqué, avec une trace d’audit." />
              <StudioRailItem icon={UsersRound} title="Accompagnement" detail="Orienter un client vers son panneau, sans travailler à sa place dans son catalogue." />
            </CardContent>
          </Card>

          <Card className="border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white shadow-sm">
            <CardHeader>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Niveau 2 — acheteur</p>
              <CardTitle className="mt-1 flex items-center gap-2 text-2xl"><PanelTop className="h-6 w-6 text-teal-700" /> Panneau de sa boutique</CardTitle>
              <CardDescription>Un espace plus simple et rassurant : le client travaille sur sa marque, son catalogue et ses commandes, jamais sur l’ensemble de la plateforme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Vue du jour : ventes, commandes et alertes", "Catalogue : produits, catégories, variantes et contenus", "Marque : logo, couleurs, bannières et textes", "Relation client : promotions, messages, avis et retours"].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-teal-100 bg-white/85 px-4 py-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" /><span className="text-sm font-medium text-slate-800">{item}</span></div>
              ))}
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><p><strong className="text-slate-800">Volontairement absent :</strong> clés Stripe, Odoo, base de données, facturation SaaS et autres secrets ne seront jamais saisis ni affichés dans ce panneau.</p></div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Prévisualisations métier</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Une même ossature, trois identités vraiment différentes.</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Le logiciel reste le même et sécurisé. Seuls l’univers visuel, les catégories, les conseils de catalogue et la priorité de gestion changent selon le métier du client.</p>
            </div>
            <Badge variant="outline" className="w-fit border-slate-200 bg-slate-50 text-slate-600"><Eye className="mr-1.5 h-3.5 w-3.5" /> Simulation locale non publiée</Badge>
          </div>

          <Tabs value={themeId} onValueChange={value => setThemeId(value as BoutiqueTheme)} className="mt-6">
            <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
              {(Object.values(previews) as ThemePreview[]).map(item => {
                const Icon = item.icon;
                return <TabsTrigger key={item.id} value={item.id} className="gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-600 data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white"><Icon className="h-4 w-4" />{item.label}</TabsTrigger>;
              })}
            </TabsList>
          </Tabs>

          <div className="mt-6 grid gap-5 xl:grid-cols-[1.07fr_.93fr]">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><CircleDashed className="h-4 w-4" /> Aperçu storefront</div><Badge className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-100">{theme.tone}</Badge></div>
              <div className="p-5" style={{ backgroundColor: theme.canvas }}>
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ backgroundColor: theme.accent }}><ThemeIcon className="h-4 w-4" /></div><span className="font-semibold tracking-wide" style={{ color: theme.ink }}>{theme.owner}</span></div><span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-600">Livraison & retours</span></div>
                <div className="mt-7 grid gap-5 sm:grid-cols-[1.15fr_.85fr] sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: theme.accent }}>{theme.niche}</p><h3 className="mt-3 text-3xl font-bold leading-tight" style={{ color: theme.ink }}>{theme.headline}</h3><p className="mt-3 max-w-md text-sm leading-6 text-slate-700">{theme.message}</p><span className="mt-5 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: theme.accent }}>Découvrir la collection</span></div><div className="grid min-h-44 place-items-center rounded-2xl border border-white/70 bg-white/65 p-5 text-center"><ThemeIcon className="h-12 w-12" style={{ color: theme.accent }} /><p className="mt-3 text-sm font-semibold" style={{ color: theme.ink }}>{theme.label}</p><p className="mt-1 text-xs text-slate-500">Visuels et logo propres au client</p></div></div>
                <div className="mt-6 grid grid-cols-3 gap-2">{themeCollections.map(collection => <div key={collection} className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center text-xs font-semibold" style={{ color: theme.ink }}>{collection}</div>)}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><PanelTop className="h-4 w-4" /> Aperçu panneau client</div><Badge variant="outline" className="border-slate-200 bg-white text-slate-600">Propriétaire boutique</Badge></div>
              <div className="p-5">
                <div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ backgroundColor: theme.accent }}><ThemeIcon className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{theme.owner} — administration</p><p className="mt-1 text-sm text-slate-500">Pilotage quotidien de la boutique</p></div></div>
                <div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Aujourd’hui</p><p className="mt-2 text-sm font-semibold text-slate-800">Commandes</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Catalogue</p><p className="mt-2 text-sm font-semibold text-slate-800">Produits</p></div><div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Marque</p><p className="mt-2 text-sm font-semibold text-slate-800">Identité</p></div></div>
                <div className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Priorités du métier</p><div className="mt-3 space-y-2">{theme.clientFocus.map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"><span className="grid h-6 w-6 place-items-center rounded-lg text-xs font-bold text-white" style={{ backgroundColor: theme.accent }}>{index + 1}</span><span className="text-sm font-medium text-slate-700">{item}</span></div>)}</div></div>
                <div className="mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm" style={{ borderColor: theme.accentSoft, backgroundColor: theme.canvas, color: theme.ink }}><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>{theme.progress}. Le propriétaire adaptera ensuite son logo, son contenu et ses catégories depuis un espace guidé.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="flex items-center gap-2 font-semibold text-amber-950"><WandSparkles className="h-5 w-5 text-amber-700" /> Ce qui viendra maintenant</p><p className="mt-2 max-w-3xl text-sm leading-6 text-amber-900">La prochaine étape est de transformer cette vue en vraie console opérateur : inventaire des boutiques, états d’accès, accompagnement et passage guidé vers le panneau de chaque client. La création d’une première boutique reste désactivée tant que tous les services opérationnels ne sont pas isolés.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button asChild className="bg-slate-900 hover:bg-slate-800"><Link href="/admin"><ArrowUpRight className="mr-2 h-4 w-4" /> Revenir au pilotage MAZIGHO</Link></Button><Button asChild variant="outline" className="border-orange-200 bg-white text-orange-800 hover:bg-orange-50"><Link href="/admin/personnalisation"><Palette className="mr-2 h-4 w-4" /> Voir la personnalisation</Link></Button></div>
        </section>
      </div>
    </DashboardLayout>
  );
}
