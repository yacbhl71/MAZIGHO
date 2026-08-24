import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBanners } from "@/data/mockData";
import { trpc } from "@/lib/trpc";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useLocale, type StorefrontLocale } from "@/contexts/LocaleContext";
import { getPublicCopy } from "@/lib/publicCopy";

const DEFAULT_HERO_IMAGE = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663209309444/JZmuCtGTfIYUcFRd.jpg";
const HERO_MODE_IMAGE = "/assets/hero-mode-accessoires.jpg";
const HERO_BEAUTE_IMAGE = "/assets/hero-beaute-bien-etre.jpg";

const localizedHeroTitles: Record<StorefrontLocale, Record<string, string>> = {
  fr: { "Découvrez nos Meilleures Offres": "Découvrez nos Meilleures Offres", "Mode & Accessoires": "Mode & Accessoires", "Beauté & Bien-Être": "Beauté & Bien-Être" },
  de: { "Découvrez nos Meilleures Offres": "Entdecken Sie unsere besten Angebote", "Mode & Accessoires": "Mode & Accessoires", "Beauté & Bien-Être": "Schönheit & Wohlbefinden" },
  it: { "Découvrez nos Meilleures Offres": "Scoprite le nostre migliori offerte", "Mode & Accessoires": "Moda e accessori", "Beauté & Bien-Être": "Bellezza e benessere" },
  en: { "Découvrez nos Meilleures Offres": "Discover Our Best Offers", "Mode & Accessoires": "Fashion & Accessories", "Beauté & Bien-Être": "Beauty & Well-being" },
  es: { "Découvrez nos Meilleures Offres": "Descubre nuestras mejores ofertas", "Mode & Accessoires": "Moda y accesorios", "Beauté & Bien-Être": "Belleza y bienestar" },
  nl: { "Découvrez nos Meilleures Offres": "Ontdek onze beste aanbiedingen", "Mode & Accessoires": "Mode & accessoires", "Beauté & Bien-Être": "Beauty & welzijn" },
  ar: { "Découvrez nos Meilleures Offres": "اكتشف أفضل عروضنا", "Mode & Accessoires": "الأزياء والإكسسوارات", "Beauté & Bien-Être": "الجمال والعافية" },
};

function imageForBanner(title: string, imageUrl?: string | null) {
  const normalizedTitle = title.toLocaleLowerCase("fr");
  if (normalizedTitle.includes("mode")) return HERO_MODE_IMAGE;
  if (normalizedTitle.includes("beauté") || normalizedTitle.includes("beaute")) return HERO_BEAUTE_IMAGE;
  return imageUrl && !imageUrl.includes("placehold.co") ? imageUrl : DEFAULT_HERO_IMAGE;
}

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  buttonLink: string;
  buttonText: string;
};

export default function HeroBanner() {
  const { palette } = useDesignProfile();
  const { locale } = useLocale();
  const copy = getPublicCopy(locale);
  const remoteBanners = trpc.content.getActiveBanners.useQuery();
  const [currentSlide, setCurrentSlide] = useState(0);

  const banners = useMemo<HeroSlide[]>(() => {
    if (remoteBanners.data && remoteBanners.data.length > 0) {
      return remoteBanners.data.map((banner) => {
        const localized = copy.hero.banners[banner.title as keyof typeof copy.hero.banners];
        return {
          id: banner.id,
          title: localizedHeroTitles[locale][banner.title] || banner.title,
          subtitle: localized?.subtitle || banner.subtitle || copy.highlight.text,
          imageUrl: imageForBanner(banner.title, banner.imageUrl),
          buttonLink: banner.linkUrl || "/boutique",
          buttonText: localized?.primaryCta || copy.discovery.browseShop,
        };
      });
    }

    return getBanners().map((banner) => {
      const localized = copy.hero.banners[banner.title as keyof typeof copy.hero.banners];
      return {
        ...banner,
        title: localizedHeroTitles[locale][banner.title] || banner.title,
        subtitle: localized?.subtitle || banner.subtitle,
        buttonText: localized?.primaryCta || banner.buttonText,
        imageUrl: imageForBanner(banner.title),
      };
    });
  }, [remoteBanners.data, copy, locale]);

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
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: palette.primary }}>{copy.hero.eyebrow}</p>
              <h1 className="mb-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">{banner.title}</h1>
              <p className="mb-8 max-w-xl text-base leading-7 text-white/85 md:text-xl">{banner.subtitle}</p>
              <div className="flex flex-col justify-start gap-3 sm:flex-row">
                <Link href={banner.buttonLink}>
                  <Button className="px-8 py-3 text-lg font-semibold text-white" style={{ backgroundColor: palette.primary }}>{banner.buttonText}</Button>
                </Link>
                <Link href="/best-sellers">
                  <Button variant="outline" className="border-white/70 bg-white/5 px-8 py-3 text-lg font-semibold text-white hover:bg-white/15 hover:text-white">{copy.hero.secondaryCta}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/45 p-3 text-white" style={{ borderColor: palette.primary }} aria-label="Bannière précédente"><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/45 p-3 text-white" style={{ borderColor: palette.primary }} aria-label="Bannière suivante"><ChevronRight className="h-6 w-6" /></button>
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
