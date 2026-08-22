import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBanners } from "@/data/mockData";
import { trpc } from "@/lib/trpc";

const DEFAULT_HERO_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/JZmuCtGTfIYUcFRd.jpg";

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  buttonLink: string;
  buttonText: string;
};

export default function HeroBanner() {
  const remoteBanners = trpc.content.getActiveBanners.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = useMemo<HeroSlide[]>(() => {
    if (remoteBanners.data && remoteBanners.data.length > 0) {
      return remoteBanners.data.map((banner) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle || "Découvrez nos nouveautés MAZIGHO",
        imageUrl: banner.imageUrl || DEFAULT_HERO_IMAGE,
        buttonLink: banner.linkUrl || "/boutique",
        buttonText: "Découvrir",
      }));
    }

    return getBanners().map((banner) => ({
      ...banner,
      imageUrl: DEFAULT_HERO_IMAGE,
    }));
  }, [remoteBanners.data]);

  useEffect(() => {
    if (currentSlide >= banners.length) setCurrentSlide(0);
  }, [banners.length, currentSlide]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentSlide];
  if (!currentBanner) return null;

  return (
    <div className="relative h-[520px] w-full overflow-hidden md:h-[560px] lg:h-[640px]">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== currentSlide}
        >
          <div className="absolute inset-0 bg-slate-950">
            {banner.imageUrl && (
              <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
          </div>

          <div className="relative flex h-full items-center justify-start px-6 sm:px-10 lg:px-16">
            <div className="z-10 max-w-2xl text-left text-white">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">MAZIGHO · sélection du moment</p>
              <h1 className="mb-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">{banner.title}</h1>
              <p className="mb-8 max-w-xl text-base leading-7 text-white/85 md:text-xl">{banner.subtitle}</p>
              <div className="flex flex-col justify-start gap-3 sm:flex-row">
                <Link href={banner.buttonLink}>
                  <Button className="bg-orange-500 px-8 py-3 text-lg font-semibold text-white hover:bg-orange-600">{banner.buttonText}</Button>
                </Link>
                <Link href="/meilleures-ventes">
                  <Button variant="outline" className="border-white/70 bg-white/5 px-8 py-3 text-lg font-semibold text-white hover:bg-white/15 hover:text-white">Voir les best-sellers</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/45 p-3 text-white hover:bg-orange-500" aria-label="Bannière précédente"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/45 p-3 text-white hover:bg-orange-500" aria-label="Bannière suivante"><ChevronRight className="h-6 w-6" /></button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((banner, index) => (
              <button key={banner.id} onClick={() => setCurrentSlide(index)} className={`h-3 rounded-full ${index === currentSlide ? "w-8 bg-white" : "w-3 bg-white/50"}`} aria-label={`Afficher la bannière ${index + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
