import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    title: 'Group Buying 2.0',
    subtitle: 'Покупайте вместе — экономьте больше',
    description: 'Создавайте групповые сессии и получайте скидки до 30%',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600',
    cta: 'Начать покупки',
    link: '/catalog',
  },
  {
    id: 2,
    title: 'Новый iPhone 15 Pro',
    subtitle: 'Максимальная скидка 30%',
    description: 'Соберите группу из 20 человек и получите iPhone за $839 вместо $1,199',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=1600',
    cta: 'Создать сессию',
    link: '/create-session/1',
  },
  {
    id: 3,
    title: 'Плоды лотоса',
    subtitle: 'Играй и экономь',
    description: 'Собирайте плоды, смотрите рекламу для удвоения и обменивайте на скидки',
    image: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1600',
    cta: 'Узнать больше',
    link: '/sessions',
  },
  {
    id: 4,
    title: 'Приглашай друзей',
    subtitle: 'Получай 500 бонусов',
    description: 'За каждого приглашённого друга — 500 бонусов и 5% от его покупок',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600',
    cta: 'Получить ссылку',
    link: '/profile',
  },
];

export default function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    
    // Auto-play every 5 seconds
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    
    return () => {
      emblaApi.off('select', onSelect);
      clearInterval(interval);
    };
  }, [emblaApi]);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
      <div className="absolute inset-0" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0 relative">
              {/* Background Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl"
                  >
                    <span className="inline-block px-4 py-1 bg-[#2A7F6E] text-white text-sm font-medium rounded-full mb-4">
                      {slide.subtitle}
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                      {slide.title}
                    </h2>
                    <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
                      {slide.description}
                    </p>
                    <a href={slide.link}>
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold">
                        {slide.cta}
                      </Button>
                    </a>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all ${
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