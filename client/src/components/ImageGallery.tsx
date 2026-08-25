import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useLocale } from "@/contexts/LocaleContext";
import { t } from "@/lib/i18n";

interface ImageGalleryProps {
  images: Array<{ id: number; imageUrl: string; displayOrder: number }>;
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const { locale } = useLocale();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const displayImages = images.length > 0
    ? [...images].sort((a, b) => a.displayOrder - b.displayOrder)
    : [{ id: 0, imageUrl: "", displayOrder: 0 }];

  const currentImage = displayImages[selectedImageIndex] ?? displayImages[0];

  const goToPrevious = () => {
    setSelectedImageIndex((prev) => prev === 0 ? displayImages.length - 1 : prev - 1);
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="group relative flex aspect-square max-h-[560px] items-center justify-center overflow-hidden rounded-2xl bg-[#f4f0eb]">
          {currentImage.imageUrl ? (
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="flex h-full w-full cursor-zoom-in items-center justify-center p-5 md:p-8"
              aria-label={t(locale, "enlargeImage", { product: productName })}
            >
              <img src={currentImage.imageUrl} alt={productName} className="max-h-full max-w-full object-contain" />
              <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                <Maximize2 className="h-3.5 w-3.5" /> {t(locale, "enlarge")}
              </span>
            </button>
          ) : (
            <div className="text-6xl">📦</div>
          )}

          {displayImages.length > 1 && (
            <>
              <button type="button" onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-sm hover:bg-white" aria-label={t(locale, "previousImage")}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-800 shadow-sm hover:bg-white" aria-label={t(locale, "nextImage")}>
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                {selectedImageIndex + 1} / {displayImages.length}
              </div>
            </>
          )}
        </div>

        {displayImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f4f0eb] p-1 ${index === selectedImageIndex ? "border-orange-500 ring-2 ring-orange-200" : "border-transparent hover:border-gray-300"}`}
                aria-label={t(locale, "showImage", { index: index + 1 })}
              >
                {image.imageUrl ? <img src={image.imageUrl} alt={`${productName} ${index + 1}`} className="h-full w-full object-contain" /> : <span className="text-2xl">📦</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-5xl border-0 bg-white/95 p-3 sm:p-5">
          <DialogTitle className="sr-only">{t(locale, "enlargedImage", { product: productName })}</DialogTitle>
          <div className="flex min-h-[60vh] items-center justify-center bg-[#f4f0eb] p-4 sm:p-8">
            {currentImage.imageUrl && <img src={currentImage.imageUrl} alt={productName} className="max-h-[78vh] max-w-full object-contain" />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

