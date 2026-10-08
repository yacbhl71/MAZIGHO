import { Link } from "wouter";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Globe2,
  ImagePlus,
  Layers3,
  LockKeyhole,
  Menu,
  PackageCheck,
  Palette,
  PencilRuler,
  ShieldCheck,
  Sparkles,
  Store,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { APP_LOGO } from "@/const";

const deliveryItems = [
  {
    icon: Palette,
    title: "Une direction visuelle cohérente",
    text: "Un thème, une palette, des pages et une vitrine adaptés au projet — tout reste ajustable après livraison.",
  },
  {
    icon: PackageCheck,
    title: "Un catalogue prêt à travailler",
    text: "Produits, catégories, images, variantes, prix et stock peuvent être préparés avant la remise des accès.",
  },
  {
    icon: Globe2,
    title: "Un cadre adapté au marché choisi",
    text: "Pays, langue, devise, livraison et méthode de paiement se configurent selon la situation réelle du futur propriétaire.",
  },
  {
    icon: UserRoundCheck,
    title: "Un espace propriétaire transmis",
    text: "Le client reçoit son panneau de gestion pour piloter les contenus, commandes, catalogue et réglages de sa boutique.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    title: "Cadrer le projet",
    text: "Activité, pays de vente, univers, catalogue de départ et niveau de préparation sont définis ensemble.",
    icon: PencilRuler,
  },
  {
    number: "02",
    title: "Construire une première version",
    text: "MAZIGHO Studio prépare la boutique : identité, structure, thème, contenus et produits de démonstration ou réels.",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Vérifier puis transmettre",
    text: "La boutique est revue en privé. Les accès propriétaire sont ensuite remis avec un espace déjà organisé.",
    icon: ClipboardCheck,
  },
  {
    number: "04",
    title: "Ouvrir au bon moment",
    text: "Le domaine, les réglages de vente et la publication ne sont activés que lorsque le projet est prêt.",
    icon: Globe2,
  },
] as const;

const themes = [
  { name: "Studio Flux", label: "Éditorial & premium", image: "/assets/themes/studio-flux/hero.webp" },
  { name: "Glamour Noir", label: "Beauté & signature", image: "/assets/themes/glamour-noir/glamour-noir-hero.webp" },
  { name: "Galerie Signature", label: "Création & collection", image: "/assets/themes/galerie-signature/hero.webp" },
] as const;

function Wordmark() {
  return <div className="flex items-center gap-2.5"><img src={APP_LOGO} alt="MAZIGHO" className="h-9 w-9 object-contain" /><div className="leading-none"><p className="font-serif text-xl font-bold tracking-[0.12em] text-slate-950">MAZIGH<span className="text-[#a6652e]">O</span></p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Boutiques clé en main</p></div></div>;
}

