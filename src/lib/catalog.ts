import type { LucideIcon } from 'lucide-react';
import { Cpu, Footprints, Headphones, LayoutGrid, Shirt } from 'lucide-react';
import type { Product } from '@/types';

export interface CatalogLinkItem {
  label: string;
  slug: string;
  href: string;
  note?: string;
}

export interface CatalogGroup {
  title: string;
  slug: string;
  items: CatalogLinkItem[];
}

export interface CatalogCategory {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  matchCategories: string[];
  groups: CatalogGroup[];
  accent: string;
}

export function slugifyCatalogSegment(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function buildCatalogSlug(categoryId: string, sectionSlug?: string, itemSlug?: string) {
  if (categoryId === 'all') return 'all';
  const parts = [categoryId];
  if (sectionSlug) parts.push(sectionSlug);
  if (itemSlug) parts.push(itemSlug);
  return parts.join('/');
}

export function buildCatalogHref(categoryId: string, sectionSlug?: string, itemSlug?: string) {
  if (categoryId === 'all') return '/catalog';
  const params = new URLSearchParams();
  params.set('category', categoryId);
  if (sectionSlug) params.set('section', sectionSlug);
  if (itemSlug) params.set('item', itemSlug);
  return `/catalog?${params.toString()}`;
}

function buildLeaf(categoryId: string, sectionSlug: string, label: string, note?: string): CatalogLinkItem {
  const slug = slugifyCatalogSegment(label);
  return {
    label,
    slug,
    note,
    href: buildCatalogHref(categoryId, sectionSlug, slug),
  };
}

function buildGroup(categoryId: string, title: string, labels: Array<string | { label: string; note?: string }>): CatalogGroup {
  const slug = slugifyCatalogSegment(title);
  return {
    title,
    slug,
    items: labels.map((entry) => {
      if (typeof entry === 'string') {
        return buildLeaf(categoryId, slug, entry);
      }
      return buildLeaf(categoryId, slug, entry.label, entry.note);
    }),
  };
}

const electronicsGroups = [
  buildGroup('electronics', 'Крупная бытовая техника', [
    'Холодильники',
    'Стиральные машины',
    'Варочные панели',
    'Кухонные вытяжки',
    'Плиты',
    'Посудомоечные машины',
    'Духовые шкафы',
    'Холодильные витрины',
    'Морозильные камеры',
    'Винные шкафы',
    'Сушильные машины',
    'Кулеры для воды и аксессуары',
    'Аксессуары для крупной бытовой техники',
  ]),
  buildGroup('electronics', 'Техника для кухни', [
    'Кофеварки и кофемашины',
    'Электрические чайники и термопоты',
    'Миксеры, блендеры и измельчители',
    'Печи и грили',
    'Мультиварки и техника для варки',
    'Соковыжималки',
    'Мясорубки и насадки',
    'Настольные плиты',
    'Техника для приготовления десертов',
    'Прочая кухонная техника',
    'Аксессуары для кухонной техники',
  ]),
  buildGroup('electronics', 'Климатическая техника', [
    'Кондиционеры и сплит-системы',
    'Вентиляторы',
    'Увлажнители воздуха и аромадиффузоры',
    'Аромамашины',
    'Водонагреватели',
    'Техника для вентиляции',
    'Охладители воздуха',
    'Очистители воздуха',
    'Мойки воздуха',
    'Осушители воздуха',
    'Обогреватели и тепловентиляторы',
    'Погодные станции и датчики',
    'Расходные материалы для климатической техники',
  ]),
  buildGroup('electronics', 'Встраиваемая бытовая техника', [
    'Холодильники и морозильники',
    'Стиральные машины',
    'Посудомоечные машины',
    'Варочные панели',
    'Духовые шкафы',
    'Кухонные вытяжки',
    'Микроволновые печи',
    'Комплекты встраиваемой техники',
    'Кофемашины',
    'Винные шкафы',
    'Пароварки',
  ]),
  buildGroup('electronics', 'Техника для дома', [
    'Пылесосы и аксессуары',
    'Утюги и отпариватели',
    'Швейные машины и аксессуары',
    'Пароочистители',
    'Паровые швабры',
    'Стеклоочистители',
    'Сушилки для рук',
  ]),
  buildGroup('electronics', 'Техника для красоты и здоровья', [
    'Фены и термощетки',
    'Эпиляторы',
    'Электрические зубные щетки и насадки',
    'Электробритвы и аксессуары',
    'Выпрямители для волос',
    'Щипцы для завивки волос и стайлеры',
    'Электробигуди',
    'Машинки для стрижки волос и насадки',
    'Триммеры для волос',
    'Массажное оборудование и аксессуары',
    'Напольные весы',
  ]),
  buildGroup('electronics', 'Смартфоны', ['Смартфоны']),
  buildGroup('electronics', 'Запчасти для смартфонов', ['Запчасти для смартфонов']),
  buildGroup('electronics', 'Всё для смартфонов и телефонов', [
    'Кабели для смартфонов',
    'Аккумуляторы для смартфонов',
    'Bluetooth-метки, брелки и умные визитки',
    'Чехлы для смартфонов',
    'Защитные стекла',
    'Защитные пленки',
    'Подставки и держатели для смартфонов',
    'Автомобильные и мотоциклетные держатели',
    'Аксессуары для мобильной съемки',
    'Очки виртуальной реальности для смартфонов',
  ]),
  buildGroup('electronics', 'Смарт-часы', ['Смарт-часы']),
  buildGroup('electronics', 'Фитнес-браслеты', ['Фитнес-браслеты']),
  buildGroup('electronics', 'Ремешки для смарт-часов и фитнес-браслетов', [
    'Ремешки для смарт-часов и фитнес-браслетов',
  ]),
  buildGroup('electronics', 'Аксессуары для смарт-часов и фитнес-браслетов', [
    'Аксессуары для смарт-часов и фитнес-браслетов',
  ]),
  buildGroup('electronics', 'Мобильные телефоны', ['Мобильные телефоны']),
  buildGroup('electronics', 'SIM-карты', ['SIM-карты']),
  buildGroup('electronics', 'Проводные и радиотелефоны', ['Проводные и радиотелефоны']),
];

export const catalogCategories: CatalogCategory[] = [
  {
    id: 'all',
    label: 'Весь каталог',
    description: 'Все товарные семейства SIDRAT в одном месте',
    icon: LayoutGrid,
    matchCategories: ['footwear', 'apparel', 'audio', 'electronics'],
    accent: 'from-[#2A7F6E] to-[#17493f]',
    groups: [
      {
        title: 'Популярное',
        slug: 'popular',
        items: [
          { label: 'Активные GB-сессии', slug: 'active-sessions', href: '/sessions', note: 'Смотрите живые сессии' },
          { label: 'Создать сессию', slug: 'create-session', href: '/catalog', note: 'Запустить новую GB-цепочку' },
          { label: 'Кошелёк', slug: 'wallet', href: '/wallet', note: 'Баланс и возвраты' },
        ],
      },
      {
        title: 'Категории',
        slug: 'categories',
        items: [
          { label: 'Электроника', slug: 'electronics', href: buildCatalogHref('electronics'), note: 'Большой раздел с подкатегориями' },
          { label: 'Обувь', slug: 'footwear', href: buildCatalogHref('footwear'), note: 'Кроссовки и повседневные пары' },
          { label: 'Одежда', slug: 'apparel', href: buildCatalogHref('apparel'), note: 'Рубашки и базовые вещи' },
          { label: 'Аудио', slug: 'audio', href: buildCatalogHref('audio'), note: 'Наушники и гаджеты' },
        ],
      },
    ],
  },
  {
    id: 'electronics',
    label: 'Электроника',
    description: 'Бытовая техника, мобильные устройства и полезные аксессуары',
    icon: Cpu,
    matchCategories: ['electronics'],
    accent: 'from-slate-800 to-slate-950',
    groups: electronicsGroups,
  },
  {
    id: 'footwear',
    label: 'Обувь',
    description: 'Кроссовки, повседневная обувь и спортивные пары',
    icon: Footprints,
    matchCategories: ['footwear'],
    accent: 'from-[#2A7F6E] to-[#236b5d]',
    groups: [
      buildGroup('footwear', 'Кроссовки', ['Лайфстайл', 'Спортивные', 'Новые поступления']),
      buildGroup('footwear', 'Подборки', ['Хиты недели', 'Скидки']),
    ],
  },
  {
    id: 'apparel',
    label: 'Одежда',
    description: 'Рубашки, базовые вещи и универсальные гардеробные позиции',
    icon: Shirt,
    matchCategories: ['apparel'],
    accent: 'from-[#C5A059] to-[#8d6a2f]',
    groups: [
      buildGroup('apparel', 'База гардероба', ['Рубашки', 'Футболки', 'Верхний слой']),
      buildGroup('apparel', 'По сценарию', ['Офис', 'Повседневное']),
    ],
  },
  {
    id: 'audio',
    label: 'Аудио',
    description: 'Наушники, аксессуары и компактная техника',
    icon: Headphones,
    matchCategories: ['audio'],
    accent: 'from-slate-700 to-slate-900',
    groups: [
      buildGroup('audio', 'Наушники', ['Беспроводные', 'Шумоподавление', 'На каждый день']),
      buildGroup('audio', 'Подборки', ['Лучшие предложения', 'Готовые GB', 'Витрина']),
    ],
  },
];

export function getCatalogCategory(id: string | null | undefined) {
  return catalogCategories.find((category) => category.id === id) ?? catalogCategories[0];
}

export function getCatalogCategorySearchText(id: string | null | undefined) {
  const category = getCatalogCategory(id);
  return [
    category.id,
    category.label,
    category.description,
    ...category.groups.flatMap((group) => [
      group.title,
      group.slug,
      ...group.items.flatMap((item) => [item.label, item.slug, item.note ?? '']),
    ]),
  ]
    .join(' ')
    .toLowerCase();
}

export function getCatalogGroup(categoryId: string, sectionSlug?: string | null) {
  const category = getCatalogCategory(categoryId);
  if (!sectionSlug) return category.groups[0] ?? null;
  return category.groups.find((group) => group.slug === sectionSlug) ?? null;
}

export function buildCatalogProductSlug(categoryId: string, sectionSlug?: string, itemSlug?: string) {
  return buildCatalogSlug(categoryId, sectionSlug, itemSlug);
}

export function productMatchesCatalogCategory(product: Product, categoryId: string, sectionSlug?: string | null, itemSlug?: string | null) {
  if (categoryId === 'all') return true;

  if (categoryId !== 'electronics') {
    const category = getCatalogCategory(categoryId);
    return category.matchCategories.includes(product.category);
  }

  const categorySlug = product.categorySlug ?? '';
  const electronicsSlugPrefix = 'electronics/';

  if (itemSlug && sectionSlug) {
    return categorySlug === buildCatalogSlug('electronics', sectionSlug, itemSlug);
  }

  if (sectionSlug) {
    return (
      product.category === 'electronics' &&
      (categorySlug === buildCatalogSlug('electronics', sectionSlug) ||
        categorySlug.startsWith(`${electronicsSlugPrefix}${sectionSlug}/`))
    );
  }

  return product.category === 'electronics' || categorySlug.startsWith(electronicsSlugPrefix);
}
