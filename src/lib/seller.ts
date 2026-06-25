import { buildCatalogProductSlug, catalogCategories, getCatalogCategorySearchText, getCatalogGroup, slugifyCatalogSegment } from '@/lib/catalog';
import { DEFAULT_PRODUCT_IMAGE, getFamilyActiveSessions, getProductCoverImage, getProductImages, getSessionFillPercent, loadOrders, loadProducts, loadSessions, loadWalletTransactions, saveProducts } from '@/lib/mvp';
import { getProductImageOptions, isLocalAssetPath } from '@/lib/image-manifest';
import {
  getLegacyShoeSizesFromIds,
  getShoeSizeIdsFromLegacySizes,
  getShoeSizeOptionsByIds,
} from '@/lib/shoe-sizes';
import type { GroupBuyingSession, Order, Product, ProductVariant, User, WalletTransaction } from '@/types';

export interface SellerVariantDraft {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  image: string;
  isAllowedInGb: boolean;
}

export interface SellerProductDraft {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: Product['category'];
  catalogSectionSlug: string;
  catalogItemSlug: string;
  image: string;
  images: string[];
  basePrice: number;
  originalPrice: number;
  discountStep: number;
  maxDiscount: number;
  landedCost: number;
  packagingCost: number;
  fulfillmentCost: number;
  platformFeePercent: number;
  paymentFeePercent: number;
  taxReservePercent: number;
  marginTargetPercent: number;
  currency: 'RUB' | 'AED' | 'USD';
  active: boolean;
  inStock: boolean;
  supportsGB2: boolean;
  allowedSizes: string[];
  shoeSizeIds: string[];
  allowedColors: string[];
  tags: string[];
  variantStrategy: 'size' | 'color' | 'size-color';
  variants: SellerVariantDraft[];
}

export interface SellerDraftValidationResult {
  errors: string[];
}

export interface SellerCostProfile {
  landedCost: number;
  packagingCost: number;
  fulfillmentCost: number;
  platformFeePercent: number;
  paymentFeePercent: number;
  taxReservePercent: number;
  marginTargetPercent: number;
  totalFixedCost: number;
  variableFeePercent: number;
  breakEvenPrice: number;
}

export interface SellerRevenuePoint {
  label: string;
  grossRevenue: number;
  orderCount: number;
}

export interface SellerGeoStat {
  city: string;
  region: string;
  country: string;
  orders: number;
  revenue: number;
}

export interface SellerProductPerformance {
  product: Product;
  orders: number;
  revenue: number;
  activeSessions: number;
  fillRate: number;
  breakEvenPrice: number;
  estimatedCost: number;
  estimatedFeeCost: number;
  grossMargin: number;
  contributionMarginPerOrder: number;
  lowStock: boolean;
}

export interface SellerDashboardSummary {
  grossRevenue: number;
  netRevenue: number;
  orderCount: number;
  buyoutCount: number;
  conversionRate: number;
  averageOrderValue: number;
  activeProducts: number;
  activeSessions: number;
  payoutReady: number;
  walletBalance: number;
  refundAmount: number;
}

export interface SellerDashboardSnapshot {
  summary: SellerDashboardSummary;
  products: Product[];
  sessions: GroupBuyingSession[];
  orders: Order[];
  walletTransactions: WalletTransaction[];
  revenueSeries: SellerRevenuePoint[];
  geoStats: SellerGeoStat[];
  productPerformance: SellerProductPerformance[];
  topMarginProducts: SellerProductPerformance[];
  lowStockProducts: Product[];
  categoryBreakdown: Array<{ label: string; count: number; revenue: number }>;
}

function isAdmin(user: User) {
  return user.role === 'admin';
}

function normalizeSlug(value: string, fallback: string) {
  return slugifyCatalogSegment(value) || fallback;
}

function uniqueProductSlug(products: Product[], candidate: string, ignoreProductId?: string) {
  const base = normalizeSlug(candidate, `product-${Date.now()}`);
  let next = base;
  let index = 2;

  while (products.some((product) => product.slug === next && product.id !== ignoreProductId)) {
    next = `${base}-${index}`;
    index += 1;
  }

  return next;
}

