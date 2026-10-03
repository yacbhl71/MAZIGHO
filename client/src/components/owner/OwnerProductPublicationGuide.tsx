import { CheckCircle2, Circle, ImagePlus, SearchCheck, Sparkles } from "lucide-react";
import type { ProductPublicationInput } from "@/lib/productPublicationReadiness";
import { getProductPublicationReadiness } from "@/lib/productPublicationReadiness";

type Props = {
  product: ProductPublicationInput;
  brandName: string;
  primaryDomain?: string | null;
};

function scoreClasses(score: number) {
  if (score === 100) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (score >= 70) return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-slate-200 bg-slate-50 text-slate-900";
}

export default function OwnerProductPublicationGuide({ product, brandName, primaryDomain }: Props) {
  const readiness = getProductPublicationReadiness(product);
  const title = product.name.trim() ? `${product.name.trim()} | ${brandName}` : `Titre du produit | ${brandName}`;
  const domain = primaryDomain || "votre-boutique.example";

  return <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-5" aria-label="Qualité de la fiche produit">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold text-violet-950"><Sparkles className="h-4 w-4 text-violet-700" /> Qualité de la fiche</p>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-violet-900">Une aide de rédaction locale : elle vérifie les éléments utiles à un client et à la recherche, sans publier ni modifier votre produit.</p>
      </div>
      <div className={`w-fit rounded-xl border px-3 py-2 text-right ${scoreClasses(readiness.score)}`}>
        <p className="text-lg font-bold">{readiness.score} %</p>
        <p className="text-xs font-semibold">{readiness.status}</p>
      </div>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.9fr)]">
      <div className="grid gap-2 sm:grid-cols-2">
        {readiness.checks.map(check => <div key={check.id} className={`flex min-h-12 items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${check.complete ? "border-emerald-200 bg-white text-emerald-950" : "border-slate-200 bg-white/70 text-slate-700"}`}>
          {check.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />}
          <span><strong className="block text-sm">{check.label}</strong>{check.complete ? "Prêt." : check.recommendation}</span>
        </div>)}
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><SearchCheck className="h-4 w-4 text-violet-700" /> Aperçu de recherche</p>
        <p className="mt-4 break-all text-xs text-emerald-700">https://{domain}/produit/{product.name.trim() ? "…" : "votre-produit"}</p>
        <p className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-blue-700">{title}</p>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{readiness.searchDescription}</p>
        <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500"><ImagePlus className="mt-0.5 h-4 w-4 shrink-0" />Un visuel, une accroche et une description détaillée facilitent la découverte du produit.</p>
      </aside>
    </div>

    {readiness.activeWithoutEssentials ? <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950"><strong>Vérification conseillée :</strong> le statut est « Actif », mais une information essentielle manque encore. Vous pouvez conserver le brouillon le temps de compléter la fiche.</p> : null}
  </section>;
}
