import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getHeroSlides } from '@/lib/image-manifest';
import { fetchHeroSlides } from '@/lib/cms';
const staticSlides = getHeroSlides();

type HeroSlideView = {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  ctaText: string;
  ctaLink: string;
};

function normalizeSlides(slides: Array<any>): HeroSlideView[] {
  return slides.map((slide) => ({
    title: slide.title,
    subtitle: slide.subtitle || '',
    description: slide.description || '',
    image: slide.image || slide.sourceUrl || slide.mediaAsset?.source_url || slide.mediaAsset?.sourceUrl || '',
    ctaText: slide.ctaText || slide.cta || '',
    ctaLink: slide.ctaLink || slide.link || '',
  }));
}

export default function HeroCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const slidesQuery = useQuery({
    queryKey: ['cms-hero-slides'],
    queryFn: async () => {
      try {
        return await fetchHeroSlides();
      } catch {
        return staticSlides;
      }
    },
  });
  const slides = useMemo(() => normalizeSlides((slidesQuery.data || staticSlides) as Array<any>), [slidesQuery.data]);

  const scrollTo = useCallback((index: number) => {
    setDirection(index > selectedIndex ? 1 : -1);
    setSelectedIndex(index);
  }, [selectedIndex]);

  const scrollPrev = useCallback(() => {
    setDirection(-1);
    setSelectedIndex((current) => (current - 1 + slides.length) % slides.length);
  }, []);

  const scrollNext = useCallback(() => {
    setDirection(1);
    setSelectedIndex((current) => (current + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (paused) return;

    const interval = window.setInterval(() => {
      scrollNext();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [paused, scrollNext]);

  return (
    <div
      className="relative h-[540px] w-full overflow-hidden rounded-3xl bg-gray-900 md:h-[620px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[selectedIndex].image || staticSlides[selectedIndex]?.image || staticSlides[0].image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#17493f]/95 via-[#2A7F6E]/75 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-16 sm:px-20 md:px-24 lg:px-28">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-2xl"
              >
                <span className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                  {slides[selectedIndex].subtitle}
                </span>
                <h2 className="text-4xl font-bold leading-tight text-white md:text-6xl">
                  {slides[selectedIndex].title}
                </h2>
                <p className="mb-8 max-w-xl text-lg leading-relaxed text-white/80 md:text-xl">
                  {slides[selectedIndex].description}
                </p>
                <Button asChild size="lg" className="bg-white px-8 py-6 text-lg font-semibold text-[#17493f] hover:bg-gray-100">
                  <Link to={slides[selectedIndex].ctaLink}>{slides[selectedIndex].ctaText}</Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-3 w-3 rounded-full transition-all ${
              index === selectedIndex
                ? 'bg-[#2A7F6E] w-8'
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}