function buildProductCategorySlug(category: Product['category'], sectionSlug: string, itemSlug: string) {
  if (category !== 'electronics') {
    return category;
  }

  if (!sectionSlug) {
    return category;
  }

  return buildCatalogProductSlug(category, sectionSlug, itemSlug || undefined);
}

function getSelectedCatalogSection(category: Product['category'], sectionSlug: string) {
  if (category !== 'electronics') return null;
  return getCatalogGroup('electronics', sectionSlug);
}

export function createEmptySellerProductDraft(): SellerProductDraft {
  const defaultCategory = catalogCategories.find((item) => item.id !== 'all')?.id || 'electronics';
  const defaultSection = getSelectedCatalogSection('electronics', catalogCategories.find((item) => item.id === 'electronics')?.groups[0]?.slug || '')?.slug || '';
  return {
    name: '',
    slug: '',
    description: '',
    category: defaultCategory as Product['category'],
    catalogSectionSlug: defaultCategory === 'electronics' ? defaultSection : '',
    catalogItemSlug: '',
    image: '',
    images: [],
    basePrice: 0,
    originalPrice: 0,
    discountStep: 0,
    maxDiscount: 0,
    landedCost: 0,
    packagingCost: 0,
    fulfillmentCost: 0,
    platformFeePercent: 5,
    paymentFeePercent: 2,
    taxReservePercent: 3,
    marginTargetPercent: 20,
    currency: 'RUB',
    active: true,
    inStock: true,
    supportsGB2: true,
    allowedSizes: [],
    shoeSizeIds: [],
    allowedColors: [],
    tags: [],
    variantStrategy: 'size-color',
    variants: [
      {
        size: 'One size',
        color: 'Default',
        sku: '',
        stock: 0,
        image: '',
        isAllowedInGb: true,
      },
    ],
  };
}

export function draftFromProduct(product: Product): SellerProductDraft {
  const categorySlugParts = product.categorySlug?.split('/') ?? [];
  const category = product.category;
  const catalogSectionSlug = category === 'electronics' ? categorySlugParts[1] || '' : '';
  const catalogItemSlug = category === 'electronics' ? categorySlugParts[2] || '' : '';

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    category,
    catalogSectionSlug,
    catalogItemSlug,
    image: getProductCoverImage(product),
    images: getProductImages(product),
    basePrice: product.basePrice,
    originalPrice: product.originalPrice ?? Math.max(product.basePrice, Math.round(product.basePrice * 1.15)),
    discountStep: product.discountStep,
    maxDiscount: product.maxDiscount,
    landedCost: product.landedCost ?? Math.round(product.basePrice * 0.55),
    packagingCost: product.packagingCost ?? Math.round(product.basePrice * 0.03),
    fulfillmentCost: product.fulfillmentCost ?? Math.round(product.basePrice * 0.05),
    platformFeePercent: product.platformFeePercent ?? 5,
    paymentFeePercent: product.paymentFeePercent ?? 2,
    taxReservePercent: product.taxReservePercent ?? 3,
    marginTargetPercent: product.marginTargetPercent ?? 20,
    currency: product.currency ?? 'RUB',
    active: product.active,
    inStock: product.inStock ?? true,
    supportsGB2: product.supportsGB2 ?? true,
    allowedSizes: product.allowedSizes.length > 0 ? product.allowedSizes : ['One size'],
    shoeSizeIds: product.shoeSizeIds?.length ? product.shoeSizeIds : getShoeSizeIdsFromLegacySizes(product.allowedSizes),
    allowedColors: product.allowedColors.length > 0 ? product.allowedColors : ['Default'],
    tags: product.tags ?? [],
    variantStrategy: product.variantStrategy ?? 'size-color',
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku || '',
      stock: variant.stock,
      image: variant.image || getProductCoverImage(product),
      isAllowedInGb: variant.isAllowedInGb ?? true,
    })),
  };
}

