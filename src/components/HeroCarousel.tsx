import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    title: 'Покупайте вместе.',
    subtitle: 'MVP маркетплейса для групповых покупок',
    description: 'SIDRAT строится вокруг GB-сессий на товарные семейства. Вы выбираете допустимый вариант, занимаете слот и двигаете цену вниз вместе с другими покупателями.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600',
    cta: 'Смотреть каталог',
    link: '/catalog',
  },
  {
    id: 2,
    title: 'Активные GB-сессии.',
    subtitle: 'Смотрите, где уже живое движение',
    description: 'Открывайте текущие сессии, смотрите занятые слоты, следующую цену и кто уже вошёл в покупку.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600',
    cta: 'Активные сессии',
    link: '/sessions',
  },
  {
    id: 3,
    title: 'Создавайте собственную сессию.',
    subtitle: 'Для продавца или куратора семейства',
    description: 'Настраивайте размеры, цвета и срок жизни сессии, чтобы запускать свою групповую покупку за пару шагов.',
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1600',
    cta: 'Создать сессию',
    link: '/catalog',
  },
  {
    id: 4,
    title: 'Возвращайте разницу в wallet.',
    subtitle: 'Когда слоты закрываются, скидка работает дальше',
    description: 'Каждый следующий слот сдвигает цену вниз, а разница возвращается на внутренний баланс без лишних действий.',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=1600',
    cta: 'Открыть кошелёк',
    link: '/wallet',
  },
];

export default function HeroCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

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
            style={{ backgroundImage: `url(${slides[selectedIndex].image})` }}
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
                  <Link to={slides[selectedIndex].link}>{slides[selectedIndex].cta}</Link>
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