import { ArrowRight, FileText, Globe2, ImagePlus, LockKeyhole, Sparkles } from "lucide-react";

const capabilities = [
  {
    icon: Sparkles,
    title: "Décrire et améliorer",
    text: "Préparez des descriptions de produits, du SEO, une FAQ ou une traduction à relire avant de l’utiliser.",
  },
  {
    icon: ImagePlus,
    title: "Partir d’un visuel",
    text: "Ajoutez une image ou son URL HTTPS pour obtenir des suggestions de titre, de description et de texte alternatif.",
  },
  {
    icon: FileText,
    title: "Retrouver vos sources",
    text: "Importez PDF, DOCX, TXT ou CSV, recherchez dans vos documents privés et citez-les dans vos brouillons.",
  },
  {
    icon: Globe2,
    title: "Étudier une page",
    text: "Analysez explicitement une page HTTPS accessible ou collez son texte ; la réponse indique la source utilisée.",
  },
] as const;

export default function SaasAICopilotSection({ registerHref }: { registerHref: string }) {
  return (
    <section id="assistant-ia" className="scroll-mt-20 border-b border-[#e9e6d9] bg-[#f7f6ec] py-16 sm:py-24" aria-labelledby="assistant-ia-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#dae4b0] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[#5b6b34]"><Sparkles className="h-4 w-4" /> Assistant IA de votre boutique</p>
            <h2 id="assistant-ia-title" className="mt-5 font-serif text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-[#26301b] sm:text-5xl">Moins de page blanche. <span className="text-[#819247]">Toujours votre dernier mot.</span></h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600 sm:text-base">Depuis le panneau privé de votre boutique, demandez des idées de contenus, consultez vos documents et préparez des brouillons. L’assistant ne publie pas à votre place : vous relisez, corrigez et décidez.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(item => {
            const Icon = item.icon;
            return <article key={item.title} className="rounded-2xl border border-[#e5e6d8] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(29,37,17,.38)]"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e8eed5] text-[#5b6a32]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 text-lg font-bold text-[#26301b]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p></article>;
          })}
        </div>
        <p className="mt-5 max-w-4xl text-xs leading-5 text-slate-500">L’assistant IA propose, vous gardez le contrôle : aucune publication ni modification n’est automatisée sans validation humaine. Quotas mensuels appliqués selon votre plan (40 en FREE, 400 en BASIC, 1 200 en PRO).</p>
        <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-[#dce3c3] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-[#46572b]"><LockKeyhole className="h-4 w-4" /> Privé, contrôlé, par boutique</p>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-600">Les résultats sont des propositions à vérifier. Les requêtes IA sont plafonnées selon l’offre ; certaines pages externes peuvent refuser l’analyse automatique. Aucune fiche ni commande n’est modifiée sans votre action.</p>
          </div>
          <a href={registerHref} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#5a6834] px-4 text-sm font-bold text-white transition hover:bg-[#4b582d]">Créer mon espace <ArrowRight className="ml-2 h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}
