import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { getAllProducts, getAllCategories } from "@/data/mockData";

interface SearchResult {
  id: number;
  type: "product" | "category";
  name: string;
  slug: string;
  description?: string;
}

export default function SearchBar() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const products = getAllProducts();
  const categories = getAllCategories();

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Chercher les produits et catégories
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Chercher dans les produits
    const productResults: SearchResult[] = products
      .filter((product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.description.toLowerCase().includes(lowerQuery)
      )
      .map((product) => ({
        id: product.id,
        type: "product" as const,
        name: product.name,
        slug: product.slug,
        description: product.description,
      }));

    // Chercher dans les catégories
    const categoryResults: SearchResult[] = categories
      .filter((category) =>
        category.name.toLowerCase().includes(lowerQuery) ||
        category.description.toLowerCase().includes(lowerQuery)
      )
      .map((category) => ({
        id: category.id,
        type: "category" as const,
        name: category.name,
        slug: category.slug,
        description: category.description,
      }));

    setResults([...productResults, ...categoryResults]);
    setIsOpen(true);
  }, [query, products, categories]);

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === "product") {
      setLocation(`/produit/${result.slug}`);
    } else {
      setLocation(`/categorie/${result.slug}`);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Rechercher un produit..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Products Section */}
          {results.filter((r) => r.type === "product").length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                Produits
              </div>
              {results
                .filter((r) => r.type === "product")
                .slice(0, 5)
                .map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{result.name}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {result.description}
                    </p>
                  </button>
                ))}
            </div>
          )}

          {/* Categories Section */}
          {results.filter((r) => r.type === "category").length > 0 && (
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600">
                Catégories
              </div>
              {results
                .filter((r) => r.type === "category")
                .map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result)}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-100 transition-colors"
                  >
                    <p className="font-medium text-gray-800">{result.name}</p>
                  </button>
                ))}
            </div>
          )}

          {/* View All Results */}
          {results.length > 5 && (
            <button
              onClick={() => setLocation(`/recherche?q=${encodeURIComponent(query)}`)}
              className="w-full px-4 py-3 text-center text-orange-500 font-medium hover:bg-orange-50 transition-colors"
            >
              Voir tous les résultats ({results.length})
            </button>
          )}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-600">
          Aucun résultat pour "{query}"
        </div>
      )}
    </div>
  );
}
