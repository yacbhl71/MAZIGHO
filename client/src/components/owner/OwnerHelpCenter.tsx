import { useMemo, useState } from "react";
import { ArrowRight, BookOpenCheck, CircleHelp, LifeBuoy, Search, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  findOwnerHelpArticles,
  ownerHelpCategories,
  ownerHelpCategoryLabels,
  type OwnerHelpCategory,
  type OwnerHelpModuleId,
} from "@shared/ownerHelpArticles";

type OwnerHelpCenterProps = {
  onNavigate: (module: OwnerHelpModuleId) => void;
  onOpenSupport: () => void;
};

export default function OwnerHelpCenter({ onNavigate, onOpenSupport }: OwnerHelpCenterProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<OwnerHelpCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>("prepare-opening");
  const articles = useMemo(() => findOwnerHelpArticles(query, category), [category, query]);

  return <div className="space-y-5" data-testid="owner-help-center">
    <Card className="overflow-hidden border-teal-200 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="outline" className="border-teal-200 bg-white text-teal-900">Guides de votre boutique</Badge>
            <CardTitle className="mt-3 flex items-center gap-2 text-2xl text-slate-950"><BookOpenCheck className="h-6 w-6 text-teal-700" /> Aide & prise en main</CardTitle>
            <CardDescription className="mt-2 max-w-3xl text-sm leading-6">Retrouvez les étapes utiles pour faire avancer votre boutique. Les guides ouvrent uniquement les modules déjà disponibles dans votre espace et ne modifient rien par eux-mêmes.</CardDescription>
          </div>
          <div className="rounded-xl border border-teal-200 bg-white/80 p-3 text-xs leading-5 text-teal-950 md:max-w-xs"><ShieldCheck className="mb-1.5 h-4 w-4 text-teal-700" /><p className="font-semibold">Protégez vos accès</p><p className="mt-1">Ne partagez jamais de mot de passe, clé API, code de paiement ou donnée client dans un message d’assistance.</p></div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <QuickAction title="Je prépare mon ouverture" text="Checklist, contrôles locaux et prochaine étape Studio." onClick={() => onNavigate("readiness")} />
        <QuickAction title="Je travaille mon catalogue" text="Produits, variantes, images et stock." onClick={() => onNavigate("catalogue")} />
        <QuickAction title="Je personnalise ma vitrine" text="Thème, couleurs, images, textes et menu." onClick={() => onNavigate("vitrine")} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CircleHelp className="h-5 w-5 text-teal-700" /> Trouver une réponse</CardTitle>
        <CardDescription>Recherchez un sujet ou parcourez les guides par thème. Aucun suivi de recherche n’est créé.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={event => setQuery(event.target.value)} className="min-h-11 bg-white pl-9" placeholder="Ex. domaine, couleur, stock, livraison…" aria-label="Rechercher dans l’aide" />{query && <button type="button" className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setQuery("")} aria-label="Effacer la recherche"><X className="h-4 w-4" /></button>}</div>
          <select value={category} onChange={event => setCategory(event.target.value as OwnerHelpCategory | "all")} className="min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900" aria-label="Filtrer les guides par thème"><option value="all">Tous les sujets</option>{ownerHelpCategories.map(value => <option key={value} value={value}>{ownerHelpCategoryLabels[value]}</option>)}</select>
        </div>

        {articles.length ? <div className="grid gap-3 xl:grid-cols-2">{articles.map(article => {
          const expanded = expandedId === article.id;
          return <article key={article.id} className={`rounded-2xl border p-4 transition-colors ${expanded ? "border-teal-300 bg-teal-50/60" : "border-slate-200 bg-white hover:border-teal-200"}`}>
            <button type="button" className="flex w-full items-start justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2" onClick={() => setExpandedId(current => current === article.id ? null : article.id)} aria-expanded={expanded}>
              <div><Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{ownerHelpCategoryLabels[article.category]}</Badge><h3 className="mt-3 text-base font-bold text-slate-950">{article.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p></div><span className={`mt-1 text-lg font-bold text-teal-800 transition-transform ${expanded ? "rotate-45" : ""}`} aria-hidden="true">+</span>
            </button>
            {expanded && <div className="mt-4 border-t border-teal-100 pt-4"><ol className="space-y-3">{article.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>)}</ol>{article.caution && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><strong>À retenir :</strong> {article.caution}</div>}<Button type="button" variant="outline" className="mt-4 min-h-11 border-teal-300 bg-white text-teal-900 hover:bg-teal-100" onClick={() => onNavigate(article.target)}>{article.actionLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
          </article>;
        })}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><CircleHelp className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 font-semibold text-slate-950">Aucun guide ne correspond à cette recherche.</p><p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-600">Essayez un terme plus simple, choisissez un autre thème ou ouvrez l’assistance si votre situation est particulière.</p><Button type="button" variant="outline" className="mt-4 min-h-11 bg-white" onClick={() => { setQuery(""); setCategory("all"); }}>Voir tous les guides</Button></div>}
      </CardContent>
    </Card>

    <Card className="border-sky-200 bg-sky-50/60"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><LifeBuoy className="mt-0.5 h-5 w-5 shrink-0 text-sky-800" /><div><p className="font-semibold text-sky-950">Votre cas n’est pas couvert par un guide ?</p><p className="mt-1 max-w-3xl text-sm leading-6 text-sky-900">Ouvrez une demande isolée pour votre boutique. Le ticket n’accorde aucun accès à votre compte et la réponse reste visible dans votre panneau.</p></div></div><Button type="button" className="min-h-11 shrink-0 bg-sky-700 hover:bg-sky-800" onClick={onOpenSupport}>Contacter l’assistance <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>
  </div>;
}

function QuickAction({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-28 rounded-xl border border-teal-100 bg-white/80 p-4 text-left transition-colors hover:border-teal-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"><p className="font-semibold text-slate-950">{title}</p><p className="mt-2 text-xs leading-5 text-slate-600">{text}</p><span className="mt-3 inline-flex items-center text-xs font-bold text-teal-800">Ouvrir <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></button>;
}
