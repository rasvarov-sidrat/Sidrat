import type {
  GroupBuyingSession,
  Order,
  Participation,
  Product,
  ProductVariant,
  ShippingAddress,
  User,
  WalletTransaction,
  WithdrawalRequest,
} from '@/types';
import { buildCatalogProductSlug, slugifyCatalogSegment } from '@/lib/catalog';
import { getShoeSizeIdsFromLegacySizes } from '@/lib/shoe-sizes';
import { getProductMediaPaths, isLocalAssetPath } from '@/lib/image-manifest';

const STORAGE_KEYS = {
  users: 'sidrat_users',
  products: 'sidrat_products',
  sessions: 'sidrat_sessions',
  orders: 'sidrat_orders',
  walletTransactions: 'sidrat_wallet_transactions',
  withdrawals: 'sidrat_withdrawals',
  currentUser: 'currentUser',
} as const;

const STORAGE_SCHEMA_VERSION_KEY = 'sidrat_storage_schema_version';
const STORAGE_SCHEMA_VERSION = 2;
const DEMO_SEED_ISO = '2026-06-24T00:00:00.000Z';
const DEMO_SEED_DATE = new Date(DEMO_SEED_ISO);
const DEMO_SEED_FUTURE_ISO = new Date(DEMO_SEED_DATE.getTime() + 72 * 60 * 60 * 1000).toISOString();

