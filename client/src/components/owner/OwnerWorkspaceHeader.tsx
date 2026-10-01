import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Menu, Search, Settings2, X } from "lucide-react";
import { moveOwnerSearchSelection, resolveOwnerMenuTarget, searchOwnerWorkspace, type OwnerAdminTarget, type OwnerCatalogueItem, type OwnerMenuItem, type OwnerModule } from "@/lib/ownerAdminNavigation";

type Props = {
  brandName: string;
  logoUrl?: string;
  menuItems: OwnerMenuItem[];
  categories: OwnerCatalogueItem[];
  products: OwnerCatalogueItem[];
  modules: Array<{ id: OwnerModule; title: string; description: string }>;
  publicUrl?: string;
  onSelect: (target: OwnerAdminTarget) => void;
};
const systemLabels: Record<string, string> = { home: "Accueil", shop: "Boutique", categories: "Catégories", creations: "Créations", new: "Nouveautés", "best-sellers": "Best-sellers", promos: "Promos", contact: "Contact" };

export default function OwnerWorkspaceHeader({ brandName, logoUrl, menuItems, categories, products, modules, publicUrl, onSelect }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleItems = useMemo(() => menuItems.filter(item => item.visible), [menuItems]);
  const rootItems = visibleItems.filter(item => !item.parentId);
  const results = useMemo(() => searchOwnerWorkspace(query, modules, categories, products), [query, modules, categories, products]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, []);
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const choose = (target: OwnerAdminTarget) => {
    onSelect(target);
    setQuery("");
    setActiveResult(0);
    setSearchOpen(false);
    setExpanded(null);
    setMenuOpen(false);
  };
  const labelFor = (item: OwnerMenuItem) => item.label.trim() || systemLabels[item.id] || "Onglet";
  const renderItem = (item: OwnerMenuItem, mobile: boolean) => {
    const children = visibleItems.filter(child => child.parentId === item.id && child.kind === "custom");
    const categoryChildren = item.id === "categories" ? categories.filter(category => category.catalogSection !== "creations") : item.id === "creations" ? categories.filter(category => category.catalogSection === "creations") : [];
    const hasChildren = children.length > 0 || categoryChildren.length > 0;
    const isExpanded = expanded === item.id;
    const target = resolveOwnerMenuTarget(item, categories, products);
    return <div key={`${mobile ? "mobile" : "desktop"}-${item.id}`} className={mobile ? "relative border-b border-slate-100 py-1" : "relative flex shrink-0 items-center gap-0.5"}>
      <button type="button" onClick={() => choose(target)} className={`min-h-11 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${mobile ? `w-full ${hasChildren ? "pr-14" : ""}` : ""}`} title={`Modifier : ${labelFor(item)}`}>
        {labelFor(item)}
      </button>
      {hasChildren && <button type="button" aria-expanded={isExpanded} aria-label={`Sous-menu ${labelFor(item)}`} onClick={() => setExpanded(isExpanded ? null : item.id)} className={`min-h-11 min-w-11 rounded-lg text-xs text-teal-800 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${mobile ? "absolute right-1 top-1" : ""}`}>▼</button>}
      {hasChildren && isExpanded && <div className={mobile ? "ml-3 max-h-72 space-y-1 overflow-y-auto rounded-lg bg-teal-50 p-2" : "absolute left-0 top-full z-50 max-h-72 min-w-52 overflow-y-auto rounded-xl border border-teal-100 bg-white p-2 shadow-xl"}>
        {children.map(child => <button key={child.id} type="button" onClick={() => choose(resolveOwnerMenuTarget(child, categories, products))} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">{labelFor(child)}</button>)}
        {categoryChildren.map(category => <button key={`category-${category.id}`} type="button" onClick={() => choose({ module: "catalogue", categoryId: category.id })} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">{category.name}</button>)}
      </div>}
    </div>;
  };

  return <header className="sticky top-0 z-50 border-b border-teal-100 bg-white shadow-sm" aria-label="En-tête du panneau propriétaire">
    <div className="border-b border-teal-100 bg-teal-950 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-teal-50">Espace privé · modifier votre boutique — les liens ci-dessous ouvrent les outils d’édition</div>
    <div className="mx-auto flex max-w-[1700px] flex-wrap items-center gap-2 px-3 py-2.5 sm:px-5">
      <button type="button" onClick={() => choose({ module: "overview" })} aria-label={`Vue d’ensemble de ${brandName}`} className="flex min-h-11 min-w-0 shrink-0 items-center gap-2 rounded-lg px-1 font-bold tracking-wide text-teal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
        {logoUrl ? <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg border border-teal-100 bg-white object-contain" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-900 text-white">M</span>}
        <span className="max-w-32 truncate sm:max-w-44">{brandName}</span>
      </button>
      <nav className="hidden min-w-0 flex-1 flex-wrap items-center gap-0.5 xl:flex" aria-label="Édition des onglets de la boutique">{rootItems.map(item => renderItem(item, false))}</nav>
      <div ref={searchRef} className="relative order-3 w-full min-w-0 sm:order-none sm:ml-auto sm:w-[min(22rem,42vw)] xl:ml-2 xl:w-64">
        <label className="sr-only" htmlFor="owner-workspace-search">Rechercher dans la gestion de boutique</label>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-teal-700" />
        <input ref={inputRef} id="owner-workspace-search" type="search" role="combobox" aria-autocomplete="list" aria-expanded={Boolean(searchOpen && query.trim())} aria-controls="owner-workspace-results" aria-activedescendant={searchOpen && results.length ? `owner-workspace-result-${Math.min(activeResult, results.length - 1)}` : undefined} autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setActiveResult(0); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => {
          if (event.key === "Escape") { setSearchOpen(false); return; }
          if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
            event.preventDefault(); setSearchOpen(true);
            const next = moveOwnerSearchSelection(activeResult, results.length, event.key === "ArrowDown" ? 1 : -1, searchOpen);
            setActiveResult(next);
            requestAnimationFrame(() => document.getElementById(`owner-workspace-result-${next}`)?.scrollIntoView({ block: "nearest" }));
          }
          if (event.key === "Enter" && searchOpen && results.length) { event.preventDefault(); choose(results[Math.min(activeResult, results.length - 1)].target); }
        }} placeholder="Outil, catégorie, fiche produit…" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-950 placeholder:text-slate-500 focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100" />
        {searchOpen && query.trim() && <div id="owner-workspace-results" className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-[55vh] overflow-y-auto rounded-xl border border-teal-100 bg-white p-2 shadow-xl" role="listbox" aria-label="Résultats de recherche de la boutique">
          {results.length ? results.map((result, index) => <button key={`${result.type}-${result.target.module}-${result.target.productId || result.target.categoryId || index}`} id={`owner-workspace-result-${index}`} type="button" role="option" aria-selected={index === Math.min(activeResult, results.length - 1)} onMouseEnter={() => setActiveResult(index)} onClick={() => choose(result.target)} className={`flex min-h-12 w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${index === Math.min(activeResult, results.length - 1) ? "bg-teal-50" : "hover:bg-teal-50"}`}><span className="mt-0.5 shrink-0 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal-800">{result.type === "module" ? "Outil" : result.type === "product" ? "Produit" : "Catégorie"}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{result.title}</span><span className="block truncate text-xs text-slate-600">{result.detail}</span></span></button>) : <p className="p-3 text-sm text-slate-600" role="status">Aucun outil ou fiche de cette boutique ne correspond. Essayez un autre terme.</p>}
          <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">Résultats privés de cette boutique uniquement. Utilisez les flèches puis Entrée pour choisir.</p>
        </div>}
      </div>
      <button type="button" onClick={() => choose({ module: "navigation" })} aria-label="Modifier le menu de la boutique" title="Modifier le menu" className="hidden min-h-11 min-w-11 place-items-center rounded-xl text-teal-800 hover:bg-teal-50 sm:grid"><Settings2 className="h-5 w-5" /></button>
      {publicUrl && <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="hidden min-h-11 items-center gap-1 rounded-xl border border-teal-200 px-3 text-xs font-semibold text-teal-900 hover:bg-teal-50 2xl:inline-flex">Voir la vitrine <ExternalLink className="h-3.5 w-3.5" /></a>}
      <button type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Fermer les onglets" : "Ouvrir les onglets"} onClick={() => setMenuOpen(!menuOpen)} className="grid min-h-11 min-w-11 place-items-center rounded-xl border border-teal-100 text-teal-900 xl:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
    </div>
    {menuOpen && <nav className="max-h-[60vh] overflow-y-auto border-t border-teal-100 bg-white px-4 pb-3 pt-2 xl:hidden" aria-label="Édition des onglets sur tablette et téléphone">{rootItems.map(item => renderItem(item, true))}<button type="button" onClick={() => choose({ module: "navigation" })} className="mt-2 min-h-11 w-full rounded-lg bg-teal-50 px-3 text-left text-sm font-semibold text-teal-900">Modifier le menu et les sous-menus</button>{publicUrl && <a href={publicUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)} className="mt-2 flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-800">Voir la vitrine publique <ExternalLink className="h-4 w-4" /></a>}</nav>}
  </header>;
}