export function parseCommaList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateSellerProductDraft(draft: SellerProductDraft): SellerDraftValidationResult {
  const errors: string[] = [];
  const normalizedName = draft.name.trim();
  const hasVariants = draft.variants.length > 0;

  if (!normalizedName) {
    errors.push('Укажите название товара');
  }

  if (!draft.category) {
    errors.push('Выберите категорию');
  }

  if (draft.basePrice <= 0) {
    errors.push('Укажите цену больше нуля');
  }

  if (!hasVariants) {
    errors.push('Добавьте хотя бы один вариант товара');
  }

  if (draft.category === 'footwear' && draft.shoeSizeIds.length === 0) {
    errors.push('Для обуви выберите хотя бы один размер из таблицы');
  }

  if (draft.category === 'electronics' && !draft.catalogSectionSlug) {
    errors.push('Для электроники выберите раздел каталога');
  }

  if (draft.originalPrice > 0 && draft.originalPrice < draft.basePrice) {
    errors.push('Старая цена должна быть не ниже текущей цены');
  }

  if (draft.variants.some((variant) => !variant.size.trim() || !variant.color.trim())) {
    errors.push('У каждого варианта должны быть заполнены размер и цвет');
  }

  return { errors };
}

function buildProductVariants(productId: string, variants: SellerVariantDraft[]): ProductVariant[] {
  return variants.map((variant, index) => ({
    id: variant.id?.trim() || `${productId}-variant-${index + 1}`,
    familyId: productId,
    size: variant.size.trim() || 'One size',
    color: variant.color.trim() || 'Default',
    sku: variant.sku.trim() || undefined,
    stock: Math.max(0, Math.round(variant.stock || 0)),
    image: isLocalAssetPath(variant.image) ? variant.image.trim() : undefined,
    isAllowedInGb: variant.isAllowedInGb,
  }));
}

export function getProductCostProfile(product: Product): SellerCostProfile {
  const landedCost = product.landedCost ?? Math.round(product.basePrice * 0.55);
  const packagingCost = product.packagingCost ?? Math.round(product.basePrice * 0.03);
  const fulfillmentCost = product.fulfillmentCost ?? Math.round(product.basePrice * 0.05);
  const platformFeePercent = product.platformFeePercent ?? 5;
  const paymentFeePercent = product.paymentFeePercent ?? 2;
  const taxReservePercent = product.taxReservePercent ?? 3;
  const marginTargetPercent = product.marginTargetPercent ?? 20;
  const totalFixedCost = landedCost + packagingCost + fulfillmentCost;
  const variableFeePercent = platformFeePercent + paymentFeePercent + taxReservePercent;
  const breakEvenPrice = Math.ceil(totalFixedCost / Math.max(0.01, 1 - variableFeePercent / 100));

  return {
    landedCost,
    packagingCost,
    fulfillmentCost,
    platformFeePercent,
    paymentFeePercent,
    taxReservePercent,
    marginTargetPercent,
    totalFixedCost,
    variableFeePercent,
    breakEvenPrice,
  };
}

export function getProductContributionMargin(product: Product, salePrice = product.basePrice) {
  const cost = getProductCostProfile(product);
  const feeAmount = Math.ceil((salePrice * cost.variableFeePercent) / 100);
  return salePrice - cost.totalFixedCost - feeAmount;
}

export function getSellerProducts(user: User, includeAll = false) {
  const products = loadProducts();
  return products.filter((product) => includeAll || product.sellerId === user.id);
}

