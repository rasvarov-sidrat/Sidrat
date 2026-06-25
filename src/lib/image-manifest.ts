export type LocalImageOption = {
  src: string;
  label: string;
  kind: 'hero' | 'product';
  productSlug?: string;
};

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  cta: string;
  link: string;
};

type ProductMedia = {
  cover: string;
  gallery: string[];
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: 'Покупайте вместе.',
    subtitle: 'MVP маркетплейса для групповых покупок',
    description: 'SIDRAT строится вокруг GB-сессий на товарные семейства. Вы выбираете допустимый вариант, занимаете слот и двигаете цену вниз вместе с другими покупателями.',
    image: '/assets/hero/slide-1.svg',
    cta: 'Смотреть каталог',
    link: '/catalog',
  },
  {
    id: 2,
    title: 'Активные GB-сессии.',
    subtitle: 'Смотрите, где уже живое движение',
    description: 'Открывайте текущие сессии, смотрите занятые слоты, следующую цену и кто уже вошёл в покупку.',
    image: '/assets/hero/slide-2.svg',
    cta: 'Активные сессии',
    link: '/sessions',
  },
  {
    id: 3,
    title: 'Создавайте собственную сессию.',
    subtitle: 'Для продавца или куратора семейства',
    description: 'Настраивайте размеры, цвета и срок жизни сессии, чтобы запускать свою групповую покупку за пару шагов.',
    image: '/assets/hero/slide-3.svg',
    cta: 'Создать сессию',
    link: '/catalog',
  },
  {
    id: 4,
    title: 'Возвращайте разницу в wallet.',
    subtitle: 'Когда слоты закрываются, скидка работает дальше',
    description: 'Каждый следующий слот сдвигает цену вниз, а разница возвращается на внутренний баланс без лишних действий.',
    image: '/assets/hero/slide-4.svg',
    cta: 'Открыть кошелёк',
    link: '/wallet',
  },
];

export const PRODUCT_MEDIA_LIBRARY: Record<string, ProductMedia> = {
  'nike-air-max-2024': {
    cover: '/assets/products/nike-air-max-2024/cover.svg',
    gallery: ['/assets/products/nike-air-max-2024/alt-1.svg'],
  },
  'oxford-shirt': {
    cover: '/assets/products/oxford-shirt/cover.svg',
    gallery: ['/assets/products/oxford-shirt/alt-1.svg'],
  },
  'sony-wh-1000xm5': {
    cover: '/assets/products/sony-wh-1000xm5/cover.svg',
    gallery: [],
  },
  'samsung-galaxy-s24-ultra': {
    cover: '/assets/products/samsung-galaxy-s24-ultra/cover.svg',
    gallery: [],
  },
  'adidas-ultraboost-light': {
    cover: '/assets/products/adidas-ultraboost-light/cover.svg',
    gallery: [],
  },
  'macbook-pro-16': {
    cover: '/assets/products/macbook-pro-16/cover.svg',
    gallery: [],
  },
  'lg-instaview-fridge': {
    cover: '/assets/products/lg-instaview-fridge/cover.svg',
    gallery: ['/assets/products/lg-instaview-fridge/alt-1.svg'],
  },
  'bosch-serie-6-washing-machine': {
    cover: '/assets/products/bosch-serie-6-washing-machine/cover.svg',
    gallery: [],
  },
  'delonghi-dinamica-coffee-machine': {
    cover: '/assets/products/delonghi-dinamica-coffee-machine/cover.svg',
    gallery: [],
  },
  'daikin-split-system': {
    cover: '/assets/products/daikin-split-system/cover.svg',
    gallery: [],
  },
  'iphone-15-pro-max': {
    cover: '/assets/products/iphone-15-pro-max/cover.svg',
    gallery: ['/assets/products/iphone-15-pro-max/alt-1.svg'],
  },
  'samsung-galaxy-watch': {
    cover: '/assets/products/samsung-galaxy-watch/cover.svg',
    gallery: [],
  },
  'anker-usb-c-cable': {
    cover: '/assets/products/anker-usb-c-cable/cover.svg',
    gallery: [],
  },
};

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function isLocalAssetPath(value: string | undefined | null) {
  const normalized = value?.trim();
  return Boolean(normalized) && (normalized.startsWith('/assets/') || normalized.startsWith('data:'));
}

export function getHeroSlides() {
  return HERO_SLIDES;
}

export function getProductMediaPaths(productSlug: string) {
  const media = PRODUCT_MEDIA_LIBRARY[productSlug];
  if (!media) return [];
  return uniqueStrings([media.cover, ...media.gallery]);
}

export function getProductImageOptions(productSlug?: string): LocalImageOption[] {
  if (productSlug && PRODUCT_MEDIA_LIBRARY[productSlug]) {
    return getProductMediaPaths(productSlug).map((src, index) => ({
      src,
      label: `${productSlug} ${index === 0 ? 'cover' : `gallery ${index}`}`,
      kind: 'product',
      productSlug,
    }));
  }

  return Object.entries(PRODUCT_MEDIA_LIBRARY).flatMap(([slug, media]) =>
    uniqueStrings([media.cover, ...media.gallery]).map((src, index) => ({
      src,
      label: `${slug} ${index === 0 ? 'cover' : `gallery ${index}`}`,
      kind: 'product',
      productSlug: slug,
    })),
  );
}

