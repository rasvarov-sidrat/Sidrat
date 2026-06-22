// ============================================================================
// DISCOUNT TIERS (GB 2.0 CORE)
// ============================================================================

export interface DiscountTier {
  minUnits: number;
  maxUnits: number;
  discountPercent: number;
  label: string;
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { minUnits: 1, maxUnits: 9, discountPercent: 0, label: 'Розница' },
  { minUnits: 10, maxUnits: 49, discountPercent: 10, label: 'Мелкий опт' },
  { minUnits: 50, maxUnits: 99, discountPercent: 15, label: 'Средний опт' },
  { minUnits: 100, maxUnits: 499, discountPercent: 20, label: 'Крупный опт' },
  { minUnits: 500, maxUnits: Infinity, discountPercent: 25, label: 'Максимальный опт' },
];

// ============================================================================
// PRODUCT & VARIANTS
// ============================================================================

export interface ProductVariant {
  id: string;
  sku?: string;
  size: string;
  color: string;
  colorHex?: string;
  price: number;
  stock: number;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  variants: ProductVariant[];
  category?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// CART
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountedPrice: number;
  image: string;
  size: string;
  color: string;
  addedAt?: Date;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  totalUnits: number;
  totalOriginal: number;
  totalDiscounted: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// SESSION (GB 2.0)
// ============================================================================

export interface SessionParticipant {
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  joinedAt: string;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  participants: SessionParticipant[];
  products: Product[];
  createdAt: Date;
  expiresAt?: Date;
  createdBy: string;
  settings?: {
    minOrderAmount?: number;
    maxDiscountTier?: number;
    allowPartialOrders?: boolean;
  };
}

// ============================================================================
// USER
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  bonusBalance: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// ============================================================================
// ORDER
// ============================================================================

export interface Order {
  id: string;
  userId: string;
  sessionId?: string;
  items: CartItem[];
  totalAmount: number;
  discountAmount: number;
  bonusUsed: number;
  finalAmount: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  createdAt: Date;
  referralBonusAwarded?: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

// ============================================================================
// BONUS & REFERRAL
// ============================================================================

export interface BonusTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  relatedUserId?: string;
  relatedOrderId?: string;
  createdAt: Date;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}