export function getSellerSessions(user: User, includeAll = false) {
  const productIds = new Set(getSellerProducts(user, includeAll).map((product) => product.id));
  return loadSessions()
    .filter((session) => includeAll || productIds.has(session.familyId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerOrders(user: User, includeAll = false) {
  const products = getSellerProducts(user, includeAll);
  const sessions = getSellerSessions(user, includeAll);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const productById = new Map(products.map((product) => [product.id, product]));

  return loadOrders()
    .filter((order) => {
      if (includeAll) return order.status !== 'cancelled';
      if (order.sellerId === user.id) return true;
      if (order.familyId && productById.has(order.familyId)) return true;
      if (order.sessionId && sessionById.has(order.sessionId)) return true;
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSellerWalletTransactions(user: User, includeAll = false) {
  if (includeAll) {
    return loadWalletTransactions().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return loadWalletTransactions()
    .filter((tx) => tx.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function resolveOrderProduct(order: Order, products: Product[], sessions: GroupBuyingSession[]) {
  if (order.familyId) {
    const product = products.find((item) => item.id === order.familyId);
    if (product) return product;
  }

  if (order.sessionId) {
    const session = sessions.find((item) => item.id === order.sessionId);
    if (session) {
      const product = products.find((item) => item.id === session.familyId);
      if (product) return product;
    }
  }

  if (order.familyName) {
    const byName = products.find((product) => product.name.toLowerCase() === order.familyName.toLowerCase());
    if (byName) return byName;
  }

  if (order.sellerId) {
    const bySeller = products.find((product) => product.sellerId === order.sellerId);
    if (bySeller) return bySeller;
  }

  return null;
}

export function getSellerProductPerformance(user: User, includeAll = false): SellerProductPerformance[] {
  const products = getSellerProducts(user, includeAll);
  const sessions = getSellerSessions(user, includeAll);
  const orders = getSellerOrders(user, includeAll).filter((order) => order.status !== 'created' && order.status !== 'cancelled');

  return products.map((product) => {
    const relevantSessions = sessions.filter((session) => session.familyId === product.id);
    const fallbackCartProductId = products.find((item) => item.sellerId === product.sellerId)?.id || products[0]?.id;
    const relevantOrders = orders.filter((order) => {
      if (order.familyId === product.id) return true;
      if (order.sessionId) {
        const session = sessions.find((item) => item.id === order.sessionId);
        return session?.familyId === product.id;
      }
      if (order.familyName.toLowerCase() === product.name.toLowerCase()) return true;
      if (order.familyName === 'Корзина SIDRAT' && order.sellerId && fallbackCartProductId) {
        return product.id === fallbackCartProductId;
      }
      return false;
    });
    const grossRevenue = relevantOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const fillRate = relevantSessions.length
      ? relevantSessions.reduce((sum, session) => sum + getSessionFillPercent(session), 0) / relevantSessions.length
      : 0;
    const cost = getProductCostProfile(product);
    const estimatedCost = relevantOrders.length * cost.totalFixedCost;
    const estimatedFeeCost = relevantOrders.reduce((sum, order) => sum + Math.ceil((order.totalAmount * cost.variableFeePercent) / 100), 0);
    const grossMargin = grossRevenue - estimatedCost - estimatedFeeCost;
    const contributionMarginPerOrder = relevantOrders.length > 0 ? grossMargin / relevantOrders.length : getProductContributionMargin(product);

    return {
      product,
      orders: relevantOrders.length,
      revenue: grossRevenue,
      activeSessions: relevantSessions.filter((session) => session.status === 'active').length,
      fillRate,
      breakEvenPrice: cost.breakEvenPrice,
      estimatedCost,
      estimatedFeeCost,
      grossMargin,
      contributionMarginPerOrder,
      lowStock: (product.variants.reduce((sum, variant) => sum + variant.stock, 0) || 0) < 5,
    };
  });
}

export function getSellerGeoStats(user: User, includeAll = false): SellerGeoStat[] {
  const products = getSellerProducts(user, includeAll);
  const sessions = getSellerSessions(user, includeAll);
  const orders = getSellerOrders(user, includeAll).filter((order) => order.status !== 'created' && order.status !== 'cancelled');

  const stats = new Map<string, SellerGeoStat>();

  orders.forEach((order) => {
    const product = resolveOrderProduct(order, products, sessions);
    if (!product) return;

    const city = order.shippingAddress?.city?.trim() || 'Unknown';
    const region = order.shippingAddress?.region?.trim() || 'Unknown';
    const country = order.shippingAddress?.country?.trim() || 'Unknown';
    const key = `${city}|${region}|${country}`;
    const current = stats.get(key) || { city, region, country, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += order.totalAmount;
    stats.set(key, current);
  });

  return Array.from(stats.values()).sort((a, b) => b.revenue - a.revenue);
}

export function getSellerRevenueSeries(user: User, includeAll = false, days = 14): SellerRevenuePoint[] {
  const orders = getSellerOrders(user, includeAll).filter((order) => order.status !== 'created' && order.status !== 'cancelled');
  const points = new Map<string, SellerRevenuePoint>();
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    points.set(key, {
      label: `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`,
      grossRevenue: 0,
      orderCount: 0,
    });
  }

  orders.forEach((order) => {
    const key = order.createdAt.slice(0, 10);
    const point = points.get(key);
    if (point) {
      point.grossRevenue += order.totalAmount;
      point.orderCount += 1;
    }
  });

  return Array.from(points.values());
}

export function buildSellerDashboardSnapshot(user: User): SellerDashboardSnapshot {
  const includeAll = isAdmin(user);
  const products = getSellerProducts(user, includeAll);
  const sessions = getSellerSessions(user, includeAll);
  const orders = getSellerOrders(user, includeAll);
  const walletTransactions = getSellerWalletTransactions(user, includeAll);
  const productPerformance = getSellerProductPerformance(user, includeAll);
  const geoStats = getSellerGeoStats(user, includeAll);
  const revenueSeries = getSellerRevenueSeries(user, includeAll);

  const recognizedOrders = orders.filter((order) => order.status !== 'created' && order.status !== 'cancelled');
  const buyoutCount = orders.filter((order) => order.status === 'confirmed' || order.status === 'fulfilled').length;
  const grossRevenue = recognizedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const refundAmount = orders
    .filter((order) => order.status === 'cancelled')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const totalTargetSlots = sessions.reduce((sum, session) => sum + session.targetSlots, 0);
  const totalFilledSlots = sessions.reduce((sum, session) => sum + session.currentSlots, 0);
  const conversionRate = totalTargetSlots > 0 ? totalFilledSlots / totalTargetSlots : 0;
  const averageOrderValue = recognizedOrders.length > 0 ? grossRevenue / recognizedOrders.length : 0;
  const estimatedCosts = productPerformance.reduce((sum, item) => sum + item.estimatedCost + item.estimatedFeeCost, 0);
  const netRevenue = grossRevenue - estimatedCosts - refundAmount;
  const payoutReady = Math.max(0, netRevenue - walletTransactions.filter((tx) => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0));

  return {
    summary: {
      grossRevenue,
      netRevenue,
      orderCount: recognizedOrders.length,
      buyoutCount,
      conversionRate,
      averageOrderValue,
      activeProducts: products.filter((product) => product.active).length,
      activeSessions: sessions.filter((session) => session.status === 'active').length,
      payoutReady,
      walletBalance: user.walletBalance || 0,
      refundAmount,
    },
    products,
    sessions,
    orders,
    walletTransactions,
    revenueSeries,
    geoStats,
    productPerformance,
    topMarginProducts: [...productPerformance].sort((a, b) => b.contributionMarginPerOrder - a.contributionMarginPerOrder),
    lowStockProducts: products.filter((product) => (product.variants.reduce((sum, variant) => sum + variant.stock, 0) || 0) < 5),
    categoryBreakdown: catalogCategories
      .filter((category) => category.id !== 'all')
      .map((category) => {
        const categoryProducts = products.filter((product) => category.matchCategories.includes(product.category));
        return {
          label: category.label,
          count: categoryProducts.length,
          revenue: categoryProducts.reduce(
            (sum, product) => sum + productPerformance.filter((item) => item.product.id === product.id).reduce((inner, item) => inner + item.revenue, 0),
            0,
          ),
        };
      }),
  };
}

export function getSellerCategorySearchText(value: string | null | undefined) {
  return getCatalogCategorySearchText(value);
}

export function createSellerProduct(user: User, draft: SellerProductDraft, existingProductId?: string) {
  const products = loadProducts();
  const validation = validateSellerProductDraft(draft);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join(' · '));
  }

  const normalizedName = draft.name.trim();

  const existingProduct = existingProductId ? products.find((product) => product.id === existingProductId) || null : null;
  const productId = existingProduct?.id || draft.id || `seller-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = uniqueProductSlug(products, draft.slug || normalizedName, existingProduct?.id);
  const categorySlug = buildProductCategorySlug(draft.category, draft.catalogSectionSlug, draft.catalogItemSlug);
  const images = draft.images.map((item) => item.trim()).filter((item) => isLocalAssetPath(item));
  const normalizedVariants = buildProductVariants(productId, draft.variants);
  const normalizedShoeSizeIds = Array.from(new Set(draft.shoeSizeIds.map((item) => item.trim()).filter(Boolean)));
  const footwearSizes = normalizedShoeSizeIds.length > 0 ? getShoeSizeOptionsByIds(normalizedShoeSizeIds) : [];
  const legacyAllowedSizes = draft.category === 'footwear'
    ? (footwearSizes.length > 0 ? getLegacyShoeSizesFromIds(normalizedShoeSizeIds) : draft.allowedSizes.map((item) => item.trim()).filter(Boolean))
    : draft.allowedSizes.map((item) => item.trim()).filter(Boolean);

  const nextProduct: Product = {
    ...(existingProduct || {}),
    id: productId,
    slug,
    name: normalizedName,
    description: draft.description.trim(),
    category: draft.category,
    categorySlug,
    image: isLocalAssetPath(draft.image)
      ? draft.image.trim()
      : images[0] || (existingProduct?.image && isLocalAssetPath(existingProduct.image) ? existingProduct.image : DEFAULT_PRODUCT_IMAGE),
    images: images.length > 0 ? images : isLocalAssetPath(draft.image) ? [draft.image.trim()] : existingProduct?.images?.length ? existingProduct.images.filter((item) => isLocalAssetPath(item)) : [DEFAULT_PRODUCT_IMAGE],
    basePrice: Math.max(0, Math.round(draft.basePrice)),
    originalPrice: Math.max(0, Math.round(draft.originalPrice || draft.basePrice)),
    discountStep: Math.max(0, Math.round(draft.discountStep)),
    maxDiscount: Math.max(0, Math.round(draft.maxDiscount)),
    sellerId: existingProduct?.sellerId ?? user.id,
    active: draft.active,
    allowedSizes: legacyAllowedSizes,
    shoeSizeIds: draft.category === 'footwear' ? normalizedShoeSizeIds : undefined,
    allowedColors: draft.allowedColors.map((item) => item.trim()).filter(Boolean),
    variants: normalizedVariants,
    tags: draft.tags.map((item) => item.trim()).filter(Boolean),
    landedCost: Math.max(0, Math.round(draft.landedCost)),
    packagingCost: Math.max(0, Math.round(draft.packagingCost)),
    fulfillmentCost: Math.max(0, Math.round(draft.fulfillmentCost)),
    platformFeePercent: Math.max(0, draft.platformFeePercent),
    paymentFeePercent: Math.max(0, draft.paymentFeePercent),
    taxReservePercent: Math.max(0, draft.taxReservePercent),
    marginTargetPercent: Math.max(0, draft.marginTargetPercent),
    currency: draft.currency,
    inStock: draft.inStock,
    supportsGB2: draft.supportsGB2,
    variantStrategy: draft.variantStrategy,
    updatedAt: new Date().toISOString(),
    createdAt: existingProduct?.createdAt || new Date().toISOString(),
    archivedAt: draft.active ? undefined : existingProduct?.archivedAt || new Date().toISOString(),
  };

  const nextProducts = existingProduct
    ? products.map((product) => (product.id === existingProduct.id ? nextProduct : product))
    : [nextProduct, ...products];

  saveProducts(nextProducts);
  return nextProduct;
}

export function archiveSellerProduct(productId: string) {
  const products = loadProducts();
  const index = products.findIndex((product) => product.id === productId);
  if (index === -1) {
    throw new Error('Product not found');
  }
  const nextProduct = {
    ...products[index],
    active: false,
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products[index] = nextProduct;
  saveProducts(products);
  return nextProduct;
}

export function getSellerProductSearchText(product: Product) {
  return [
    product.name,
    product.slug,
    product.description,
    product.category,
    product.categorySlug ?? '',
    product.tags?.join(' ') ?? '',
    getCatalogCategorySearchText(product.category),
  ]
    .join(' ')
    .toLowerCase();
}

