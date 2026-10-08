import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { giftDemoLibraryKits } from "@shared/giftDemoLibrary";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, CheckCircle2, Copy, FileText, Image, LayoutTemplate, Layers3, Palette, Sparkles, Store, WandSparkles } from "lucide-react";
import { toast } from "sonner";

const demoSections = [
  {
    title: "Hero éditorial",
    description: "Accroche, promesse courte, appel à l’action et respiration visuelle. Inspiré du rythme éditorial de Rituels, sans reprendre son texte ni ses médias.",
    labels: ["Accueil", "Image placeholder", "CTA"],
  },
  {
    title: "Cartes de collections",
    description: "Trois à six entrées de collection avec titre, phrase-guide et visuel à remplacer. Utiles pour poser une navigation claire avant le vrai catalogue.",
    labels: ["Collections", "Grille", "À compléter"],
  },
  {
    title: "Cartes rondes / univers",
    description: "Un format d’exploration doux pour des catégories, des rituels ou des usages. La forme est un repère visuel, pas une donnée métier.",
    labels: ["Découverte", "Catégories", "Optionnel"],
  },
  {
    title: "Bloc manifeste",
    description: "Une phrase de marque, un sous-texte et un espace image qui aident à tester la tonalité d’une boutique avant de rédiger sa vraie histoire.",
    labels: ["Éditorial", "Texte fictif", "Réversible"],
  },
  {
    title: "Réassurance & FAQ",
    description: "Des cartes de structure pour livraison, retours, contact ou questions fréquentes. Aucun engagement commercial, juridique ou de paiement n’est prérempli.",
    labels: ["Structure", "Sans conditions réelles", "À valider"],
  },
  {
    title: "Newsletter / contact",
    description: "Un emplacement de fin de page pour tester la composition. Les e-mails, formulaires et envois restent volontairement absents du contenu de démonstration.",
    labels: ["Pied de page", "Sans collecte", "À configurer"],
  },
] as const;

const demoTexts = [
  {
    title: "Accroche de vitrine",
    text: "Une sélection pensée pour les gestes du quotidien. Ce texte de démonstration est à remplacer avant publication.",
  },
  {
    title: "Description de collection",
    text: "Présentez ici une famille de produits, son intention et ce qui la rend utile. Ajoutez vos informations réelles avant l’ouverture.",
  },
  {
    title: "Fiche produit fictive",
    text: "Cette fiche sert à vérifier la lisibilité d’un produit. Aucun prix, stock, fournisseur, image réelle ou promesse commerciale n’est fourni.",
  },
] as const;

function copyDemoText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Texte de démonstration copié. Pensez à le remplacer avant publication."),
    () => toast.error("La copie n’a pas pu être effectuée. Sélectionnez le texte manuellement."),
  );
}

