import type { Product } from '@/types';

export interface ShoeSizeOption {
  id: string;
  ru: number;
  eu: number;
  lengthCm: number;
}

export const SHOE_SIZE_OPTIONS: ShoeSizeOption[] = [
  { id: 'ru34-eu35', ru: 34, eu: 35, lengthCm: 22 },
  { id: 'ru35-eu36', ru: 35, eu: 36, lengthCm: 23 },
  { id: 'ru36-eu37', ru: 36, eu: 37, lengthCm: 23.5 },
  { id: 'ru37-eu38', ru: 37, eu: 38, lengthCm: 24 },
  { id: 'ru38-eu39', ru: 38, eu: 39, lengthCm: 24.5 },
  { id: 'ru39-eu40', ru: 39, eu: 40, lengthCm: 25 },
  { id: 'ru40-eu41', ru: 40, eu: 41, lengthCm: 26 },
  { id: 'ru41-eu42', ru: 41, eu: 42, lengthCm: 26.5 },
  { id: 'ru42-eu43', ru: 42, eu: 43, lengthCm: 27 },
  { id: 'ru43-eu44', ru: 43, eu: 44, lengthCm: 27.5 },
  { id: 'ru44-eu45', ru: 44, eu: 45, lengthCm: 28 },
  { id: 'ru45-eu46', ru: 45, eu: 46, lengthCm: 28.5 },
  { id: 'ru46-eu47', ru: 46, eu: 47, lengthCm: 29 },
  { id: 'ru47-eu48', ru: 47, eu: 48, lengthCm: 29.5 },
  { id: 'ru48-eu49', ru: 48, eu: 49, lengthCm: 30 },
];

function normalizeSizeToken(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function isFootwearCategory(category: string | null | undefined) {
  return category === 'footwear';
}

export function formatShoeSizeLabel(option: ShoeSizeOption) {
  return `${option.ru} RU / EU${option.eu} / ${String(option.lengthCm).replace(/\.0$/, '')} см`;
}

export function findShoeSizeOption(value: string) {
  const normalized = normalizeSizeToken(value);
  if (!normalized) return null;

  const directMatch = SHOE_SIZE_OPTIONS.find((option) => option.id === normalized);
  if (directMatch) return directMatch;

  const ruMatch = normalized.match(/(?:ru)?\s*(\d{2})/);
  const ruValue = ruMatch ? Number(ruMatch[1]) : Number.NaN;
  if (!Number.isNaN(ruValue)) {
    return SHOE_SIZE_OPTIONS.find((option) => option.ru === ruValue) || null;
  }

  const euMatch = normalized.match(/eu\s*(\d{2})/);
  const euValue = euMatch ? Number(euMatch[1]) : Number.NaN;
  if (!Number.isNaN(euValue)) {
    return SHOE_SIZE_OPTIONS.find((option) => option.eu === euValue) || null;
  }

  return SHOE_SIZE_OPTIONS.find((option) => normalizeSizeToken(formatShoeSizeLabel(option)) === normalized) || null;
}

export function getShoeSizeOptionsByIds(ids: string[]) {
  return ids
    .map((id) => SHOE_SIZE_OPTIONS.find((option) => option.id === normalizeSizeToken(id)) || findShoeSizeOption(id))
    .filter((option): option is ShoeSizeOption => Boolean(option));
}

export function getShoeSizeIdsFromLegacySizes(sizes: string[]) {
  return sizes
    .map((size) => findShoeSizeOption(size)?.id)
    .filter((value): value is string => Boolean(value));
}

export function getLegacyShoeSizesFromIds(ids: string[]) {
  return getShoeSizeOptionsByIds(ids).map((option) => String(option.ru));
}

export function getProductShoeSizes(product: Pick<Product, 'category' | 'allowedSizes'> & { shoeSizeIds?: string[] }) {
  if (!isFootwearCategory(product.category)) return [];
  if (product.shoeSizeIds && product.shoeSizeIds.length > 0) {
    return getShoeSizeOptionsByIds(product.shoeSizeIds);
  }
  const legacyIds = getShoeSizeIdsFromLegacySizes(product.allowedSizes);
  return legacyIds.length > 0
    ? getShoeSizeOptionsByIds(legacyIds)
    : product.allowedSizes.map((size) => findShoeSizeOption(size)).filter((option): option is ShoeSizeOption => Boolean(option));
}