function ProjectPreview() {
  return <div className="relative mx-auto w-full max-w-[615px]" aria-label="Aperçu illustratif d’un projet de boutique préparé dans MAZIGHO Studio">
    <div className="absolute -left-10 top-10 h-52 w-52 rounded-full bg-[#e7c5a3]/55 blur-3xl" aria-hidden="true" />
    <div className="absolute -bottom-12 -right-8 h-56 w-56 rounded-full bg-[#c6d9bf]/55 blur-3xl" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-[2rem] border border-[#e8ddd1] bg-[#fffdf9] p-2 shadow-[0_35px_80px_-35px_rgba(72,47,29,.42)]">
      <div className="overflow-hidden rounded-[1.55rem] border border-[#eee5dc] bg-white">
        <div className="flex items-center justify-between border-b border-[#efe8e0] px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#db8f55]" /><span className="h-2.5 w-2.5 rounded-full bg-[#8aa67c]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ddd5cc]" /></div><p className="rounded-full bg-[#faf0e5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#88552d]">Projet de boutique</p></div>
        <div className="grid min-h-[365px] grid-cols-[64px_1fr] sm:grid-cols-[108px_1fr]">
          <aside className="border-r border-[#eee8e0] bg-[#fbf8f4] px-2 py-4 sm:px-3"><div className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-[#8d5430] text-white"><Store className="h-4 w-4" /></div><div className="mt-6 space-y-3">{[Layers3, PackageCheck, ImagePlus, Globe2].map((Icon, index) => <div key={index} className={`mx-auto grid h-8 w-8 place-items-center rounded-lg ${index === 0 ? "bg-[#f2dfcd] text-[#8d5430]" : "text-slate-400"}`}><Icon className="h-4 w-4" /></div>)}</div><div className="mt-8 hidden border-t border-[#eae3db] pt-4 sm:block"><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Transmission</p><p className="mt-2 text-[10px] font-semibold text-slate-700">Accès propriétaire</p></div></aside>
          <div className="min-w-0 bg-[#fffefd] p-4 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a6652e]">Tableau de préparation</p><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950 sm:text-2xl">Maison Nacrée</h2></div><span className="rounded-full border border-[#d5e6d1] bg-[#f0f8ef] px-2.5 py-1 text-[9px] font-bold text-[#4c7543]">Prête à revoir</span></div><div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">{[{ label: "Thème", value: "Choisi" }, { label: "Produits", value: "24" }, { label: "Domaine", value: "À lier" }].map(item => <div key={item.label} className="rounded-xl border border-[#eee7df] bg-[#fcfaf7] p-2.5 sm:p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p><p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm">{item.value}</p></div>)}</div><div className="mt-5 rounded-2xl border border-[#eadfd3] bg-[#fcf7f0] p-3.5 sm:p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold text-slate-900">Parcours de remise</p><p className="mt-0.5 text-[10px] text-slate-500">Une version privée, puis une transmission guidée.</p></div><p className="text-xs font-bold text-[#8d5430]">4 / 5</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eadfd3]"><div className="h-full w-4/5 rounded-full bg-[#b46b39]" /></div><div className="mt-3 space-y-2">{["Univers et pages", "Catalogue de départ", "Accès propriétaire"].map((item, index) => <div key={item} className="flex items-center gap-2 text-[10px] text-slate-600"><Check className={`h-3.5 w-3.5 ${index < 2 ? "text-[#5f8c57]" : "text-slate-300"}`} />{item}</div>)}</div></div><div className="mt-5 rounded-2xl bg-[#25221e] p-3.5 text-white"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/55">Toujours modifiable</p><p className="mt-1 text-xs font-semibold">Le client prend ensuite la main sur son espace.</p></div></div>
        </div>
      </div>
    </div>
    <div className="absolute -bottom-5 left-3 flex max-w-[225px] items-center gap-3 rounded-2xl border border-[#e6d8ca] bg-white px-3.5 py-3 shadow-lg shadow-[#7d4a2a]/10 sm:-left-7"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#faeadb] text-[#96592f]"><UserRoundCheck className="h-4 w-4" /></span><p className="text-[10px] font-semibold leading-4 text-slate-700">Un projet préparé, puis remis au bon propriétaire.</p></div>
  </div>;
}

export default function BoutiqueKeyInHandLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const contactHref = "https://mazigho.ch/contact";

  return <div className="min-h-screen overflow-x-hidden bg-[#fffdf9] text-slate-950" data-testid="boutique-key-in-hand-landing">
    <header className="sticky top-0 z-50 border-b border-[#ebe2d8]/85 bg-[#fffdf9]/92 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8"><Link href="/mazigho-saas" aria-label="Retour à MAZIGHO Pro"><Wordmark /></Link><nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation service boutiques clé en main"><a href="#livraison" className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#92562e]">Ce qui est préparé</a><a href="#parcours" className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#92562e]">Le parcours</a><a href="#themes" className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#92562e]">Univers visuels</a><a href="#clarte" className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#92562e]">Ce qui reste à votre main</a></nav><div className="hidden items-center gap-3 sm:flex"><a href="/mazigho-saas" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-[#f5eee7]">MAZIGHO Pro</a><a href={contactHref} className="inline-flex min-h-11 items-center rounded-xl bg-[#8d5430] px-4 text-sm font-bold text-white shadow-[0_12px_26px_-15px_rgba(100,57,30,.85)] transition hover:-translate-y-0.5 hover:bg-[#714124]">Parler de mon projet <ArrowRight className="ml-2 h-4 w-4" /></a></div><button type="button" className="grid h-11 w-11 place-items-center rounded-xl border border-[#e8ddd2] bg-white text-slate-800 sm:hidden" aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setMenuOpen(open => !open)}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>{menuOpen && <div className="border-t border-[#ebe2d8] bg-[#fffdf9] px-4 py-3 shadow-lg sm:hidden"><nav className="space-y-1" aria-label="Navigation mobile service boutiques clé en main">{[["Ce qui est préparé", "#livraison"], ["Le parcours", "#parcours"], ["Univers visuels", "#themes"], ["Ce qui reste à votre main", "#clarte"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-white">{label}</a>)}<a href={contactHref} className="mt-2 flex min-h-11 items-center justify-center rounded-xl bg-[#8d5430] px-4 text-sm font-bold text-white">Parler de mon projet <ArrowRight className="ml-2 h-4 w-4" /></a></nav></div>}</header>

    <main>
      <section className="relative isolate overflow-hidden"><div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(circle_at_82%_14%,rgba(235,205,174,.72),transparent_28%),radial-gradient(circle_at_10%_52%,rgba(201,220,193,.48),transparent_24%)]" /><div className="mx-auto grid max-w-7xl gap-14 px-4 pb-24 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[.93fr_1.07fr] lg:items-center lg:gap-12 lg:px-8 lg:pb-28 lg:pt-24"><div className="max-w-2xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#ead8c8] bg-[#fdf2e8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#8d5430]"><Sparkles className="h-3.5 w-3.5" /> Service de création clé en main</div><h1 className="mt-6 font-serif text-[2.9rem] font-bold leading-[.98] tracking-[-0.045em] text-[#28231f] sm:text-6xl lg:text-[4.25rem]">Une boutique pensée pour <span className="text-[#a66235]">votre projet</span>, pas un modèle à subir.</h1><p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">MAZIGHO prépare une boutique e-commerce complète à partir de votre activité, de votre univers et de votre marché. Vous recevez un espace isolé, déjà structuré, que vous pourrez ensuite administrer vous-même.</p><div className="mt-7 flex items-start gap-3 rounded-2xl border border-[#dbe6d6] bg-[#f4faf2] p-4 text-sm leading-6 text-[#315233]"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#528350]" /><p><strong>Une base sérieuse, sans précipitation.</strong> La boutique est préparée et revue en privé. Domaine, vente publique et paiements ne sont configurés qu’au moment choisi avec le futur propriétaire.</p></div><div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href={contactHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#8d5430] px-5 text-sm font-bold text-white shadow-[0_16px_30px_-16px_rgba(112,62,30,.82)] transition hover:-translate-y-0.5 hover:bg-[#704023]">Parler de mon projet <ArrowRight className="ml-2 h-4 w-4" /></a><a href="#parcours" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#e2d7cc] bg-white px-5 text-sm font-bold text-slate-800 transition hover:border-[#bb8b68] hover:bg-[#fffaf6]">Voir le parcours <ChevronDown className="ml-2 h-4 w-4" /></a></div><div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-[#e9e1d8] pt-6"><div><p className="text-xl font-bold tracking-tight text-[#8d5430]">1</p><p className="mt-1 text-xs leading-4 text-slate-500">boutique isolée par projet</p></div><div><p className="text-xl font-bold tracking-tight text-[#8d5430]">12</p><p className="mt-1 text-xs leading-4 text-slate-500">univers visuels à faire évoluer</p></div><div><p className="text-xl font-bold tracking-tight text-[#8d5430]">100 %</p><p className="mt-1 text-xs leading-4 text-slate-500">contenus administrables</p></div></div></div><ProjectPreview /></div></section>

      <section id="livraison" className="border-y border-[#ece3da] bg-white/75 py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66235]">Une prestation qui construit vraiment</p><h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#28231f] sm:text-5xl">Ce qui peut être préparé avant la remise des accès.</h2></div><p className="max-w-sm text-sm leading-6 text-slate-500">Le point de départ est utile et concret : ce n’est pas une installation vide à terminer seul.</p></div><div className="mt-10 grid gap-4 md:grid-cols-2">{deliveryItems.map(item => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-[#eee6df] bg-[#fffdf9] p-6 shadow-[0_18px_40px_-34px_rgba(61,40,24,.36)]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f7e8da] text-[#96592f]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-bold text-slate-900">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p></article>; })}</div></div></section>

      <section id="parcours" className="bg-[#29251f] py-16 text-white sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e9b58a]">Un parcours clair</p><h2 className="mt-4 font-serif text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">De votre idée à une boutique prête à être transmise.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Chaque étape reste vérifiable. Vous voyez ce qui est préparé, ce qui attend votre décision et ce qui sera ensuite géré par le futur propriétaire.</p></div><div className="mt-11 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{processSteps.map(step => { const Icon = step.icon; return <article key={step.number} className="rounded-2xl border border-white/10 bg-white/[.055] p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-bold text-[#f0bd91]">{step.number}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-[#eac49e]"><Icon className="h-4 w-4" /></span></div><h3 className="mt-8 text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-white/65">{step.text}</p></article>; })}</div></div></section>

      <section id="themes" className="py-16 sm:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66235]">Une direction visuelle, pas une prison</p><h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-[#28231f] sm:text-5xl">Une base qui donne envie de commencer.</h2><p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">Le thème aide à démarrer vite. Les images, couleurs, textes, sections, menus et produits sont ensuite modifiables depuis l’espace de la boutique.</p></div><div className="mt-11 grid gap-5 md:grid-cols-3">{themes.map(theme => <article key={theme.name} className="group overflow-hidden rounded-[1.6rem] border border-[#ece3da] bg-white shadow-[0_20px_45px_-36px_rgba(77,49,28,.45)]"><div className="relative h-56 overflow-hidden"><img src={theme.image} alt={`Aperçu illustratif du thème ${theme.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /><p className="absolute bottom-4 left-5 text-xs font-bold uppercase tracking-[0.16em] text-white/75">{theme.label}</p></div><div className="p-5"><h3 className="text-xl font-bold text-slate-950">{theme.name}</h3><p className="mt-2 text-sm leading-6 text-slate-600">Un point de départ visuel à adapter au métier, aux contenus et à l’identité du projet.</p></div></article>)}</div></div></section>

      <section id="clarte" className="border-y border-[#eae1d8] bg-[#f7f3ee] py-16 sm:py-24"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:items-start lg:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a66235]">Des responsabilités claires</p><h2 className="mt-3 max-w-2xl font-serif text-4xl font-bold tracking-[-0.035em] text-[#28231f] sm:text-5xl">Vous livrez une boutique préparée. Le propriétaire décide de son activité.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">MAZIGHO facilite la création et l’organisation. Le futur propriétaire conserve ensuite la maîtrise de ses contenus, produits, fournisseurs, règles commerciales et décisions d’ouverture.</p><a href={contactHref} className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[#8d5430] px-5 text-sm font-bold text-white transition hover:bg-[#714124]">Présenter mon projet <ArrowRight className="ml-2 h-4 w-4" /></a></div><div className="space-y-3"><div className="rounded-2xl border border-[#dce8d8] bg-[#f4faf2] p-5"><p className="flex items-center gap-2 text-sm font-bold text-[#315233]"><Check className="h-4 w-4" /> Préparé dans la boutique</p><ul className="mt-4 space-y-2 text-sm leading-6 text-[#476148]"><li>• univers, pages, catalogue et médias de départ ;</li><li>• structure de gestion et accès propriétaire ;</li><li>• réglages à finaliser de manière guidée.</li></ul></div><div className="rounded-2xl border border-[#ead9ca] bg-[#fffaf5] p-5"><p className="flex items-center gap-2 text-sm font-bold text-[#754224]"><LockKeyhole className="h-4 w-4" /> Décidé par le futur propriétaire</p><ul className="mt-4 space-y-2 text-sm leading-6 text-[#7d5945]"><li>• conformité, fiscalité et légalité selon son pays ;</li><li>• fournisseurs, prix finaux et informations produit ;</li><li>• méthode de paiement et ouverture publique.</li></ul></div></div></div></section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#8d5430] px-6 py-10 text-white shadow-[0_30px_60px_-35px_rgba(111,61,30,.85)] sm:px-10 sm:py-14"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f3d5bc]">Un projet, une direction, une boutique</p><h2 className="mt-4 font-serif text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-5xl">Parlons de la boutique que vous voulez réellement vendre.</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/75">Présentez votre activité et votre marché. Nous pourrons définir une première version de boutique, son univers et ce qui doit être prêt à la remise des accès.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><a href={contactHref} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-[#754224] transition hover:bg-[#fff4ea]">Parler de mon projet <ArrowRight className="ml-2 h-4 w-4" /></a><a href="/mazigho-saas" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-bold text-white transition hover:bg-white/10">Découvrir MAZIGHO Pro</a></div></div></div></section>
    </main>

    <footer className="border-t border-[#ebe2d8] bg-[#fffdf9]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><Wordmark /><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500"><a href="/mazigho-saas">MAZIGHO Pro</a><a href={contactHref}>Contact</a><a href="https://mazigho.ch/confidentialite">Confidentialité</a><a href="https://mazigho.ch/conditions-generales">Conditions</a></div><p className="text-xs text-slate-400">© {new Date().getFullYear()} MAZIGHO</p></div></footer>
  </div>;
}