const DEFAULT_WITHDRAWAL_FEE_RATE = 0.05;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function readStorage<T>(key: string, fallback: T): T {
  return safeParse<T>(localStorage.getItem(key), fallback);
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function demoIso() {
  return DEMO_SEED_ISO;
}

function demoFutureIso() {
  return DEMO_SEED_FUTURE_ISO;
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="#f3f4f6"/>
  <rect x="80" y="80" width="1040" height="740" rx="48" fill="#e5e7eb"/>
  <text x="600" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="700" fill="#6b7280">SIDRAT</text>
  <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#9ca3af">No image available</text>
</svg>
`)}`

function normalizeMediaValue(value: string | undefined | null) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeMediaValue(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function getProductImages(product: Pick<Product, 'image' | 'images'>) {
  const images = uniqueStrings([product.image, ...(product.images || [])]).filter((value) => isLocalAssetPath(value));
  return images.length > 0 ? images : [DEFAULT_PRODUCT_IMAGE];
}

export function getProductCoverImage(product: Pick<Product, 'image' | 'images'>) {
  return getProductImages(product)[0] || DEFAULT_PRODUCT_IMAGE;
}

function getStorageSchemaVersion() {
  return localStorage.getItem(STORAGE_SCHEMA_VERSION_KEY);
}

function setStorageSchemaVersion() {
  localStorage.setItem(STORAGE_SCHEMA_VERSION_KEY, String(STORAGE_SCHEMA_VERSION));
}

function clearAppStorage() {
  [
    STORAGE_KEYS.users,
    STORAGE_KEYS.products,
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.orders,
    STORAGE_KEYS.walletTransactions,
    STORAGE_KEYS.withdrawals,
    STORAGE_KEYS.currentUser,
    'sidrat-storage',
  ].forEach((key) => localStorage.removeItem(key));
}

export class MvpError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'MvpError';
  }
}

export function calculateSlotPrice(
  basePrice: number,
  discountStep: number,
  maxDiscount: number,
  slotNumber: number,
) {
  const rawPrice = Math.ceil(basePrice * (100 - (slotNumber - 1) * discountStep) / 100);
  const floorPrice = Math.ceil(basePrice * (100 - maxDiscount) / 100);
  return Math.max(rawPrice, floorPrice);
}

export function getSlotCount(discountStep: number, maxDiscount: number) {
  if (discountStep <= 0) return 1;
  return Math.floor(maxDiscount / discountStep) + 1;
}

export function formatRuble(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} \u20BD`;
}

export const demoUsers: User[] = [
  {
    id: 'buyer-demo',
    email: 'buyer@example.com',
    name: 'Demo Buyer',
    role: 'buyer',
    emailVerifiedAt: demoIso(),
    walletBalance: 1200,
    referralCode: 'BUYER1',
    createdAt: demoIso(),
  },
  {
    id: 'seller-demo',
    email: 'seller@example.com',
    name: 'Demo Seller',
    role: 'seller',
    emailVerifiedAt: demoIso(),
    walletBalance: 300,
    referralCode: 'SELLER1',
    createdAt: demoIso(),
  },
  {
    id: 'admin-demo',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    emailVerifiedAt: demoIso(),
    walletBalance: 0,
    referralCode: 'ADMIN1',
    createdAt: demoIso(),
  },
];

export const demoProducts: Product[] = [
  {
    id: 'family-nike-air-max',
    slug: 'nike-air-max-2024',
    name: 'Nike Air Max 2024',
    description: 'Р“РёР±РєР°СЏ GB-СЃРµСЃСЃРёСЏ РЅР° РѕРґРЅСѓ РјРѕРґРµР»СЊ СЃ РґРѕСЃС‚СѓРїРЅС‹РјРё СЂР°Р·РјРµСЂР°РјРё Рё С†РІРµС‚Р°РјРё.',
    category: 'footwear',
    image: '/assets/products/nike-air-max-2024/cover.svg',
    images: [
      '/assets/products/nike-air-max-2024/cover.svg',
      '/assets/products/nike-air-max-2024/alt-1.svg',
    ],
    basePrice: 1321,
    discountStep: 5,
    maxDiscount: 20,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['41', '42', '43', '44'],
    shoeSizeIds: ['ru41-eu42', 'ru42-eu43', 'ru43-eu44', 'ru44-eu45'],
    allowedColors: ['Black', 'White'],
    variants: [
      { id: 'nike-41-black', familyId: 'family-nike-air-max', size: '41', color: 'Black', sku: 'NAM-41-BLK', stock: 6, image: '/assets/products/nike-air-max-2024/cover.svg', isAllowedInGb: true },
      { id: 'nike-42-black', familyId: 'family-nike-air-max', size: '42', color: 'Black', sku: 'NAM-42-BLK', stock: 6, image: '/assets/products/nike-air-max-2024/cover.svg', isAllowedInGb: true },
      { id: 'nike-43-black', familyId: 'family-nike-air-max', size: '43', color: 'Black', sku: 'NAM-43-BLK', stock: 6, image: '/assets/products/nike-air-max-2024/cover.svg', isAllowedInGb: true },
      { id: 'nike-41-white', familyId: 'family-nike-air-max', size: '41', color: 'White', sku: 'NAM-41-WHT', stock: 4, image: '/assets/products/nike-air-max-2024/alt-1.svg', isAllowedInGb: true },
      { id: 'nike-42-white', familyId: 'family-nike-air-max', size: '42', color: 'White', sku: 'NAM-42-WHT', stock: 4, image: '/assets/products/nike-air-max-2024/alt-1.svg', isAllowedInGb: true },
    ],
    specs: {
      'Р Р°Р·РјРµСЂС‹': '41-44',
      'Р¦РІРµС‚Р°': 'Black / White',
      'РЎРєРёРґРєР°': '5% Р·Р° СЃР»РѕС‚',
    },
  },
  {
    id: 'family-oxford-shirt',
    slug: 'oxford-shirt',
    name: 'Oxford Classic Shirt',
    description: 'Р СѓР±Р°С€РєР° СЃ РіРёР±РєРѕР№ РІР°СЂРёР°С‚РёРІРЅРѕСЃС‚СЊСЋ РїРѕ С†РІРµС‚Сѓ Рё СЂР°Р·РјРµСЂР°Рј РІ СЂР°РјРєР°С… РѕРґРЅРѕР№ GB-СЃРµСЃСЃРёРё.',
    category: 'apparel',
    image: '/assets/products/oxford-shirt/cover.svg',
    images: [
      '/assets/products/oxford-shirt/cover.svg',
      '/assets/products/oxford-shirt/alt-1.svg',
    ],
    basePrice: 2190,
    discountStep: 10,
    maxDiscount: 30,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['S', 'M', 'L', 'XL'],
    allowedColors: ['Blue', 'White'],
    variants: [
      { id: 'shirt-s-blue', familyId: 'family-oxford-shirt', size: 'S', color: 'Blue', sku: 'OX-S-BLU', stock: 8, image: '/assets/products/oxford-shirt/cover.svg', isAllowedInGb: true },
      { id: 'shirt-m-blue', familyId: 'family-oxford-shirt', size: 'M', color: 'Blue', sku: 'OX-M-BLU', stock: 8, image: '/assets/products/oxford-shirt/cover.svg', isAllowedInGb: true },
      { id: 'shirt-l-white', familyId: 'family-oxford-shirt', size: 'L', color: 'White', sku: 'OX-L-WHT', stock: 5, image: '/assets/products/oxford-shirt/alt-1.svg', isAllowedInGb: true },
    ],
    specs: {
      'Р Р°Р·РјРµСЂС‹': 'S-XL',
      'Р¦РІРµС‚Р°': 'Blue / White',
      'РЎРєРёРґРєР°': '10% Р·Р° СЃР»РѕС‚',
    },
  },
  {
    id: 'family-sony-headphones',
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    description: 'РђСѓРґРёРѕ-family СЃ РґРІСѓРјСЏ С†РІРµС‚РѕРІС‹РјРё РІР°СЂРёР°РЅС‚Р°РјРё РІРЅСѓС‚СЂРё РѕРґРЅРѕР№ GB-СЃРµСЃСЃРёРё.',
    category: 'audio',
    image: '/assets/products/sony-wh-1000xm5/cover.svg',
    images: [
      '/assets/products/sony-wh-1000xm5/cover.svg',
    ],
    basePrice: 18990,
    discountStep: 5,
    maxDiscount: 20,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['Black', 'Silver'],
    variants: [
      { id: 'sony-black', familyId: 'family-sony-headphones', size: 'One size', color: 'Black', sku: 'SONY-BLK', stock: 10, image: '/assets/products/sony-wh-1000xm5/cover.svg', isAllowedInGb: true },
      { id: 'sony-silver', familyId: 'family-sony-headphones', size: 'One size', color: 'Silver', sku: 'SONY-SLV', stock: 8, image: '/assets/products/sony-wh-1000xm5/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'Р¦РІРµС‚Р°': 'Black / Silver',
      'РЎРєРёРґРєР°': '5% Р·Р° СЃР»РѕС‚',
      'РЎРµРјРµР№СЃС‚РІРѕ': '1 РјРѕРґРµР»СЊ',
    },
  },
  {
    id: 'family-lg-fridge',
    slug: 'lg-instaview-fridge',
    name: 'LG InstaView Refrigerator',
    description: 'РҐРѕР»РѕРґРёР»СЊРЅРёРє СЃ РїСЂРµРјРёР°Р»СЊРЅРѕР№ СЃС‚РµРєР»СЏРЅРЅРѕР№ РґРІРµСЂСЊСЋ Рё Р±РѕР»СЊС€РёРј РѕР±СЉС‘РјРѕРј РґР»СЏ СЃРµРјРµР№РЅРѕР№ РєСѓС…РЅРё.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РљСЂСѓРїРЅР°СЏ Р±С‹С‚РѕРІР°СЏ С‚РµС…РЅРёРєР°'),
      slugifyCatalogSegment('РҐРѕР»РѕРґРёР»СЊРЅРёРєРё'),
    ),
    image: '/assets/products/lg-instaview-fridge/cover.svg',
    images: [
      '/assets/products/lg-instaview-fridge/cover.svg',
      '/assets/products/lg-instaview-fridge/alt-1.svg',
    ],
    basePrice: 89990,
    discountStep: 2500,
    maxDiscount: 10000,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['Silver', 'Black'],
    variants: [
      { id: 'lg-fridge-silver', familyId: 'family-lg-fridge', size: 'One size', color: 'Silver', sku: 'LG-FR-SLV', stock: 3, image: '/assets/products/lg-instaview-fridge/cover.svg', isAllowedInGb: true },
      { id: 'lg-fridge-black', familyId: 'family-lg-fridge', size: 'One size', color: 'Black', sku: 'LG-FR-BLK', stock: 2, image: '/assets/products/lg-instaview-fridge/alt-1.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РљСЂСѓРїРЅР°СЏ Р±С‹С‚РѕРІР°СЏ С‚РµС…РЅРёРєР°',
      'РўРёРї': 'РҐРѕР»РѕРґРёР»СЊРЅРёРє',
      'Р¦РІРµС‚Р°': 'Silver / Black',
      'РЎРєРёРґРєР°': '2500 ₽ Р·Р° СЃР»РѕС‚',
    },
  },
  {
    id: 'family-bosch-washer',
    slug: 'bosch-serie-6-washing-machine',
    name: 'Bosch Serie 6 Washing Machine',
    description: 'РўРёС…Р°СЏ СЃС‚РёСЂР°Р»СЊРЅР°СЏ РјР°С€РёРЅР° РґР»СЏ РµР¶РµРґРЅРµРІРЅРѕР№ Р·Р°РіСЂСѓР·РєРё Рё СЌРєРѕРЅРѕРјРЅРѕРіРѕ СЂР°СЃС…РѕРґР° РІРѕРґС‹.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РљСЂСѓРїРЅР°СЏ Р±С‹С‚РѕРІР°СЏ С‚РµС…РЅРёРєР°'),
      slugifyCatalogSegment('РЎС‚РёСЂР°Р»СЊРЅС‹Рµ РјР°С€РёРЅС‹'),
    ),
    image: '/assets/products/bosch-serie-6-washing-machine/cover.svg',
    images: [
      '/assets/products/bosch-serie-6-washing-machine/cover.svg',
    ],
    basePrice: 54990,
    discountStep: 1800,
    maxDiscount: 9000,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['White'],
    variants: [
      { id: 'bosch-washer-white', familyId: 'family-bosch-washer', size: 'One size', color: 'White', sku: 'BSH-W-001', stock: 4, image: '/assets/products/bosch-serie-6-washing-machine/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РљСЂСѓРїРЅР°СЏ Р±С‹С‚РѕРІР°СЏ С‚РµС…РЅРёРєР°',
      'РўРёРї': 'РЎС‚РёСЂР°Р»СЊРЅР°СЏ РјР°С€РёРЅР°',
      'РљР»Р°СЃСЃ': 'A+++',
    },
  },
  {
    id: 'family-delonghi-coffee',
    slug: 'delonghi-dinamica-coffee-machine',
    name: 'DeLonghi Dinamica',
    description: 'РљРѕС„РµРјР°С€РёРЅР° РґР»СЏ СЌСЃРїСЂРµСЃСЃРѕ, РєР°РїСѓС‡РёРЅРѕ Рё РїРѕРІСЃРµРґРЅРµРІРЅРѕРіРѕ РєРѕС„Рµ РґРѕРјР°.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РўРµС…РЅРёРєР° РґР»СЏ РєСѓС…РЅРё'),
      slugifyCatalogSegment('РљРѕС„РµРІР°СЂРєРё Рё РєРѕС„РµРјР°С€РёРЅС‹'),
    ),
    image: '/assets/products/delonghi-dinamica-coffee-machine/cover.svg',
    images: [
      '/assets/products/delonghi-dinamica-coffee-machine/cover.svg',
    ],
    basePrice: 34990,
    discountStep: 1200,
    maxDiscount: 6000,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['Black', 'Silver'],
    variants: [
      { id: 'delonghi-black', familyId: 'family-delonghi-coffee', size: 'One size', color: 'Black', sku: 'DEL-CF-BLK', stock: 5, image: '/assets/products/delonghi-dinamica-coffee-machine/cover.svg', isAllowedInGb: true },
      { id: 'delonghi-silver', familyId: 'family-delonghi-coffee', size: 'One size', color: 'Silver', sku: 'DEL-CF-SLV', stock: 4, image: '/assets/products/delonghi-dinamica-coffee-machine/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РўРµС…РЅРёРєР° РґР»СЏ РєСѓС…РЅРё',
      'РўРёРї': 'РљРѕС„РµРјР°С€РёРЅР°',
      'РќР°РїРёС‚РєРё': 'Espresso / Cappuccino',
    },
  },
  {
    id: 'family-daikin-ac',
    slug: 'daikin-split-system',
    name: 'Daikin Split System',
    description: 'РўРёС…Р°СЏ СЃРїР»РёС‚-СЃРёСЃС‚РµРјР° РґР»СЏ СЃС‚Р°Р±РёР»СЊРЅРѕРіРѕ РєР»РёРјР°С‚Р° РІ РєРѕРјРЅР°С‚Рµ РёР»Рё РѕС„РёСЃРµ.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РљР»РёРјР°С‚РёС‡РµСЃРєР°СЏ С‚РµС…РЅРёРєР°'),
      slugifyCatalogSegment('РљРѕРЅРґРёС†РёРѕРЅРµСЂС‹ Рё СЃРїР»РёС‚-СЃРёСЃС‚РµРјС‹'),
    ),
    image: '/assets/products/daikin-split-system/cover.svg',
    images: [
      '/assets/products/daikin-split-system/cover.svg',
    ],
    basePrice: 46990,
    discountStep: 1500,
    maxDiscount: 7500,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['White'],
    variants: [
      { id: 'daikin-white', familyId: 'family-daikin-ac', size: 'One size', color: 'White', sku: 'DAI-AC-WHT', stock: 6, image: '/assets/products/daikin-split-system/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РљР»РёРјР°С‚РёС‡РµСЃРєР°СЏ С‚РµС…РЅРёРєР°',
      'РўРёРї': 'РЎРїР»РёС‚-СЃРёСЃС‚РµРјР°',
      'Р РµР¶РёРј': 'Cooling / Heating',
    },
  },
  {
    id: 'family-iphone-15-pro',
    slug: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    description: 'Р¤Р»Р°РіРјР°РЅСЃРєРёР№ СЃРјР°СЂС‚С„РѕРЅ РґР»СЏ С‚РµС…, РєРѕРјСѓ РЅСѓР¶РЅР° РєР°РјРµСЂР°, СЃРєРѕСЂРѕСЃС‚СЊ Рё Р·Р°РїР°СЃ РїРѕ РїР°РјСЏС‚Рё.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РЎРјР°СЂС‚С„РѕРЅС‹'),
      slugifyCatalogSegment('РЎРјР°СЂС‚С„РѕРЅС‹'),
    ),
    image: '/assets/products/iphone-15-pro-max/cover.svg',
    images: [
      '/assets/products/iphone-15-pro-max/cover.svg',
      '/assets/products/iphone-15-pro-max/alt-1.svg',
    ],
    basePrice: 119990,
    discountStep: 3500,
    maxDiscount: 15000,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['256 GB', '512 GB'],
    allowedColors: ['Natural Titanium', 'Black Titanium'],
    variants: [
      { id: 'iphone-256-natural', familyId: 'family-iphone-15-pro', size: '256 GB', color: 'Natural Titanium', sku: 'IP15P-256-NAT', stock: 7, image: '/assets/products/iphone-15-pro-max/cover.svg', isAllowedInGb: true },
      { id: 'iphone-512-black', familyId: 'family-iphone-15-pro', size: '512 GB', color: 'Black Titanium', sku: 'IP15P-512-BLK', stock: 5, image: '/assets/products/iphone-15-pro-max/alt-1.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РЎРјР°СЂС‚С„РѕРЅС‹',
      'РџР°РјСЏС‚СЊ': '256 / 512 GB',
      'Р§РёРї': 'A17 Pro',
    },
  },
  {
    id: 'family-galaxy-watch',
    slug: 'samsung-galaxy-watch',
    name: 'Samsung Galaxy Watch',
    description: 'РЎРјР°СЂС‚-С‡Р°СЃС‹ РґР»СЏ СЃРїРѕСЂС‚Р°, СѓРІРµРґРѕРјР»РµРЅРёР№ Рё РєРѕРЅС‚СЂРѕР»СЏ Р·РґРѕСЂРѕРІСЊСЏ.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('РЎРјР°СЂС‚-С‡Р°СЃС‹'),
      slugifyCatalogSegment('РЎРјР°СЂС‚-С‡Р°СЃС‹'),
    ),
    image: '/assets/products/samsung-galaxy-watch/cover.svg',
    images: [
      '/assets/products/samsung-galaxy-watch/cover.svg',
    ],
    basePrice: 22990,
    discountStep: 900,
    maxDiscount: 4500,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['One size'],
    allowedColors: ['Black', 'Silver'],
    variants: [
      { id: 'watch-black', familyId: 'family-galaxy-watch', size: 'One size', color: 'Black', sku: 'GW-BLK', stock: 8, image: '/assets/products/samsung-galaxy-watch/cover.svg', isAllowedInGb: true },
      { id: 'watch-silver', familyId: 'family-galaxy-watch', size: 'One size', color: 'Silver', sku: 'GW-SLV', stock: 6, image: '/assets/products/samsung-galaxy-watch/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РќРѕСЃРёРјР°СЏ СЌР»РµРєС‚СЂРѕРЅРёРєР°',
      'РўРёРї': 'РЎРјР°СЂС‚-С‡Р°СЃС‹',
      'Р¤СѓРЅРєС†РёРё': 'РЎРїРѕСЂС‚ / Р·РґРѕСЂРѕРІСЊРµ / СѓРІРµРґРѕРјР»РµРЅРёСЏ',
    },
  },
  {
    id: 'family-anker-cable',
    slug: 'anker-usb-c-cable',
    name: 'Anker USB-C Cable',
    description: 'РљР°Р±РµР»СЊ РґР»СЏ СЃРјР°СЂС‚С„РѕРЅРѕРІ Рё РїРѕРІСЃРµРґРЅРµРІРЅРѕР№ Р·Р°СЂСЏРґРєРё Р±РµР· Р»РёС€РЅРµРіРѕ С€СѓРјР°.',
    category: 'electronics',
    categorySlug: buildCatalogProductSlug(
      'electronics',
      slugifyCatalogSegment('Р’СЃС‘ РґР»СЏ СЃРјР°СЂС‚С„РѕРЅРѕРІ Рё С‚РµР»РµС„РѕРЅРѕРІ'),
      slugifyCatalogSegment('РљР°Р±РµР»Рё РґР»СЏ СЃРјР°СЂС‚С„РѕРЅРѕРІ'),
    ),
    image: '/assets/products/anker-usb-c-cable/cover.svg',
    images: [
      '/assets/products/anker-usb-c-cable/cover.svg',
    ],
    basePrice: 1490,
    discountStep: 80,
    maxDiscount: 320,
    sellerId: 'seller-demo',
    active: true,
    allowedSizes: ['1 m', '2 m'],
    allowedColors: ['Black'],
    variants: [
      { id: 'anker-1m', familyId: 'family-anker-cable', size: '1 m', color: 'Black', sku: 'ANK-CBL-1M', stock: 30, image: '/assets/products/anker-usb-c-cable/cover.svg', isAllowedInGb: true },
      { id: 'anker-2m', familyId: 'family-anker-cable', size: '2 m', color: 'Black', sku: 'ANK-CBL-2M', stock: 25, image: '/assets/products/anker-usb-c-cable/cover.svg', isAllowedInGb: true },
    ],
    specs: {
      'РљР°С‚РµРіРѕСЂРёСЏ': 'РђРєСЃРµСЃСЃСѓР°СЂС‹',
      'РўРёРї': 'USB-C РєР°Р±РµР»СЊ',
      'Р”Р»РёРЅР°': '1 / 2 Рј',
    },
  },
];

const demoOrders: Order[] = [
  {
    id: 'order-demo-1',
    userId: 'buyer-demo',
    sellerId: 'seller-demo',
    familyId: 'family-nike-air-max',
    sessionId: 'session-airmax-001',
    participationId: 'part-1',
    familyName: 'Nike Air Max 2024',
    variantLabel: '41 / Black',
    totalAmount: 1321,
    walletDeduction: 0,
    status: 'confirmed',
    createdAt: demoIso(),
    fulfilledAt: demoIso(),
    shippingAddress: {
      fullName: 'Demo Buyer',
      phone: '+7 900 000 00 01',
      address: 'СѓР». РўРІРµСЂСЃРєР°СЏ, 1',
      city: 'РњРѕСЃРєРІР°',
      region: 'РњРѕСЃРєРІР°',
      postalCode: '125009',
      country: 'Р РѕСЃСЃРёР№СЃРєР°СЏ Р¤РµРґРµСЂР°С†РёСЏ',
    },
  },
  {
    id: 'order-demo-2',
    userId: 'buyer-demo',
    sellerId: 'seller-demo',
    familyId: 'family-sony-headphones',
    familyName: 'Sony WH-1000XM5',
    variantLabel: 'One size / Black',
    totalAmount: 18990,
    walletDeduction: 500,
    status: 'fulfilled',
    createdAt: demoIso(),
    fulfilledAt: demoIso(),
    shippingAddress: {
      fullName: 'Demo Buyer',
      phone: '+7 900 000 00 02',
      address: 'РќРµРІСЃРєРёР№ РїСЂРѕСЃРїРµРєС‚, 10',
      city: 'РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі',
      region: 'РЎР°РЅРєС‚-РџРµС‚РµСЂР±СѓСЂРі',
      postalCode: '191186',
      country: 'Р РѕСЃСЃРёР№СЃРєР°СЏ Р¤РµРґРµСЂР°С†РёСЏ',
    },
  },
  {
    id: 'order-demo-3',
    userId: 'buyer-demo',
    sellerId: 'seller-demo',
    familyId: 'family-lg-fridge',
    familyName: 'LG InstaView Refrigerator',
    variantLabel: 'One size / Silver',
    totalAmount: 89990,
    walletDeduction: 0,
    status: 'processing',
    createdAt: demoIso(),
    shippingAddress: {
      fullName: 'Demo Buyer',
      phone: '+7 900 000 00 03',
      address: 'СѓР». Р‘Р°СѓРјР°РЅР°, 7',
      city: 'РљР°Р·Р°РЅСЊ',
      region: 'РўР°С‚Р°СЂСЃС‚Р°РЅ',
      postalCode: '420111',
      country: 'Р РѕСЃСЃРёР№СЃРєР°СЏ Р¤РµРґРµСЂР°С†РёСЏ',
    },
  },
];

function mergeSeedProducts(existingProducts: Product[]) {
  const byId = new Map(existingProducts.map((product) => [product.id, product]));
  let changed = false;

  for (const product of demoProducts) {
    if (!byId.has(product.id)) {
      byId.set(product.id, product);
      changed = true;
    }
  }

  return changed ? Array.from(byId.values()) : existingProducts;
}

function normalizeFootwearProduct(product: Product) {
  if (product.category !== 'footwear') return product;
  if (product.shoeSizeIds && product.shoeSizeIds.length > 0) return product;

  const shoeSizeIds = getShoeSizeIdsFromLegacySizes(product.allowedSizes);
  if (shoeSizeIds.length === 0) return product;

  return {
    ...product,
    shoeSizeIds,
  };
}

function normalizeProductMedia(product: Product) {
  const seedImages = getProductMediaPaths(product.slug);
  const images = uniqueStrings([
    ...seedImages,
    product.image,
    ...(product.images || []),
  ]).filter((value) => isLocalAssetPath(value));
  const image = images[0] || DEFAULT_PRODUCT_IMAGE;
  const nextImages = images.length > 0 ? images : [image];

  const imageChanged = product.image !== image;
  const imagesChanged =
    product.images.length !== nextImages.length ||
    product.images.some((value, index) => value !== nextImages[index]);

  if (!imageChanged && !imagesChanged) return product;

  return {
    ...product,
    image,
    images: nextImages,
  };
}

function normalizeStoredProduct(product: Product) {
  return normalizeProductMedia(normalizeFootwearProduct(product));
}

function mergeSeedOrders(existingOrders: Order[]) {
  const byId = new Map(existingOrders.map((order) => [order.id, order]));
  let changed = false;

  for (const order of demoOrders) {
    if (!byId.has(order.id)) {
      byId.set(order.id, order);
      changed = true;
    }
  }

  return changed ? Array.from(byId.values()) : existingOrders;
}

export function seedMvpData() {
  if (getStorageSchemaVersion() !== String(STORAGE_SCHEMA_VERSION)) {
    clearAppStorage();
    setStorageSchemaVersion();
  }

  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    writeStorage(STORAGE_KEYS.users, demoUsers);
  } else {
    const storedUsers = loadUsers();
    const demoUsersById = new Map(demoUsers.map((user) => [user.id, user] as const));
    const mergedUsers = storedUsers.map((user) => {
      const seedUser = demoUsersById.get(user.id);
      if (!seedUser) return user;
      return {
        ...seedUser,
        ...user,
        emailVerifiedAt: user.emailVerifiedAt ?? seedUser.emailVerifiedAt,
      };
    });
    const changed = mergedUsers.some((user, index) => user !== storedUsers[index]);
    if (changed) {
      writeStorage(STORAGE_KEYS.users, mergedUsers);
    }
  }
  const currentUser = getCurrentUser();
  if (currentUser && !loadUsers().some((user) => user.id === currentUser.id)) {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
  const storedProducts = loadProducts();
  if (storedProducts.length === 0) {
    writeStorage(STORAGE_KEYS.products, demoProducts);
  } else {
    const normalizedProducts = storedProducts.map(normalizeStoredProduct);
    const normalizationChanged = normalizedProducts.some((product, index) => product !== storedProducts[index]);
    const mergedProducts = mergeSeedProducts(normalizedProducts);
    if (normalizationChanged || mergedProducts !== normalizedProducts) {
      writeStorage(STORAGE_KEYS.products, mergedProducts);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.sessions)) {
    const seededSession: GroupBuyingSession = {
      id: 'session-airmax-001',
      familyId: 'family-nike-air-max',
      familySlug: 'nike-air-max-2024',
      title: 'Air Max family group buy',
      description: 'Public session for the Air Max family.',
      createdBy: 'seller-demo',
      createdByRole: 'seller',
      accessType: 'public',
      status: 'active',
      targetSlots: 5,
      currentSlots: 2,
      createdAt: demoIso(),
      expiresAt: demoFutureIso(),
      allowedSizes: ['41', '42', '43', '44'],
      allowedColors: ['Black', 'White'],
      basePriceSnapshot: 1321,
      discountStepSnapshot: 5,
      maxDiscountSnapshot: 20,
      currentFloorPrice: 1255,
      lastSettledPrice: 1255,
      inviteCode: 'AIRMAX2024',
      participants: [
        {
          id: 'part-1',
          sessionId: 'session-airmax-001',
          userId: 'buyer-demo',
          userName: 'Demo Buyer',
          variantId: 'nike-41-black',
          size: '41',
          color: 'Black',
          slotNumber: 1,
          pricePaid: 1321,
          status: 'paid',
          createdAt: demoIso(),
        },
        {
          id: 'part-2',
          sessionId: 'session-airmax-001',
          userId: 'guest-sidekick',
          userName: 'Guest Sidekick',
          variantId: 'nike-42-black',
          size: '42',
          color: 'Black',
          slotNumber: 2,
          pricePaid: 1255,
          status: 'paid',
          createdAt: demoIso(),
        },
      ],
    };
    writeStorage(STORAGE_KEYS.sessions, [seededSession]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.orders)) {
    writeStorage(STORAGE_KEYS.orders, demoOrders);
  } else {
    const storedOrders = loadOrders();
    const mergedOrders = mergeSeedOrders(storedOrders);
    if (mergedOrders !== storedOrders) {
      writeStorage(STORAGE_KEYS.orders, mergedOrders);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.walletTransactions)) {
    writeStorage(STORAGE_KEYS.walletTransactions, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.withdrawals)) {
    writeStorage(STORAGE_KEYS.withdrawals, []);
  }
}

export function loadUsers(): User[] {
  return readStorage<User[]>(STORAGE_KEYS.users, []);
}

export function saveUsers(users: User[]) {
  writeStorage(STORAGE_KEYS.users, users);
}

export function findUserByReferralCode(referralCode: string) {
  const normalizedCode = referralCode.trim();
  if (!normalizedCode) return null;
  return loadUsers().find((user) => user.referralCode === normalizedCode) || null;
}

export function loadProducts(): Product[] {
  return readStorage<Product[]>(STORAGE_KEYS.products, []);
}

export function saveProducts(products: Product[]) {
  writeStorage(STORAGE_KEYS.products, products);
}

export function loadSessions(): GroupBuyingSession[] {
  return readStorage<GroupBuyingSession[]>(STORAGE_KEYS.sessions, []);
}

export function saveSessions(sessions: GroupBuyingSession[]) {
  writeStorage(STORAGE_KEYS.sessions, sessions);
}

export function loadOrders(): Order[] {
  return readStorage<Order[]>(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders: Order[]) {
  writeStorage(STORAGE_KEYS.orders, orders);
}

export function findPendingSessionOrder(userId: string, sessionId: string) {
  return loadOrders().find(
    (order) => order.userId === userId && order.sessionId === sessionId && order.status === 'created',
  ) || null;
}

export function createCartOrder(input: {
  user: User;
  items: Array<{
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      basePrice: number;
      discountPrice?: number | null;
      images: string[];
      sellerId?: string;
      categorySlug?: string;
      variantLabel?: string;
    };
  }>;
  walletDeduction?: number;
}) {
  const items = input.items.filter((item) => item.quantity > 0 && !!item.product);
  if (items.length === 0) {
    throw new MvpError('cart_empty', 'Cart is empty');
  }

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.basePrice;
    return sum + price * item.quantity;
  }, 0);
  const summary = items
    .slice(0, 3)
    .map((item) => `${item.product.name}${item.product.variantLabel ? ` В· ${item.product.variantLabel}` : ''} Г— ${item.quantity}`)
    .join(', ');
  const extraCount = Math.max(0, items.length - 3);
  const sellerIds = Array.from(new Set(items.map((item) => item.product.sellerId).filter(Boolean)));
  const singleLineProduct = items.length === 1 ? items[0].product : null;

  const order: Order = {
    id: id('order'),
    userId: input.user.id,
    familyName: singleLineProduct?.name ?? 'РљРѕСЂР·РёРЅР° SIDRAT',
    variantLabel: extraCount > 0 ? `${summary} Рё РµС‰С‘ ${extraCount} С‚РѕРІР°СЂР°` : summary,
    totalAmount: subtotal,
    walletDeduction: Math.max(0, input.walletDeduction || 0),
    status: 'created',
    createdAt: nowIso(),
    sellerId: sellerIds.length === 1 ? sellerIds[0] : undefined,
    familyId: singleLineProduct?.id,
    categorySlug: singleLineProduct?.categorySlug,
  };

  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

export function getReferralRewardAmount(orderTotal: number) {
  return Math.max(0, Math.ceil(orderTotal * 0.01));
}

export function loadWalletTransactions(): WalletTransaction[] {
  return readStorage<WalletTransaction[]>(STORAGE_KEYS.walletTransactions, []);
}

export function saveWalletTransactions(transactions: WalletTransaction[]) {
  writeStorage(STORAGE_KEYS.walletTransactions, transactions);
}

export function loadWithdrawals(): WithdrawalRequest[] {
  return readStorage<WithdrawalRequest[]>(STORAGE_KEYS.withdrawals, []);
}

export function saveWithdrawals(withdrawals: WithdrawalRequest[]) {
  writeStorage(STORAGE_KEYS.withdrawals, withdrawals);
}

export function getCurrentUser(): User | null {
  const currentUser = readStorage<User | null>(STORAGE_KEYS.currentUser, null);
  if (!currentUser) return null;
  const refreshed = loadUsers().find((user) => user.id === currentUser.id);
  return refreshed || currentUser;
}

export function setCurrentUser(user: User | null) {
  if (user) {
    writeStorage(STORAGE_KEYS.currentUser, user);
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
  }
  window.dispatchEvent(new Event('sidrat-user-updated'));
}

export function findProductFamily(familyIdOrSlug: string) {
  const products = loadProducts();
  return products.find((product) => product.id === familyIdOrSlug || product.slug === familyIdOrSlug) || null;
}

export function findSession(sessionId: string) {
  const sessions = loadSessions();
  return sessions.find((session) => session.id === sessionId) || null;
}

export function getFamilySessions(familyId: string) {
  return loadSessions().filter((session) => session.familyId === familyId);
}

export function getFamilyActiveSessions(familyId: string) {
  return getFamilySessions(familyId).filter((session) => session.status === 'active');
}

export function getSessionPriceTable(session: GroupBuyingSession) {
  return Array.from({ length: session.targetSlots }, (_, index) => {
    const slotNumber = index + 1;
    return {
      slotNumber,
      price: calculateSlotPrice(
        session.basePriceSnapshot,
        session.discountStepSnapshot,
        session.maxDiscountSnapshot,
        slotNumber,
      ),
    };
  });
}

export function getSessionNextPrice(session: GroupBuyingSession) {
  const floorPrice = Math.ceil(session.basePriceSnapshot * (100 - session.maxDiscountSnapshot) / 100);
  const nextPrice = Math.ceil(session.currentFloorPrice * (100 - session.discountStepSnapshot) / 100);
  return Math.max(floorPrice, nextPrice);
}

export function getSessionPriceOverview(session: GroupBuyingSession) {
  return {
    initialPrice: session.basePriceSnapshot,
    currentPrice: session.currentFloorPrice,
    nextPrice: getSessionNextPrice(session),
  };
}

export type SessionFillBucket = '0-20' | '21-40' | '41-60' | '61-80' | '81-100';

export const SESSION_FILL_BUCKET_OPTIONS: Array<{ value: SessionFillBucket; label: string }> = [
  { value: '0-20', label: '0-20%' },
  { value: '21-40', label: '21-40%' },
  { value: '41-60', label: '41-60%' },
  { value: '61-80', label: '61-80%' },
  { value: '81-100', label: '81-100%' },
];

export function getSessionFillPercent(session: GroupBuyingSession) {
  if (session.targetSlots <= 0) return 0;
  return Math.min(100, (session.currentSlots / session.targetSlots) * 100);
}

export function getSessionFillBucket(session: GroupBuyingSession): SessionFillBucket {
  const fillPercent = getSessionFillPercent(session);
  if (fillPercent <= 20) return '0-20';
  if (fillPercent <= 40) return '21-40';
  if (fillPercent <= 60) return '41-60';
  if (fillPercent <= 80) return '61-80';
  return '81-100';
}

export function getSessionSavings(session: GroupBuyingSession) {
  return session.basePriceSnapshot - Math.ceil(session.basePriceSnapshot * (100 - session.maxDiscountSnapshot) / 100);
}

export function getSessionVariantOptions(session: GroupBuyingSession) {
  const family = findProductFamily(session.familyId);
  if (!family) return [];
  return family.variants.filter((variant) => {
    const sizeAllowed = session.allowedSizes.length === 0 || session.allowedSizes.includes(variant.size);
    const colorAllowed = session.allowedColors.length === 0 || session.allowedColors.includes(variant.color);
    return variant.isAllowedInGb && sizeAllowed && colorAllowed;
  });
}

export function createSession(input: {
  familyId: string;
  creator: User;
  accessType: 'public' | 'invite-link';
  expiresInHours: number;
  allowedSizes: string[];
  allowedColors: string[];
  title?: string;
  description?: string;
}) {
  const products = loadProducts();
  const family = products.find((product) => product.id === input.familyId);
  if (!family) {
    throw new MvpError('family_not_found', 'Family not found');
  }

  const sessions = loadSessions();
  const session: GroupBuyingSession = {
    id: id('session'),
    familyId: family.id,
    familySlug: family.slug,
    title: input.title || family.name,
    description: input.description || family.description,
    createdBy: input.creator.id,
    createdByRole: input.creator.role,
    accessType: input.accessType,
    status: 'active',
    targetSlots: getSlotCount(family.discountStep, family.maxDiscount),
    currentSlots: 0,
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000).toISOString(),
    allowedSizes: input.allowedSizes.length > 0 ? input.allowedSizes : family.allowedSizes,
    allowedColors: input.allowedColors.length > 0 ? input.allowedColors : family.allowedColors,
    basePriceSnapshot: family.basePrice,
    discountStepSnapshot: family.discountStep,
    maxDiscountSnapshot: family.maxDiscount,
    currentFloorPrice: family.basePrice,
    lastSettledPrice: family.basePrice,
    inviteCode: `${family.slug}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    participants: [],
  };

  sessions.unshift(session);
  saveSessions(sessions);
  return session;
}

