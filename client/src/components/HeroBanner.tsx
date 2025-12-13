import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBanners } from "@/data/mockData";

export default function HeroBanner() {
  const banners = getBanners();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentSlide];

  return (
    <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] overflow-hidden">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-yellow-400">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-300/20 rounded-full translate-x-1/2 translate-y-1/2"></div>
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center justify-center px-4">
            <div className="text-center text-white max-w-3xl z-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
                {banner.title}
              </h1>
              <p className="text-lg md:text-2xl mb-8 text-white/90">
                {banner.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={banner.buttonLink}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-semibold">
                    {banner.buttonText}
                  </Button>
                </Link>
                <Button variant="outline" className="border-white text-white hover:bg-white/20 px-8 py-3 text-lg font-semibold">
                  Voir les Best-sellers
                </Button>
              </div>
            </div>

            {/* Decorative Image Area */}
            <div className="absolute right-0 bottom-0 w-1/3 h-full hidden lg:flex items-center justify-center opacity-30">
              <div className="text-9xl">💡</div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-3 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 w-3 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
