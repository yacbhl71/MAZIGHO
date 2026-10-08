import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { getBanners } from "@/data/mockData";
import { trpc } from "@/lib/trpc";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { useLocale, type StorefrontLocale } from "@/contexts/LocaleContext";
import { getPublicCopy } from "@/lib/publicCopy";
import { t } from "@/lib/i18n";
import { isCarouselVideoUrl } from "@shared/carouselMedia";

const DEFAULT_HERO_IMAGE = "/assets/hero-best-offers.webp";
const HERO_MODE_IMAGE = "/assets/hero-mode-accessoires.webp";
const HERO_BEAUTE_IMAGE = "/assets/hero-beaute-bien-etre.webp";

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
  // A store owner’s own image must always take precedence over the historic
  // generic fallback visuals, including the default fashion and beauty slides.
  if (imageUrl && !imageUrl.includes("placehold.co")) return imageUrl;
  if (normalizedTitle.includes("mode")) return HERO_MODE_IMAGE;
  if (normalizedTitle.includes("beauté") || normalizedTitle.includes("beaute")) return HERO_BEAUTE_IMAGE;
  return DEFAULT_HERO_IMAGE;
}

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  imageUrl?: string | null;
  buttonLink: string;
  buttonText: string;
};

export default function HeroBanner({ allowPlatformFallback = true }: { allowPlatformFallback?: boolean }) {
  const { locale } = useLocale();
  const { profile, palette, isLoading: designProfileLoading } = useDesignProfile(locale);
  const copy = getPublicCopy(locale);
  const remoteBanners = trpc.content.getActiveBanners.useQuery(locale);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videoSoundEnabled, setVideoSoundEnabled] = useState(false);
  // These labels belong to the storefront profile, not to MAZIGHO's generic
  // copy. They can therefore be changed in the owner panel and translated as
  // part of the design content when the boutique publishes another language.
  const heroEyebrow = profile.brandMessage?.trim() || profile.brandName?.trim() || copy.hero.eyebrow;
  const primaryCtaLabel = profile.discoveryBrowseShopLabel?.trim() || copy.discovery.browseShop;
  const secondaryCtaLabel = profile.discoveryAllShopLabel?.trim() || copy.hero.secondaryCta;
  const heroAccent = profile.headerLayout === "glamour" ? palette.accent : palette.primary;

  const banners = useMemo<HeroSlide[]>(() => {
    if (remoteBanners.data && remoteBanners.data.length > 0) {
      return remoteBanners.data.map((banner) => {
        const sourceTitle = banner.sourceTitle || banner.title;
        const localized = copy.hero.banners[sourceTitle as keyof typeof copy.hero.banners]
          || copy.hero.banners[banner.title as keyof typeof copy.hero.banners];
        return {
          id: banner.id,
          title: localizedHeroTitles[locale][sourceTitle] || localizedHeroTitles[locale][banner.title] || banner.title,
          subtitle: localized?.subtitle || banner.subtitle || copy.highlight.text,
          imageUrl: imageForBanner(sourceTitle, banner.imageUrl),
          buttonLink: banner.linkUrl || "/boutique",
          buttonText: localized?.primaryCta || copy.discovery.browseShop,
        };
      });
    }

    if (!allowPlatformFallback) return [];

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
  }, [allowPlatformFallback, remoteBanners.data, copy, locale]);

  useEffect(() => {
    if (currentSlide >= banners.length) setCurrentSlide(0);
  }, [banners.length, currentSlide]);

  useEffect(() => {
    // Autoplay with sound is blocked by browsers. Reset to muted when visitors
    // change slide, then let them explicitly opt into the workshop ambience.
    setVideoSoundEnabled(false);
  }, [currentSlide]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const selectSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    selectSlide((currentSlide - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    selectSlide((currentSlide + 1) % banners.length);
  };

  const currentBanner = banners[currentSlide];
  if (remoteBanners.isLoading || designProfileLoading) return <div className="h-[520px] w-full animate-pulse bg-slate-200/80 md:h-[560px] lg:h-[640px]" aria-busy="true" aria-label="Chargement de la bannière" />;
  if (!currentBanner) {
    return <div className="relative flex h-[520px] w-full items-end overflow-hidden bg-slate-950 px-6 py-10 text-white md:h-[560px] md:px-10 lg:h-[640px] lg:px-16"><div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${palette.primary}, #020617)` }} /><div className="relative z-10 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.28em] text-white/70">{profile.brandMessage || "Votre boutique"}</p><h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl">{profile.brandName}</h1><p className="mt-4 text-base leading-7 text-white/80">Préparez une bannière personnalisée depuis votre panneau de gestion.</p></div></div>;
  }

  // The market composition keeps the catalogue immediately legible: a large
  // visual slide, a clear search-first header and a single focal call to action.
  // It remains fully driven by each boutique's own carousel content.
  if (profile.headerLayout === "market") {
    return (
      <div className="relative min-h-[430px] overflow-hidden bg-slate-950 text-white md:min-h-[560px] lg:min-h-[620px]" data-storefront-hero="market">
        {currentBanner.imageUrl && (isCarouselVideoUrl(currentBanner.imageUrl) ? <video key={currentBanner.id} src={currentBanner.imageUrl} autoPlay loop muted={!videoSoundEnabled} playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" aria-label={currentBanner.title} /> : <img key={currentBanner.id} src={currentBanner.imageUrl} alt="" width={1920} height={1080} fetchPriority={currentSlide === 0 ? "high" : "auto"} loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover" />)}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/52 to-slate-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/10" />
        <div className="container relative z-10 flex min-h-[430px] items-center px-6 py-14 sm:px-10 md:min-h-[560px] lg:min-h-[620px] lg:px-16">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: palette.accent }}>{heroEyebrow}</p>
            <h1 className="mb-5 text-4xl font-semibold leading-[1.03] tracking-tight md:text-6xl lg:text-7xl">{currentBanner.title}</h1>
            <p className="mb-8 max-w-lg text-base leading-7 text-white/85 md:text-lg">{currentBanner.subtitle}</p>
            <div className="flex flex-col justify-start gap-3 sm:flex-row">
              <Link href={currentBanner.buttonLink}><Button className="px-7 py-3 text-base font-semibold text-white shadow-lg hover:brightness-95" style={{ backgroundColor: palette.accent }}>{primaryCtaLabel}</Button></Link>
              <Button asChild variant="outline" className="border-white/60 bg-white/10 px-7 py-3 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"><Link href="/best-sellers">{secondaryCtaLabel}</Link></Button>
            </div>
          </div>
        </div>
        {banners.length > 1 && <><button onClick={goToPrevious} className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white transition hover:bg-slate-950/70" aria-label={t(locale, "previousBanner")}><ChevronLeft className="h-6 w-6" /></button><button onClick={goToNext} className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/45 text-white transition hover:bg-slate-950/70" aria-label={t(locale, "nextBanner")}><ChevronRight className="h-6 w-6" /></button><div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">{banners.map((banner, index) => <button key={banner.id} onClick={() => selectSlide(index)} className={`h-2.5 w-9 rounded-full transition-colors ${index === currentSlide ? "bg-white" : "bg-white/35 hover:bg-white/65"}`} aria-label={t(locale, "showBanner", { index: index + 1 })} />)}</div></>}
        {isCarouselVideoUrl(currentBanner.imageUrl) && <button type="button" onClick={() => setVideoSoundEnabled(enabled => !enabled)} className="absolute bottom-5 right-5 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-slate-950/65 px-4 text-xs font-bold text-white shadow-lg backdrop-blur hover:bg-slate-950/85" aria-pressed={videoSoundEnabled}>{videoSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{videoSoundEnabled ? "Couper le son" : "Activer le son"}</button>}
      </div>
    );
  }

  return (
    <div className="relative h-[520px] w-full overflow-hidden md:h-[560px] lg:h-[640px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-slate-950">
          {currentBanner.imageUrl && (isCarouselVideoUrl(currentBanner.imageUrl) ? (
            <video
              key={currentBanner.id}
              src={currentBanner.imageUrl}
              autoPlay
              loop
              muted={!videoSoundEnabled}
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
              aria-label={currentBanner.title}
            />
          ) : (
            <img
              key={currentBanner.id}
              src={currentBanner.imageUrl}
              alt=""
              width={1920}
              height={1080}
              fetchPriority={currentSlide === 0 ? "high" : "auto"}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-90"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        </div>

        <div className="relative flex h-full items-center justify-start px-6 sm:px-10 lg:px-16">
          <div className="z-10 max-w-2xl text-left text-white">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.3em]" style={{ color: heroAccent }}>{heroEyebrow}</p>
            <h1 className="mb-5 text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">{currentBanner.title}</h1>
            <p className="mb-8 max-w-xl text-base leading-7 text-white/85 md:text-xl">{currentBanner.subtitle}</p>
            <div className="flex flex-col justify-start gap-3 sm:flex-row">
              <Link href={currentBanner.buttonLink}>
                <Button className="px-8 py-3 text-lg font-semibold text-white hover:brightness-95" style={{ backgroundColor: palette.accent }}>{primaryCtaLabel}</Button>
              </Link>
              <Button asChild variant="outline" className="border-white/70 bg-white/5 px-8 py-3 text-lg font-semibold text-white hover:bg-white/15 hover:text-white"><Link href="/best-sellers">{secondaryCtaLabel}</Link></Button>
            </div>
          </div>
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={goToPrevious} className="absolute left-4 top-1/2 z-20 flex h-11 w-11 items-center justify-center -translate-y-1/2 rounded-full bg-slate-950/45 text-white" style={{ borderColor: palette.primary }} aria-label={t(locale, "previousBanner")}><ChevronLeft className="h-6 w-6" /></button>
          <button onClick={goToNext} className="absolute right-4 top-1/2 z-20 flex h-11 w-11 items-center justify-center -translate-y-1/2 rounded-full bg-slate-950/45 text-white" style={{ borderColor: palette.primary }} aria-label={t(locale, "nextBanner")}><ChevronRight className="h-6 w-6" /></button>
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {banners.map((banner, index) => (
              <button key={banner.id} onClick={() => selectSlide(index)} className={`min-h-11 min-w-11 rounded-full ${index === currentSlide ? "bg-white/20" : "bg-slate-950/25"}`} aria-label={t(locale, "showBanner", { index: index + 1 })} />
            ))}
          </div>
        </>
      )}
      {isCarouselVideoUrl(currentBanner.imageUrl) && (
        <button type="button" onClick={() => setVideoSoundEnabled(enabled => !enabled)} className="absolute bottom-5 right-5 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-slate-950/65 px-4 text-xs font-bold text-white shadow-lg backdrop-blur hover:bg-slate-950/85" aria-pressed={videoSoundEnabled}>
          {videoSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {videoSoundEnabled ? "Couper le son" : "Activer le son"}
        </button>
      )}
    </div>
  );
}