export function joinSession(input: {
  sessionId: string;
  user: User;
  variantId: string;
  walletSpend?: number;
}) {
  const sessions = loadSessions();
  const sessionIndex = sessions.findIndex((item) => item.id === input.sessionId);
  if (sessionIndex === -1) {
    throw new MvpError('session_not_found', 'Session not found');
  }

  const session = sessions[sessionIndex];
  if (session.status !== 'active') {
    throw new MvpError('session_closed', 'Session is closed');
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    session.status = 'expired';
    sessions[sessionIndex] = session;
    saveSessions(sessions);
    throw new MvpError('session_expired', 'Session expired');
  }
  if (session.currentSlots >= session.targetSlots) {
    session.status = 'completed';
    sessions[sessionIndex] = session;
    saveSessions(sessions);
    throw new MvpError('session_full', 'Session is already full');
  }

  const family = findProductFamily(session.familyId);
  if (!family) {
    throw new MvpError('family_not_found', 'Family not found');
  }

  const variant = family.variants.find((item) => item.id === input.variantId);
  if (!variant) {
    throw new MvpError('variant_not_found', 'Variant not found');
  }
  if (!variant.isAllowedInGb) {
    throw new MvpError('variant_not_allowed', 'Variant is not allowed in GB');
  }
  if (session.allowedSizes.length > 0 && !session.allowedSizes.includes(variant.size)) {
    throw new MvpError('size_not_allowed', 'Size is not allowed for this session');
  }
  if (session.allowedColors.length > 0 && !session.allowedColors.includes(variant.color)) {
    throw new MvpError('color_not_allowed', 'Color is not allowed for this session');
  }
  if (variant.stock <= 0) {
    throw new MvpError('out_of_stock', 'Variant is out of stock');
  }
  const pendingOrder = loadOrders().find(
    (order) => order.userId === input.user.id && order.sessionId === session.id && order.status === 'created',
  );
  if (pendingOrder) {
    throw new MvpError('pending_payment', 'User has an unconfirmed order for this session');
  }

  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.id === input.user.id);
  const slotNumber = session.currentSlots + 1;
  const price = calculateSlotPrice(
    session.basePriceSnapshot,
    session.discountStepSnapshot,
    session.maxDiscountSnapshot,
    slotNumber,
  );
  const walletSpend = Math.max(0, Math.min(input.walletSpend || 0, price));

  const previousFloor = session.lastSettledPrice;
  const refundDelta = Math.max(0, previousFloor - price);

  const participation: Participation = {
    id: id('participation'),
    sessionId: session.id,
    userId: input.user.id,
    userName: input.user.name,
    variantId: variant.id,
    size: variant.size,
    color: variant.color,
    slotNumber,
    pricePaid: price,
    status: 'paid',
    createdAt: nowIso(),
  };

  const order: Order = {
    id: id('order'),
    userId: input.user.id,
    sessionId: session.id,
    familyId: family.id,
    sellerId: family.sellerId,
    categorySlug: family.categorySlug,
    participationId: participation.id,
    familyName: family.name,
    variantLabel: `${variant.size} / ${variant.color}`,
    totalAmount: price,
    walletDeduction: walletSpend,
    status: 'created',
    createdAt: nowIso(),
  };

  if (walletSpend > 0) {
    if (userIndex === -1) {
      throw new MvpError('user_not_found', 'User not found');
    }
    const balance = users[userIndex].walletBalance ?? 0;
    if (balance < walletSpend) {
      throw new MvpError('insufficient_wallet_balance', 'РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ СЃСЂРµРґСЃС‚РІ РІ РєРѕС€РµР»СЊРєРµ');
    }
    users[userIndex].walletBalance = balance - walletSpend;
  }

  const payment: WalletTransaction = {
    id: id('payment'),
    userId: input.user.id,
    type: 'debit',
    amount: price - walletSpend,
    source: 'payment',
    description: `Payment for slot #${slotNumber} in ${family.name}`,
    relatedSessionId: session.id,
    relatedOrderId: order.id,
    createdAt: nowIso(),
  };

  const refundTransactions: WalletTransaction[] = [];
  if (refundDelta > 0) {
    session.participants.forEach((participant) => {
      refundTransactions.push({
        id: id('refund'),
        userId: participant.userId,
        type: 'credit',
        amount: refundDelta,
        source: 'slot_refund',
        description: `Price drop refund after slot #${slotNumber} was filled`,
        relatedSessionId: session.id,
        relatedOrderId: order.id,
        createdAt: nowIso(),
      });
    });
  }

  if (refundDelta > 0) {
    session.participants.forEach((participant) => {
      const ownerIndex = users.findIndex((item) => item.id === participant.userId);
      if (ownerIndex !== -1) {
        const userWallet = users[ownerIndex].walletBalance ?? 0;
        users[ownerIndex].walletBalance = userWallet + refundDelta;
      }
    });
  }

  variant.stock -= 1;
  family.variants = family.variants.map((item) => (item.id === variant.id ? variant : item));

  session.participants.push(participation);
  session.currentSlots = slotNumber;
  session.currentFloorPrice = price;
  session.lastSettledPrice = price;
  if (session.currentSlots >= session.targetSlots) {
    session.status = 'completed';
  }

  if (userIndex !== -1) {
    users[userIndex] = {
      ...users[userIndex],
      walletBalance: users[userIndex].walletBalance ?? 0,
    };
  }

  const orders = loadOrders();
  orders.unshift(order);

  const walletTransactions = loadWalletTransactions();
  const walletSpendTransaction = walletSpend > 0 ? [{
    id: id('wallet-spend'),
    userId: input.user.id,
    type: 'debit',
    amount: walletSpend,
    source: 'wallet_spend',
    description: `РЎРїРёСЃР°РЅРѕ РёР· РєРѕС€РµР»СЊРєР° Р·Р° СЃР»РѕС‚ #${slotNumber} РІ ${family.name}`,
    relatedSessionId: session.id,
    relatedOrderId: order.id,
    createdAt: nowIso(),
  } as WalletTransaction] : [];
  walletTransactions.unshift(payment, ...walletSpendTransaction, ...refundTransactions);

  saveUsers(users);
  const currentUser = getCurrentUser();
  if (currentUser) {
    const refreshed = users.find((item) => item.id === currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  }
  saveProducts(loadProducts().map((item) => (item.id === family.id ? family : item)));
  sessions[sessionIndex] = session;
  saveSessions(sessions);
  saveOrders(orders);
  saveWalletTransactions(walletTransactions);

  return { session, participation, order, payment, refundDelta };
}