export default function AdminStudioDemoLibrary() {
  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8" data-testid="studio-demo-library-page">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><div className="flex flex-wrap gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-violet-200 bg-violet-50 text-violet-900">Bibliothèque de démo</Badge></div><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Modèles, contenus fictifs et sections à adapter</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Un espace de préparation pour concevoir une boutique sans confondre maquette et contenu commercial réel. Les structures visuelles peuvent s’inspirer des bonnes pratiques de Rituels d’Infusion, jamais de ses textes, visuels, produits, prix ou données.</p></div>
      <Link href="/admin/studio" className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"><ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio</Link>
    </header>

    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 shadow-sm md:p-6"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><div className="rounded-xl bg-amber-100 p-2.5 text-amber-800"><BookOpen className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Règle de publication</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Démonstration — à remplacer avant publication</h2><p className="mt-2 max-w-3xl text-sm leading-6">Tout élément ici est fictif, pédagogique ou structurel. Cette bibliothèque ne crée ni boutique, ni visuel, ni produit, ni prix, ni stock, ni fournisseur, ni livraison, ni paiement, ni e-mail, ni commande. Chaque contenu doit être remplacé et vérifié humainement avant l’ouverture d’une vitrine.</p></div></div><Badge className="w-fit border-0 bg-amber-800 text-white hover:bg-amber-800">Lecture seule</Badge></div></section>

    <section aria-labelledby="demo-models-title"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">1. Templates & kits graphiques</p><h2 id="demo-models-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Les structures réutilisables</h2></div><Link href="/admin/studio/themes"><Button type="button" variant="outline" className="border-violet-200 bg-violet-50 text-violet-900 hover:bg-violet-100"><Palette className="mr-2 h-4 w-4" /> Ouvrir les thèmes</Button></Link></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><Card className="border-violet-200 bg-violet-50/50"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-800"><LayoutTemplate className="h-5 w-5" /></div><div><CardTitle>Templates de boutique</CardTitle><CardDescription className="mt-1">Identité, typographie, palette et structure d’accueil.</CardDescription></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">Les thèmes existants restent la bibliothèque graphique officielle. Ils sont à sélectionner intentionnellement, puis à adapter dans les outils de contenu.</p></CardContent></Card><Card className="border-sky-200 bg-sky-50/60"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-sky-100 p-2.5 text-sky-800"><Layers3 className="h-5 w-5" /></div><div><CardTitle>Wireframes fonctionnels</CardTitle><CardDescription className="mt-1">Ordre et hiérarchie d’une page, sans contenu commercial.</CardDescription></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">Hero → collections → bloc éditorial → réassurance → contact. Cette séquence peut être modifiée : elle sert seulement à vérifier la lisibilité d’une future vitrine.</p></CardContent></Card><Card className="border-emerald-200 bg-emerald-50/60"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800"><Store className="h-5 w-5" /></div><div><CardTitle>Kits métier</CardTitle><CardDescription className="mt-1">Catégories et fiche neutre cohérentes avec le modèle choisi.</CardDescription></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-slate-700">Ils sont installés séparément et uniquement dans une boutique offerte en <code>setup</code>, après confirmation. Aucun kit n’ouvre une boutique ni ne prépare une vente.</p><Link href="/admin/studio#studio-retail-demo-kits"><Button type="button" variant="outline" className="mt-4 border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"><Layers3 className="mr-2 h-4 w-4" /> Voir les kits</Button></Link></CardContent></Card></div></section>

    <section aria-labelledby="demo-sections-title"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-700">2. Sections d’exemple</p><h2 id="demo-sections-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Des blocs à utiliser comme repères de composition</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Ces sections reprennent des principes de vitrine réussis : hiérarchie, rythme, respiration, navigation et réassurance. Elles ne recopient aucune donnée de Rituels d’Infusion.</p></div><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{demoSections.map((section, index) => <Card key={section.title} className="border-slate-200 bg-white"><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-fuchsia-50 p-2.5 text-fuchsia-800"><LayoutTemplate className="h-5 w-5" /></div><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Bloc {index + 1}</Badge></div><CardTitle className="mt-3 text-lg">{section.title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-slate-600">{section.description}</p><div className="mt-4 flex flex-wrap gap-2">{section.labels.map(label => <Badge key={label} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">{label}</Badge>)}</div></CardContent></Card>)}</div></section>

    <section className="grid gap-5 xl:grid-cols-[1.04fr_.96fr]" aria-labelledby="demo-content-title"><Card className="border-slate-200"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-slate-950 p-2.5 text-white"><FileText className="h-5 w-5" /></div><div><CardDescription>3. Textes de démonstration</CardDescription><CardTitle id="demo-content-title" className="mt-1 text-2xl">Des textes neutres, pas des promesses commerciales</CardTitle></div></div></CardHeader><CardContent className="space-y-3">{demoTexts.map(item => <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex gap-3"><div className="min-w-0 flex-1"><p className="font-semibold text-slate-950">{item.title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></div><Button type="button" size="icon" variant="outline" aria-label={`Copier ${item.title}`} className="shrink-0 bg-white" onClick={() => copyDemoText(item.text)}><Copy className="h-4 w-4" /></Button></div></article>)}</CardContent></Card>
      <Card className="border-fuchsia-200 bg-fuchsia-50/40"><CardHeader><div className="flex items-start gap-3"><div className="rounded-xl bg-fuchsia-100 p-2.5 text-fuchsia-800"><Image className="h-5 w-5" /></div><div><CardDescription className="text-fuchsia-800">4. Visuels placeholder</CardDescription><CardTitle className="mt-1 text-2xl text-fuchsia-950">Illustrer sans faire passer une image fictive pour un produit</CardTitle></div></div></CardHeader><CardContent><p className="text-sm leading-6 text-fuchsia-950">Une image de travail doit être nommée et marquée comme telle : <strong>« visuel de démonstration — à remplacer »</strong>. Elle ne doit jamais être associée à un prix, un stock, un fournisseur ou une fiche vendable.</p><div className="mt-4 rounded-2xl border border-dashed border-fuchsia-300 bg-white/80 p-5"><Sparkles className="h-6 w-6 text-fuchsia-700" /><p className="mt-3 font-semibold text-slate-950">Créer une image de travail séparée</p><p className="mt-1 text-sm leading-6 text-slate-600">Le générateur Studio produit un fichier autonome et ne l’attache à aucune boutique automatiquement. Son utilisation reste volontaire et distincte de cette bibliothèque.</p><Link href="/admin/studio/creer-image"><Button type="button" variant="outline" className="mt-4 border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900 hover:bg-fuchsia-100"><WandSparkles className="mr-2 h-4 w-4" /> Ouvrir le générateur</Button></Link></div></CardContent></Card>
    </section>

    <section aria-labelledby="demo-datasets-title"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">5. Jeux de données fictifs</p><h2 id="demo-datasets-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Des catégories et fiches neutres, jamais un faux catalogue commercial</h2></div><Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-emerald-800">{giftDemoLibraryKits.length} kits disponibles</Badge></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{giftDemoLibraryKits.map(kit => <article key={kit.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4"><div className="flex items-start gap-3"><div className="rounded-xl bg-white p-2.5 text-emerald-800 shadow-sm"><Layers3 className="h-5 w-5" /></div><div><p className="font-semibold text-slate-950">{kit.label}</p><p className="mt-1 text-xs leading-5 text-slate-600">{kit.categories.map(category => category.name).join(" · ")}</p></div></div><div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-900"><CheckCircle2 className="h-4 w-4" /> 3 catégories · 1 fiche à 0 stock</div></article>)}</div><p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">Avant publication, remplacez chaque fiche par les informations réelles : produit, images, composition ou dimensions, variante, prix, stock, fournisseur, livraison, mentions et contrôles applicables. L’installation reste verrouillée à une boutique offerte compatible en préparation.</p></section>
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-6" aria-labelledby="demo-release-title"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600">6. Contrôle avant ouverture</p><h2 id="demo-release-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Checklist de sortie de démonstration</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Un aide-mémoire lisible dans Studio : il ne publie rien, ne supprime rien et ne remplace pas les contrôles métier déjà obligatoires.</p></div><Badge variant="outline" className="w-fit border-slate-200 bg-white text-slate-700">À vérifier humainement</Badge></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{["Remplacer les textes, titres et CTA de démonstration", "Remplacer ou retirer tous les visuels placeholder", "Créer les vrais produits, variantes, prix et stocks", "Vérifier livraison, retours, mentions et contact", "Revoir le prévol de publication avant toute ouverture"].map((item, index) => <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Étape {index + 1}</p><div className="mt-3 flex gap-2 text-sm font-medium leading-6 text-slate-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />{item}</div></div>)}</div></section>
  </main></DashboardLayout>;
}
