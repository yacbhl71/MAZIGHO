import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, Check, Sparkles, Store } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

const categoryAccents = [
  "bg-orange-50 text-orange-700",
  "bg-sky-50 text-sky-700",
  "bg-rose-50 text-rose-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
];

export default function Shop() {
  const categoriesQuery = trpc.categories.getAll.useQuery();
  const categories = categoriesQuery.data || [];

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-slate-900">
      <Header />

      <main>
        <section className="relative min-h-[430px] overflow-hidden bg-slate-950 md:min-h-[500px]">
          <img src="/assets/shop-editorial-hero.jpg" alt="Sélection lifestyle de la boutique MAZIGHO" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-slate-950/10" />
          <div className="relative flex min-h-[430px] items-center px-6 py-16 md:min-h-[500px] md:px-12 lg:px-20">
            <div className="max-w-2xl text-white">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">La sélection MAZIGHO</p>
              <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">Notre Boutique</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85 md:text-xl">Des univers choisis avec soin pour trouver plus vite les objets qui rendent le quotidien plus simple et plus beau.</p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
                <a href="#categories" className="inline-flex items-center gap-2 bg-orange-500 px-6 py-3 text-white hover:bg-orange-600">Explorer les catégories <ArrowRight className="h-4 w-4" /></a>
                <Link href="/best-sellers" className="inline-flex items-center gap-2 border border-white/60 bg-white/10 px-6 py-3 text-white hover:bg-white/20">Voir les best-sellers <ArrowUpRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#eadfd2] bg-white/80">
          <div className="container grid gap-0 md:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-[#eadfd2] py-5 md:border-b-0 md:border-r md:pr-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600"><Sparkles className="h-4 w-4" /></div>
              <p className="text-sm font-semibold">Sélection éditoriale</p>
            </div>
            <div className="flex items-center gap-3 border-b border-[#eadfd2] py-5 md:border-b-0 md:border-r md:px-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700"><Check className="h-4 w-4" /></div>
              <p className="text-sm font-semibold">Prix affichés en CHF</p>
            </div>
            <div className="flex items-center gap-3 py-5 md:pl-8">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Store className="h-4 w-4" /></div>
              <p className="text-sm font-semibold">Livraison Suisse & Europe</p>
            </div>
          </div>
        </section>

        <section id="categories" className="py-16 md:py-24">
          <div className="container">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">Explorer par univers</p>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Trouvez ce qui vous ressemble</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">Des catégories claires, des sélections utiles et une expérience pensée pour passer simplement de l'inspiration à la découverte.</p>
              </div>
              <Link href="/nouveautes" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-orange-600">Voir les nouveautés <ArrowUpRight className="h-4 w-4" /></Link>
            </div>

            {categoriesQuery.isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-orange-500" /></div>
            ) : categories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => (
                  <Link key={category.id} href={`/categorie/${category.slug}`}>
                    <article className="group flex min-h-[142px] items-center gap-5 border border-[#eadfd2] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl md:p-6">
                      <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${categoryAccents[index % categoryAccents.length]}`}>
                        <span className="text-3xl leading-none" aria-hidden="true">{category.icon || "✦"}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-orange-600">{category.name}</h2>
                        {category.description && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{category.description}</p>}
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-600">Découvrir <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#d9cbbc] bg-white/70 px-6 py-12 text-center text-sm text-slate-500">Aucune catégorie disponible pour le moment.</div>
            )}
          </div>
        </section>

        <section className="border-y border-[#eadfd2] bg-[#f1ebe4] py-12 md:py-16">
          <div className="container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">Besoin d'inspiration ?</p>
              <h2 className="text-2xl font-semibold text-slate-950 md:text-3xl">Commencez par les produits les plus appréciés.</h2>
            </div>
            <Link href="/best-sellers" className="inline-flex shrink-0 items-center justify-center gap-2 bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600">Découvrir les best-sellers <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
