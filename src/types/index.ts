export type Role = 'buyer' | 'seller' | 'admin';

export interface TierConfig {
  name: string;
  minUnits: number;
  maxUnits: number;
  discountPercent: number;
  label: string;
  color?: string;
  icon?: string;
}

export interface ProductVariant {
  id: string;
  familyId: string;
  size: string;
  color: string;
  colorHex?: string;
  sku?: string;
  stock: number;
  image?: string;
  images?: string[];
  price?: number;
  isAllowedInGb?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  image: string;
  images: string[];
  basePrice: number;
  discountStep: number;
  maxDiscount: number;
  sellerId: string;
  active: boolean;
  allowedSizes: string[];
  shoeSizeIds?: string[];
  allowedColors: string[];
  variants: ProductVariant[];
  specs?: Record<string, string>;
  tags?: string[];
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  supportsGB2?: boolean;
  originalPrice?: number;
  price?: number;
  categorySlug?: string;
  landedCost?: number;
  packagingCost?: number;
  fulfillmentCost?: number;
  platformFeePercent?: number;
  paymentFeePercent?: number;
  taxReservePercent?: number;
  marginTargetPercent?: number;
  currency?: 'RUB' | 'AED' | 'USD';
  archivedAt?: string;
  tiers?: TierConfig[];
  variantStrategy?: 'size' | 'color' | 'size-color';
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerifiedAt?: string | null;
  isActive?: boolean;
  walletBalance: number;
  referralCode: string;
  avatar?: string;
  phone?: string;
  referredBy?: string;
  createdAt: string;
  updatedAt?: string;
  bonusBalance?: number;
  fullName?: string;
}

export interface Participation {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  variantId: string;
  size: string;
  color: string;
  slotNumber: number;
  pricePaid: number;
  status: 'paid' | 'joined' | 'cancelled' | 'refunded';
  createdAt: string;
}

export interface GroupBuyingSession {
  id: string;
  familyId: string;
  familySlug: string;
  title: string;
  description?: string;
  createdBy: string;
  createdByRole: Role;
  accessType: 'public' | 'invite-link';
  status: 'draft' | 'active' | 'expired' | 'completed' | 'cancelled';
  targetSlots: number;
  currentSlots: number;
  createdAt: string;
  expiresAt: string;
  allowedSizes: string[];
  allowedColors: string[];
  basePriceSnapshot: number;
  discountStepSnapshot: number;
  maxDiscountSnapshot: number;
  currentFloorPrice: number;
  lastSettledPrice: number;
  inviteCode: string;
  participants: Participation[];
  publicNote?: string;
}

export interface Order {
  id: string;
  userId: string;
  sessionId?: string;
  familyId?: string;
  sellerId?: string;
  categorySlug?: string;
  participationId?: string;
  familyName: string;
  variantLabel: string;
  totalAmount: number;
  walletDeduction: number;
  status: 'created' | 'confirmed' | 'processing' | 'fulfilled' | 'cancelled';
  createdAt: string;
  fulfilledAt?: string;
  shippingAddress?: ShippingAddress;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  region?: string;
  postalCode: string;
  country: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit';
  amount: number;
  source: 'slot_refund' | 'withdrawal' | 'wallet_spend' | 'payment' | 'admin_adjustment' | 'referral_reward';
  description: string;
  relatedSessionId?: string;
  relatedOrderId?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  orderId: string;
  participationId: string;
  amount: number;
  status: 'paid' | 'refunded';
  provider: 'mock' | 'yookassa';
  createdAt: string;
}

// Backward-compatible aliases
export type Session = GroupBuyingSession;
export type BonusTransaction = WalletTransaction;
export interface CartItem {
  id?: string;
  productId: string;
  variantId?: string;
  productName?: string;
  variantName?: string;
  quantity: number;
  unitPrice?: number;
  originalPrice?: number;
  discountedPrice?: number;
  image?: string;
  size?: string;
  color?: string;
  addedAt?: string;
  product?: Product;
}

export interface Cart {
  id: string;
  sessionId?: string;
  items: CartItem[];
  totalUnits: number;
  totalOriginal: number;
  totalDiscounted: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CmsMediaAsset {
  id: string;
  key: string;
  label: string;
  altText?: string | null;
  kind: string;
  sourceUrl: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  usage?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsHeroSlide {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  mediaAssetId?: string | null;
  image?: string | null;
  position: number;
  visible: boolean;
  status: string;
  props?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsBlock {
  id: string;
  pageId: string;
  blockType: string;
  position: number;
  visible: boolean;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  mediaAssetId?: string | null;
  props?: Record<string, unknown> | null;
  templateKey?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  templateKey: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  status: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
  settings?: Record<string, unknown> | null;
  blocks: CmsBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDisplayConfig {
  id: string;
  productId: string;
  templateKey: string;
  headline?: string | null;
  subtitle?: string | null;
  badgeText?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  heroMediaAssetId?: string | null;
  heroImageUrl?: string | null;
  galleryMediaAssetIds?: string[] | null;
  galleryUrls?: string[] | null;
  specs?: Record<string, unknown> | null;
  sections?: Array<Record<string, unknown>> | null;
  status: string;
  props?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}