export function createWithdrawalRequest(input: {
  user: User;
  amount: number;
}) {
  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.id === input.user.id);
  if (userIndex === -1) {
    throw new MvpError('user_not_found', 'User not found');
  }
  if (input.amount <= 0) {
    throw new MvpError('invalid_amount', 'Withdrawal amount must be positive');
  }

  const availableBalance = users[userIndex].walletBalance ?? 0;
  if (availableBalance < input.amount) {
    throw new MvpError('insufficient_balance', 'РќРµРґРѕСЃС‚Р°С‚РѕС‡РЅРѕ СЃСЂРµРґСЃС‚РІ РІ РєРѕС€РµР»СЊРєРµ');
  }

  const feeAmount = Math.ceil(input.amount * DEFAULT_WITHDRAWAL_FEE_RATE);
  const netAmount = input.amount - feeAmount;
  users[userIndex].walletBalance = availableBalance - input.amount;
  const withdrawal: WithdrawalRequest = {
    id: id('withdrawal'),
    userId: input.user.id,
    amount: input.amount,
    feeAmount,
    netAmount,
    status: 'pending',
    createdAt: nowIso(),
  };

  const withdrawals = loadWithdrawals();
  withdrawals.unshift(withdrawal);
  const walletTransactions = loadWalletTransactions();
  walletTransactions.unshift({
    id: id('withdrawal-hold'),
    userId: input.user.id,
    type: 'debit',
    amount: input.amount,
    source: 'withdrawal',
    description: `Withdrawal request created: fee ${formatRuble(feeAmount)}`,
    createdAt: nowIso(),
  });
  saveUsers(users);
  const currentUser = getCurrentUser();
  if (currentUser) {
    const refreshed = users.find((item) => item.id === currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  }
  saveWithdrawals(withdrawals);
  saveWalletTransactions(walletTransactions);
  return withdrawal;
}

