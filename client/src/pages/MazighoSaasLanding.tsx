import { Link } from "wouter";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileSpreadsheet,
  Globe2,
  Layers3,
  LockKeyhole,
  Menu,
  PackageCheck,
  Palette,
  Sparkles,
  Store,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_LOGO } from "@/const";
import { storefrontThemeCatalog, type StorefrontThemeId } from "@shared/storefrontThemeCatalog";
import { trpc } from "@/lib/trpc";

const navigation = [
  { label: "Pourquoi MAZIGHO", href: "#pourquoi" },
  { label: "Votre espace", href: "#espace" },
  { label: "10 thèmes", href: "#themes" },
  { label: "Tarifs", href: "#tarifs" },
];

const outcomes = [
  {
    icon: Palette,
    label: "Votre univers, sans contrainte",
    text: "Choisissez un thème, remplacez les images, masquez des sections et ajustez chaque texte de votre vitrine.",
    tone: "bg-[#f2f0e2] text-[#596332]",
  },
  {
    icon: PackageCheck,
    label: "Un catalogue prêt à travailler",
    text: "Produits, variantes, prix, stock, catégories et import CSV : tout est organisé pour avancer simplement.",
    tone: "bg-[#fbe9cf] text-[#b65a11]",
  },
  {
    icon: Globe2,
    label: "Vendre ici et ailleurs",
    text: "Préparez votre boutique avant son domaine. Langues, marchés, devise et navigation restent entre vos mains.",
    tone: "bg-[#e8f0e7] text-[#2c6a55]",
  },
];

const steps = [
  { number: "01", title: "Donnez une direction", text: "Un nom, un univers et un thème : votre point de départ est déjà cohérent." },
  { number: "02", title: "Faites-la vôtre", text: "Ajoutez le catalogue, les variantes et les contenus. Tout reste modifiable ensuite." },
  { number: "03", title: "Préparez l’ouverture", text: "Vérifiez les éléments essentiels, liez le domaine quand vous êtes prêt et avancez à votre rythme." },
];

const plans = [
  {
    name: "FREE",
    price: "0",
    suffix: "CHF / mois",
    commission: "2,5 % de commission",
    description: "Le point de départ pour construire sereinement votre boutique.",
    features: ["50 produits actifs", "1 accès délégué", "500 Mo de médias", "Vitrine, variantes & stock"],
    featured: false,
  },
  {
    name: "BASIC",
    price: "7,90",
    suffix: "CHF / mois",
    commission: "1,0 % de commission",
    description: "Pour développer sans plafond de catalogue, avec la même base claire et isolée.",
    features: ["Produits actifs illimités", "5 accès délégués", "1 Go de médias", "Support et suivi renforcés"],
    featured: true,
  },
  {
    name: "PRO",
    price: "12,90",
    suffix: "CHF / mois",
    commission: "1,0 % de commission",
    description: "Pour développer avec le dropshipping contrôlé, sans automatisation imposée.",
    features: ["Produits actifs illimités", "8 accès délégués", "2 Go de médias", "Dropshipping en brouillon validé"],
    featured: true,
  },
];

function Wordmark({ compact = false, logoUrl = APP_LOGO }: { compact?: boolean; logoUrl?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src={logoUrl} alt="" className="h-9 w-9 object-contain" />
      <div className="leading-none">
        <p className="font-serif text-xl font-bold tracking-[0.12em] text-slate-950">MAZIGH<span className="text-[#7b8a3f]">O</span></p>
        {!compact && <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Commerce indépendant</p>}
      </div>
    </div>
  );
}

function ProductStudioPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[625px]" aria-label="Aperçu illustratif du Studio MAZIGHO">
      <div className="absolute -left-12 top-12 h-56 w-56 rounded-full bg-[#dce5aa]/70 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-8 -right-6 h-48 w-48 rounded-full bg-[#f5bc61]/45 blur-3xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[#fbfaf5] p-2 shadow-[0_30px_80px_-28px_rgba(42,52,24,0.35)]">
        <div className="overflow-hidden rounded-[1.55rem] border border-[#e8e5d8] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#eeeade] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f3ba52]" /><span className="h-2.5 w-2.5 rounded-full bg-[#92a254]" /><span className="h-2.5 w-2.5 rounded-full bg-[#dfded5]" /></div>
            <p className="rounded-full bg-[#f5f3e9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#647136]">Votre espace MAZIGHO</p>
          </div>
          <div className="grid min-h-[350px] grid-cols-[68px_1fr] sm:min-h-[390px] sm:grid-cols-[112px_1fr]">
            <aside className="border-r border-[#eeeade] bg-[#f8f7f1] px-2 py-4 sm:px-3">
              <div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#5c6934] text-white"><Store className="h-4 w-4" /></div>
              <div className="mt-6 space-y-3">
                {[Layers3, PackageCheck, Palette, UsersRound].map((Icon, index) => <div key={index} className={`mx-auto grid h-8 w-8 place-items-center rounded-lg ${index === 0 ? "bg-[#e2e9bd] text-[#53602f]" : "text-slate-400"}`}><Icon className="h-4 w-4" /></div>)}
              </div>
              <div className="mt-8 hidden border-t border-[#e8e5d8] pt-4 sm:block"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Mon espace</p><p className="mt-2 text-[10px] font-semibold text-slate-700">Ma boutique</p></div>
            </aside>
            <div className="min-w-0 bg-[#fffefb] p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#728044]">Vue d’ensemble</p><h3 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">Atelier Ardoise</h3></div><span className="rounded-full border border-[#dce5ba] bg-[#f4f8e5] px-2.5 py-1 text-[9px] font-bold text-[#657436]">En préparation</span></div>
              <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {[{ label: "Produits", value: "48" }, { label: "Variantes", value: "126" }, { label: "Vitrine", value: "Prête" }].map((item) => <div key={item.label} className="rounded-xl border border-[#ebe8dc] bg-[#fcfbf7] p-2.5 sm:p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p><p className="mt-1 text-sm font-bold text-slate-900 sm:text-base">{item.value}</p></div>)}
              </div>
              <div className="mt-5 rounded-2xl border border-[#e7e4d9] bg-[#faf9f3] p-3.5 sm:p-4">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-900">Checklist d’ouverture</p><p className="mt-0.5 text-[10px] text-slate-500">Les prochaines étapes, sans pression.</p></div><p className="text-xs font-bold text-[#657436]">4 / 6</p></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8e8df]"><div className="h-full w-2/3 rounded-full bg-[#8e9e4c]" /></div>
                <div className="mt-3 space-y-2">{["Identité de vitrine", "Catalogue et variantes", "Livraison et retours"].map((item, index) => <div key={item} className="flex items-center gap-2 text-[10px] text-slate-600"><CircleCheck className={`h-3.5 w-3.5 ${index < 2 ? "text-[#7d8c42]" : "text-slate-300"}`} />{item}</div>)}</div>
              </div>
              <div className="mt-5 grid grid-cols-[1.15fr_.85fr] gap-3">
                <div className="rounded-2xl bg-[#5b6836] p-3.5 text-white"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/65">Vitrine</p><p className="mt-1 text-xs font-semibold">Personnalisez chaque détail.</p><div className="mt-3 flex h-9 items-end gap-1"><span className="h-4 w-3 rounded-t bg-[#dce5aa]" /><span className="h-7 w-3 rounded-t bg-[#f5bc61]" /><span className="h-5 w-3 rounded-t bg-white/65" /><span className="h-8 w-3 rounded-t bg-[#dce5aa]" /><span className="h-6 w-3 rounded-t bg-white/65" /></div></div>
                <div className="rounded-2xl border border-[#e7e4d9] p-3.5"><Palette className="h-4 w-4 text-[#d68a25]" /><p className="mt-2 text-[10px] font-bold text-slate-900">10 thèmes</p><p className="mt-1 text-[9px] leading-4 text-slate-500">Une base, jamais une contrainte.</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-5 left-3 flex max-w-[210px] items-center gap-3 rounded-2xl border border-[#e2e9bd] bg-white px-3.5 py-3 shadow-lg shadow-[#53602f]/10 sm:-left-7"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eff4d5] text-[#617033]"><Sparkles className="h-4 w-4" /></span><p className="text-[10px] font-semibold leading-4 text-slate-700">Tout est prêt à évoluer avec votre projet.</p></div>
    </div>
  );
}

function ThemeLivePreview({ onCreateSpace }: { onCreateSpace: () => void }) {
  const [selectedThemeId, setSelectedThemeId] = useState<StorefrontThemeId>("violetCraft");
  const selectedTheme = storefrontThemeCatalog.find(theme => theme.id === selectedThemeId) ?? storefrontThemeCatalog[0]!;

  return (
    <section id="themes" className="scroll-mt-20 border-y border-[#e9e6d9] bg-[#fffefb] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8b40]">10 univers de départ</p>
          <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#26301b] sm:text-5xl">Projetez votre boutique avant même de commencer.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">Choisissez un univers : l’aperçu change immédiatement. Les images, textes, couleurs, sections et menu restent ensuite entièrement entre vos mains.</p>
        </div>

        <div className="mt-11 grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.95fr)] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#e5e2d7] bg-[#26301b] p-3 shadow-[0_30px_70px_-42px_rgba(37,46,21,.75)] sm:p-4">
            <div className="relative min-h-[440px] overflow-hidden rounded-[1.45rem] bg-[#111] sm:min-h-[500px]">
              <img src={selectedTheme.visual} alt={selectedTheme.visualAlt} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/15 bg-black/20 px-4 py-3 text-white backdrop-blur-sm sm:px-5">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#f1bf64]" /><span className="h-2.5 w-2.5 rounded-full bg-[#dbe6a6]" /><span className="h-2.5 w-2.5 rounded-full bg-white/50" /></div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/85">Aperçu de vitrine</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">{selectedTheme.eyebrow}</p>
                <h3 className="mt-3 max-w-xl font-serif text-3xl font-bold leading-[.98] tracking-[-0.035em] sm:text-5xl">{selectedTheme.label}</h3>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/82 sm:text-base">{selectedTheme.description}</p>
                <div className="mt-6 flex flex-wrap gap-2">{selectedTheme.benefits.map(benefit => <span key={benefit} className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">{benefit}</span>)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-[2rem] border border-[#e7e4d9] bg-[#fbfaf5] p-4 shadow-[0_18px_45px_-36px_rgba(34,43,22,.45)] sm:p-5">
            <div className="flex items-start justify-between gap-4 px-1 pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7a8942]">Prévisualisation en direct</p><p className="mt-1 text-sm leading-5 text-slate-600">10 bases, sans vous enfermer dans un modèle.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e9eed0] text-[#5d6a31]"><Palette className="h-5 w-5" /></span></div>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Choisir un univers de boutique à prévisualiser">{storefrontThemeCatalog.map(theme => {
              const active = theme.id === selectedThemeId;
              return <button key={theme.id} type="button" aria-pressed={active} onClick={() => setSelectedThemeId(theme.id)} className={`group relative flex min-h-[78px] items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#69783c] focus:ring-offset-2 ${active ? "border-[#647336] bg-white shadow-[0_10px_20px_-16px_rgba(64,77,31,.7)]" : "border-[#e6e2d6] bg-white/70 hover:border-[#a9b773] hover:bg-white"}`}>
                <img src={theme.visual} alt="" className="h-14 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
                <span className="min-w-0"><span className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${active ? "text-[#6c7b3d]" : "text-slate-400"}`}>{theme.eyebrow}</span><span className="mt-1 block text-sm font-bold leading-4 text-slate-900">{theme.label}</span></span>
                {active && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-[#5a6834] text-white"><Check className="h-3 w-3" /></span>}
              </button>;
            })}</div>
            <div className="mt-5 rounded-2xl border border-[#e0e4c8] bg-[#f4f7e7] p-4"><p className="text-sm font-bold text-[#35401e]">Une base, jamais une contrainte.</p><p className="mt-1 text-xs leading-5 text-[#596432]">Cet aperçu illustre la direction visuelle. Après création, vous pourrez appliquer, remplacer ou modifier un thème à tout moment depuis votre panneau.</p><button type="button" onClick={onCreateSpace} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#5a6834] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#4b582d]">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></button></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MazighoSaasLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSaasSubdomain = typeof window !== "undefined" && window.location.hostname.toLowerCase() === "pro.mazigho.ch";
  const platformIdentityQuery = trpc.platformIdentity.get.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false });
  const saasLogoUrl = isSaasSubdomain ? (platformIdentityQuery.data?.saas.logoUrl || APP_LOGO) : APP_LOGO;
  const saasFaviconUrl = isSaasSubdomain ? (platformIdentityQuery.data?.saas.faviconUrl || APP_LOGO) : "";
  const landingHomeHref = isSaasSubdomain ? "/" : "/mazigho-saas";
  const platformHref = (path: string) => `https://mazigho.ch${path}`;

  useEffect(() => {
    if (!saasFaviconUrl || typeof document === "undefined") return;
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null ?? document.createElement("link");
    link.rel = "icon";
    link.href = saasFaviconUrl;
    if (!link.parentNode) document.head.appendChild(link);
  }, [saasFaviconUrl]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfaf5] text-slate-950" data-testid="mazigho-saas-landing">
      <header className="sticky top-0 z-50 border-b border-[#e9e6d9]/80 bg-[#fbfaf5]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href={landingHomeHref} aria-label="MAZIGHO SaaS"><Wordmark logoUrl={saasLogoUrl} /></Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation MAZIGHO SaaS">{navigation.map((item) => <a key={item.href} href={item.href} className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#58662f]">{item.label}</a>)}</nav>
          <div className="hidden items-center gap-3 sm:flex"><a href={platformHref("/login")} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-[#f0efe7]">Connexion</a><a href={platformHref("/register")} className="inline-flex min-h-11 items-center rounded-xl bg-[#5a6834] px-4 text-sm font-bold text-white shadow-[0_10px_24px_-13px_rgba(71,83,39,.8)] transition hover:-translate-y-0.5 hover:bg-[#4c592d]">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></a></div>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-[#e4e1d4] bg-white text-slate-800 sm:hidden" aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
        {menuOpen && <div className="border-t border-[#e9e6d9] bg-[#fbfaf5] px-4 py-3 shadow-lg sm:hidden"><nav className="space-y-1" aria-label="Navigation mobile MAZIGHO SaaS">{navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-white">{item.label}</a>)}<a href={platformHref("/login")} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-white">Connexion</a><a href={platformHref("/register")} className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-[#5a6834] px-4 text-sm font-bold text-white">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></a></nav></div>}
      </header>

      <main>
        <section className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[680px] bg-[radial-gradient(circle_at_88%_12%,rgba(227,236,173,.72),transparent_28%),radial-gradient(circle_at_8%_48%,rgba(248,203,132,.25),transparent_23%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-28 lg:pt-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dbe3b3] bg-[#f4f7e6] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#617037]"><Sparkles className="h-3.5 w-3.5" /> E-commerce indépendant, bien accompagné</div>
              <h1 className="mt-6 font-serif text-[2.8rem] font-bold leading-[.98] tracking-[-0.04em] text-[#243019] sm:text-6xl lg:text-[4.15rem]">Votre boutique mérite <span className="text-[#7f9142]">un vrai espace</span> à elle.</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">MAZIGHO réunit la vitrine, le catalogue, le stock et le pilotage de votre boutique dans un espace clair, personnalisable et pensé pour durer.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href={platformHref("/register")} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#5a6834] px-5 text-sm font-bold text-white shadow-[0_16px_30px_-16px_rgba(71,83,39,.85)] transition hover:-translate-y-0.5 hover:bg-[#4b582d]">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></a><a href="#espace" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dcd8c7] bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-[#92a052] hover:bg-[#fcfdf7]">Découvrir votre espace <ChevronRight className="ml-1 h-4 w-4" /></a></div>
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-[#e9e5d8] pt-6"><div><p className="text-xl font-bold tracking-tight text-[#4d5b2e]">100 %</p><p className="mt-1 text-xs leading-4 text-slate-500">univers de vitrine modifiable</p></div><div><p className="text-xl font-bold tracking-tight text-[#4d5b2e]">CHF</p><p className="mt-1 text-xs leading-4 text-slate-500">tarifs simples et lisibles</p></div><div><p className="text-xl font-bold tracking-tight text-[#4d5b2e]">1</p><p className="mt-1 text-xs leading-4 text-slate-500">espace isolé par boutique</p></div></div>
            </div>
            <ProductStudioPreview />
          </div>
        </section>

        <section id="pourquoi" className="border-y border-[#e9e6d9] bg-white/65 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8b40]">Ce qui change vraiment</p><h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#26301b] sm:text-5xl">Une boutique qui vous ressemble, et qui sait travailler.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{outcomes.map((outcome) => { const Icon = outcome.icon; return <article key={outcome.label} className="rounded-2xl border border-[#ece9df] bg-white p-6 shadow-[0_18px_40px_-32px_rgba(29,37,17,.35)]"><div className={`grid h-11 w-11 place-items-center rounded-xl ${outcome.tone}`}><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-lg font-bold text-slate-900">{outcome.label}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{outcome.text}</p></article>; })}</div></div>
        </section>

        <section id="espace" className="bg-[#26301b] py-16 text-white sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[.92fr_1.08fr] lg:items-center lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d5e08e]">Votre espace MAZIGHO</p><h2 className="mt-4 font-serif text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Votre boutique, sans vous perdre dans les réglages.</h2><p className="mt-6 max-w-xl text-base leading-7 text-white/72">Retrouvez votre vitrine, votre catalogue, vos commandes et vos réglages dans un seul panneau clair. Vous gardez la main sur votre contenu, vos images et la présentation de votre boutique.</p><div className="mt-8 space-y-3">{["Thèmes et vitrine entièrement personnalisables", "Produits, variantes, stock et import CSV", "Équipe, accès, pages, SEO et marchés", "Domaine personnalisé quand vous êtes prêt"].map((item) => <div key={item} className="flex items-start gap-3 text-sm leading-6 text-white/85"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#dbe6a6] text-[#35421f]"><Check className="h-3.5 w-3.5" /></span>{item}</div>)}</div></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.075] p-5"><Layers3 className="h-5 w-5 text-[#d5e08e]" /><p className="mt-6 text-sm font-bold">Un espace à votre image</p><p className="mt-2 text-xs leading-5 text-white/60">Votre boutique, vos produits, vos contenus et vos réglages restent séparés et vous appartiennent.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.075] p-5"><FileSpreadsheet className="h-5 w-5 text-[#f6c76e]" /><p className="mt-6 text-sm font-bold">Importer sans repartir de zéro</p><p className="mt-2 text-xs leading-5 text-white/60">Préparez les produits et les variantes par fichier, puis reprenez la main dans l’éditeur.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.075] p-5 sm:col-span-2"><div className="flex items-start gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#718348] text-white"><Clock3 className="h-5 w-5" /></div><div><p className="text-sm font-bold">Une ouverture à votre rythme</p><p className="mt-1 text-xs leading-5 text-white/60">Votre boutique peut être préparée avant le domaine ou l’ouverture publique. Rien ne vous force à aller trop vite.</p></div></div></div></div></div>
        </section>

        <ThemeLivePreview onCreateSpace={() => { window.location.href = platformHref("/register"); }} />

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8b40]">Une méthode claire</p><h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#26301b] sm:text-5xl">De l’idée à la vitrine, sans vous enfermer.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Vous partez d’une base soignée. Après, la boutique reste librement ajustable.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{steps.map((step) => <article key={step.number} className="relative rounded-2xl border border-[#e7e4d9] bg-[#fffefb] p-6"><p className="text-sm font-bold text-[#a56a1b]">{step.number}</p><h3 className="mt-9 text-xl font-bold text-slate-900">{step.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p><span className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#f1f2e7] text-[#66743c]"><ArrowUpRight className="h-4 w-4" /></span></article>)}</div></div>
        </section>

        <section id="tarifs" className="border-y border-[#e9e6d9] bg-[#f3f2e9] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7b8b40]">Tarifs officiels</p><h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#26301b] sm:text-5xl">Choisissez l’élan qui vous convient.</h2><p className="mt-4 text-sm leading-6 text-slate-600">Des conditions affichées clairement, en CHF, pour avancer à votre rythme.</p></div><div className="mt-11 grid gap-5 lg:grid-cols-3">{plans.map((plan) => <article key={plan.name} className={`relative flex flex-col rounded-[1.6rem] border p-6 ${plan.featured ? "border-[#556531] bg-[#556531] text-white shadow-[0_24px_45px_-26px_rgba(48,60,28,.8)]" : "border-[#dfddcf] bg-[#fffefb] text-slate-950"}`}>{plan.featured && <div className="absolute -top-3 left-6 rounded-full bg-[#f4c56d] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#594012]">Le plus équilibré</div>}<p className={`text-xs font-bold uppercase tracking-[0.16em] ${plan.featured ? "text-[#dce8a2]" : "text-[#7d8b45]"}`}>{plan.name}</p><div className="mt-5 flex items-end gap-2"><p className="font-serif text-5xl font-bold tracking-[-0.04em]">{plan.price}</p><p className={`pb-1 text-sm font-semibold ${plan.featured ? "text-white/75" : "text-slate-500"}`}>{plan.suffix}</p></div><p className={`mt-2 text-sm font-bold ${plan.featured ? "text-[#f5c96f]" : "text-[#a46716]"}`}>{plan.commission}</p><p className={`mt-5 min-h-12 text-sm leading-6 ${plan.featured ? "text-white/72" : "text-slate-600"}`}>{plan.description}</p><ul className="mt-6 space-y-3">{plan.features.map((feature) => <li key={feature} className={`flex gap-2 text-sm ${plan.featured ? "text-white/88" : "text-slate-700"}`}><Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-[#dce8a2]" : "text-[#7c8b43]"}`} />{feature}</li>)}</ul><a href={platformHref("/register")} className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition ${plan.featured ? "bg-white text-[#4a582c] hover:bg-[#f4f7e6]" : "border border-[#d8d5c6] bg-white text-slate-800 hover:border-[#90a051] hover:bg-[#fbfcf5]"}`}>Commencer avec {plan.name} <ArrowRight className="ml-2 h-4 w-4" /></a></article>)}</div><div className="mx-auto mt-8 flex max-w-4xl gap-3 rounded-2xl border border-[#dedccf] bg-white/70 p-4 text-left text-xs leading-5 text-slate-600"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#68763c]" /><p><strong className="text-slate-800">Lancement progressif :</strong> les ventes clientes par Stripe Connect et la facturation SaaS par Lemon Squeezy avancent d’abord par une validation contrôlée. Le passage en production suivra les essais complets, la revue opérationnelle et l’activation dédiée.</p></div></div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#26301b] px-6 py-10 text-white sm:px-10 sm:py-14"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d5e08e]">Prêt à poser les bases ?</p><h2 className="mt-4 font-serif text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Votre prochaine boutique peut déjà prendre forme.</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/70">Créez votre espace MAZIGHO. Vous pourrez préparer, personnaliser et faire évoluer votre projet sans repartir de zéro.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><a href={platformHref("/register")} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#f2c36b] px-5 text-sm font-bold text-[#493715] transition hover:bg-[#ffcf78]">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></a><a href={platformHref("/contact")} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-bold text-white transition hover:bg-white/10">Parler de mon projet</a></div></div></div></section>
      </main>

      <footer className="border-t border-[#e9e6d9] bg-[#fffefb]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><Wordmark compact logoUrl={saasLogoUrl} /><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><a href={platformHref("/")}>La boutique MAZIGHO</a><a href={platformHref("/contact")}>Contact</a><a href={platformHref("/confidentialite")}>Confidentialité</a><a href={platformHref("/conditions-generales")}>Conditions</a></div><p className="text-xs text-slate-400">© {new Date().getFullYear()} MAZIGHO</p></div></footer>
    </div>
  );
}
