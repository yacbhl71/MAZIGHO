import { useState } from "react";
import { Camera, ImagePlus, Loader2, Sparkles, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function VisualSearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const visualSearch = trpc.visualSearch.searchByImage.useQuery(
    { imageDataUrl: selectedImage || "" },
    { enabled: Boolean(selectedImage), refetchOnWindowFocus: false }
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setHasSearched(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const results = visualSearch.data?.results || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-200 p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Camera className="h-5 w-5 text-indigo-600" /> Recherche Visuelle par Photo IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-6 text-center">
            {selectedImage ? (
              <div className="relative mx-auto max-h-56 max-w-xs overflow-hidden rounded-xl border bg-white shadow-md">
                <img src={selectedImage} alt="Recherche visuelle" className="h-full w-full object-contain p-2" />
                <button
                  type="button"
                  onClick={() => { setSelectedImage(null); setHasSearched(false); }}
                  className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1 text-white hover:bg-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer space-y-3">
                <div className="rounded-2xl bg-indigo-600 p-4 text-white shadow-lg shadow-indigo-600/20">
                  <ImagePlus className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-indigo-950">Téléversez ou prenez une photo</p>
                  <p className="mt-1 text-xs text-slate-500">Formats supportés : JPEG, PNG, WebP</p>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {visualSearch.isLoading && (
            <div className="flex items-center justify-center gap-3 py-8 text-sm text-indigo-900 font-semibold">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Analyse de votre photo par l'IA et recherche de produits similaires...
            </div>
          )}

          {hasSearched && !visualSearch.isLoading && (
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" /> Articles similaires trouvés ({results.length})
              </h3>

              {results.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Aucun article similaire trouvé pour le moment.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {results.map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/produit/${product.slug || product.id}`}
                      onClick={() => onOpenChange(false)}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-400 hover:bg-indigo-50/30 transition shadow-sm"
                    >
                      <img
                        src={product.images?.[0]?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80"}
                        alt={product.name}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{product.categoryName || "Gamme produit"}</p>
                        <p className="mt-1 text-xs font-bold text-indigo-600">{(product.price / 100).toFixed(2)} CHF</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
