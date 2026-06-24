import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ========== Основные типы ==========

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  price?: number;
  originalPrice?: number;
  discountPrice: number | null;
  images: string[];
  category: string;
  categorySlug: string;
  landedCost?: number;
  packagingCost?: number;
  fulfillmentCost?: number;
  platformFeePercent?: number;
  paymentFeePercent?: number;
  taxReservePercent?: number;
  marginTargetPercent?: number;
  currency?: 'RUB' | 'AED' | 'USD';
  archivedAt?: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  quantity: number;
  specifications: Record<string, string>;
  sellerId: string;
  discountPerStep: number;
  maxDiscountPercent: number;
  sessionDuration: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSizeId?: string;
  selectedSizeLabel?: string;
}

export interface Session {
  id: string;
  productId: string;
  product: Product;
  currentParticipants: number;
  currentDiscount: number;
  maxDiscount: number;
  expiresAt: Date;
  status: 'active' | 'completed' | 'expired';
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'seller' | 'admin';
  avatar?: string;
  bonusBalance: number;
  referralCode: string;
}

export interface Order {
  id: string;
  userId: string;
  items: { product: Product; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  deliveryAddress: string;
}

// ========== GB 2.0 Модели ==========

export interface DiscountTier {
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  minParticipants: number;
  discountPercent: number;
  icon: string;
  color: string;
}

export interface Participant {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
}

export interface GB2Session {
  id: string;
  productId: string;
  product: Product;
  creatorId: string;
  creatorName: string;
  participants: Participant[];
  currentTier: DiscountTier | null;
  participantsToNextTier: number;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export const DISCOUNT_TIERS: DiscountTier[] = [
  { name: 'Bronze', minParticipants: 2, discountPercent: 5, icon: '🥉', color: 'text-amber-600' },
  { name: 'Silver', minParticipants: 5, discountPercent: 10, icon: '🥈', color: 'text-gray-400' },
  { name: 'Gold', minParticipants: 10, discountPercent: 15, icon: '🥇', color: 'text-yellow-500' },
  { name: 'Platinum', minParticipants: 20, discountPercent: 25, icon: '💎', color: 'text-cyan-400' },
  { name: 'Diamond', minParticipants: 50, discountPercent: 40, icon: '👑', color: 'text-purple-500' },
];

// ========== Store State ==========

const currencyRates: Record<string, { rate: number; symbol: string }> = {
  RUB: { rate: 1, symbol: '₽' },
  AED: { rate: 0.037, symbol: 'AED' },
  USD: { rate: 0.011, symbol: '$' },
};

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, options?: { selectedSizeId?: string; selectedSizeLabel?: string }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  language: 'ru' | 'en' | 'ar';
  currency: 'RUB' | 'AED' | 'USD';
  setLanguage: (lang: 'ru' | 'en' | 'ar') => void;
  setCurrency: (currency: 'RUB' | 'AED' | 'USD') => void;
  formatPrice: (price: number) => string;
  isMenuOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSessions: Session[];
  setActiveSessions: (sessions: Session[]) => void;
  joinSession: (sessionId: string) => void;
  // GB 2.0
  gb2Sessions: GB2Session[];
  addGB2Session: (session: GB2Session) => void;
  getGB2SessionsByProduct: (productId: string) => GB2Session[];
  joinGB2Session: (sessionId: string, participant: Participant) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      cart: [],
      addToCart: (product, quantity = 1, options) => {
        const { cart } = get();
        const selectedSizeId = options?.selectedSizeId?.trim();
        const selectedSizeLabel = options?.selectedSizeLabel?.trim();
        const cartItemId = `${product.id}__${selectedSizeId || 'default'}`;
        const resolveCartItemId = (item: CartItem) => item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`;
        const existingItem = cart.find((item) => resolveCartItemId(item) === cartItemId);
        if (existingItem) {
          set({
            cart: cart.map((item) =>
              resolveCartItemId(item) === cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            cart: [
              ...cart,
              {
                id: cartItemId,
                product,
                quantity,
                selectedSizeId,
                selectedSizeLabel,
              },
            ],
          });
        }
      },
      removeFromCart: (cartItemId) => {
        set({
          cart: get().cart.filter(
            (item) => (item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`) !== cartItemId,
          ),
        });
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            (item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`) === cartItemId
              ? { ...item, quantity }
              : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => {
          const price = item.product.discountPrice || item.product.basePrice;
          return total + price * item.quantity;
        }, 0);
      },
      getCartCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0);
      },
      language: 'ru',
      currency: 'RUB',
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      formatPrice: (price) => {
        const { currency } = get();
        const { rate, symbol } = currencyRates[currency];
        const converted = price * rate;
        return `${Math.round(converted).toLocaleString()} ${symbol}`;
      },
      isMenuOpen: false,
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
      closeMenu: () => set({ isMenuOpen: false }),
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      activeSessions: [],
      setActiveSessions: (activeSessions) => set({ activeSessions }),
      joinSession: (sessionId) => {
        const { activeSessions } = get();
        set({
          activeSessions: activeSessions.map((session) =>
            session.id === sessionId
              ? { ...session, currentParticipants: session.currentParticipants + 1 }
              : session
          ),
        });
      },
      // GB 2.0
      gb2Sessions: [],
      addGB2Session: (session) => set((state) => ({ 
        gb2Sessions: [...state.gb2Sessions, session] 
      })),
      getGB2SessionsByProduct: (productId) => {
        return get().gb2Sessions.filter(s => s.productId === productId && s.status === 'active');
      },
      joinGB2Session: (sessionId, participant) => {
        const { gb2Sessions } = get();
        set({
          gb2Sessions: gb2Sessions.map((session) => {
            if (session.id !== sessionId) return session;
            const newParticipants = [...session.participants, participant];
            // Пересчитываем tier
            let currentTier = null;
            for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
              if (newParticipants.length >= DISCOUNT_TIERS[i].minParticipants) {
                currentTier = DISCOUNT_TIERS[i];
                break;
              }
            }
            // Считаем до следующего tier
            let participantsToNextTier = 0;
            for (const tier of DISCOUNT_TIERS) {
              if (newParticipants.length < tier.minParticipants) {
                participantsToNextTier = tier.minParticipants - newParticipants.length;
                break;
              }
            }
            return {
              ...session,
              participants: newParticipants,
              currentTier,
              participantsToNextTier
            };
          }),
        });
      },
    }),
    {
      name: 'sidrat-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
        language: state.language,
        currency: state.currency,
        gb2Sessions: state.gb2Sessions,
      }),
    }
  )
);