export function approveWithdrawalRequest(requestId: string, admin: User) {
  const withdrawals = loadWithdrawals();
  const index = withdrawals.findIndex((item) => item.id === requestId);
  if (index === -1) {
    throw new MvpError('withdrawal_not_found', 'Withdrawal request not found');
  }

  const request = withdrawals[index];
  if (request.status !== 'pending') {
    throw new MvpError('withdrawal_invalid_state', 'Withdrawal request is not pending');
  }

  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.id === request.userId);
  if (userIndex === -1) {
    throw new MvpError('user_not_found', 'User not found');
  }
  withdrawals[index] = {
    ...request,
    status: 'completed',
    decidedAt: nowIso(),
    decidedBy: admin.id,
  };

  saveUsers(users);
  const currentUser = getCurrentUser();
  if (currentUser) {
    const refreshed = users.find((item) => item.id === currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  }
  saveWithdrawals(withdrawals);

  return withdrawals[index];
}

export function rejectWithdrawalRequest(requestId: string, admin: User) {
  const withdrawals = loadWithdrawals();
  const index = withdrawals.findIndex((item) => item.id === requestId);
  if (index === -1) {
    throw new MvpError('withdrawal_not_found', 'Withdrawal request not found');
  }

  const request = withdrawals[index];
  if (request.status !== 'pending') {
    throw new MvpError('withdrawal_invalid_state', 'Withdrawal request is not pending');
  }

  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.id === request.userId);
  if (userIndex === -1) {
    throw new MvpError('user_not_found', 'User not found');
  }

  users[userIndex].walletBalance = (users[userIndex].walletBalance ?? 0) + request.amount;
  withdrawals[index] = {
    ...request,
    status: 'rejected',
    decidedAt: nowIso(),
    decidedBy: admin.id,
  };

  const walletTransactions = loadWalletTransactions();
  walletTransactions.unshift({
    id: id('withdrawal-revert'),
    userId: request.userId,
    type: 'credit',
    amount: request.amount,
    source: 'admin_adjustment',
    description: `Withdrawal request rejected and funds returned`,
    createdAt: nowIso(),
  });

  saveUsers(users);
  const currentUser = getCurrentUser();
  if (currentUser) {
    const refreshed = users.find((item) => item.id === currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  }
  saveWithdrawals(withdrawals);
  saveWalletTransactions(walletTransactions);

  return withdrawals[index];
}

export function addWalletCredit(
  userId: string,
  amount: number,
  description: string,
  source: WalletTransaction['source'] = 'admin_adjustment',
  meta?: { relatedOrderId?: string; relatedSessionId?: string },
) {
  const users = loadUsers();
  const userIndex = users.findIndex((item) => item.id === userId);
  if (userIndex === -1) {
    throw new MvpError('user_not_found', 'User not found');
  }
  users[userIndex].walletBalance = (users[userIndex].walletBalance ?? 0) + amount;
  saveUsers(users);
  const currentUser = getCurrentUser();
  if (currentUser) {
    const refreshed = users.find((item) => item.id === currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
  }

  const walletTransactions = loadWalletTransactions();
  walletTransactions.unshift({
    id: id('wallet-credit'),
    userId,
    type: 'credit',
    amount,
    source,
    description,
    relatedOrderId: meta?.relatedOrderId,
    relatedSessionId: meta?.relatedSessionId,
    createdAt: nowIso(),
  });
  saveWalletTransactions(walletTransactions);
}

function applyReferralRewardForOrder(orderId: string) {
  const orders = loadOrders();
  const order = orders.find((item) => item.id === orderId);
  if (!order || (order.status !== 'confirmed' && order.status !== 'fulfilled')) {
    return null;
  }

  const users = loadUsers();
  const buyer = users.find((item) => item.id === order.userId);
  if (!buyer?.referredBy) {
    return null;
  }

  const referrer = users.find((item) => item.referralCode === buyer.referredBy?.trim());
  if (!referrer || referrer.id === buyer.id) {
    return null;
  }

  const rewardAmount = getReferralRewardAmount(order.totalAmount);
  if (rewardAmount <= 0) {
    return null;
  }

  const walletTransactions = loadWalletTransactions();
  const existingReward = walletTransactions.find(
    (tx) => tx.source === 'referral_reward' && tx.relatedOrderId === order.id,
  );
  if (existingReward) {
    return {
      rewardAmount,
      referrerId: referrer.id,
      alreadyPaid: true,
    };
  }

  addWalletCredit(
    referrer.id,
    rewardAmount,
    `Referral reward for order #${order.id} (${buyer.name})`,
    'referral_reward',
    {
      relatedOrderId: order.id,
      relatedSessionId: order.sessionId,
    },
  );

  return {
    rewardAmount,
    referrerId: referrer.id,
    alreadyPaid: false,
  };
}

export function confirmOrder(orderId: string, shippingAddress: ShippingAddress) {
  const orders = loadOrders();
  const index = orders.findIndex((item) => item.id === orderId);
  if (index === -1) {
    throw new MvpError('order_not_found', 'Order not found');
  }

  orders[index] = {
    ...orders[index],
    shippingAddress,
    status: 'confirmed',
  };
  saveOrders(orders);
  applyReferralRewardForOrder(orderId);
  return orders[index];
}

export function getUserOrders(userId: string) {
  return loadOrders().filter((order) => order.userId === userId);
}

export function getUserWalletTransactions(userId: string) {
  return loadWalletTransactions().filter((tx) => tx.userId === userId);
}

export function getUserWithdrawals(userId: string) {
  return loadWithdrawals().filter((request) => request.userId === userId);
}

export function updateSessionDeadline(sessionId: string, expiresAt: string) {
  const sessions = loadSessions();
  const index = sessions.findIndex((item) => item.id === sessionId);
  if (index === -1) {
    throw new MvpError('session_not_found', 'Session not found');
  }
  sessions[index] = { ...sessions[index], expiresAt };
  saveSessions(sessions);
  return sessions[index];
}

export function updateOrderStatus(orderId: string, status: Order['status']) {
  const orders = loadOrders();
  const index = orders.findIndex((item) => item.id === orderId);
  if (index === -1) {
    throw new MvpError('order_not_found', 'Order not found');
  }
  orders[index] = { ...orders[index], status };
  saveOrders(orders);
  if (status === 'confirmed') {
    applyReferralRewardForOrder(orderId);
  }
  return orders[index];
}


