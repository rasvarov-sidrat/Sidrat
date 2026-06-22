import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DiscountTier } from "@/types";

// ============================================================================
// TAILWIND MERGE (shadcn/ui)
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// PRICE FORMATTING
// ============================================================================

export const formatPrice = (price: number, currency: string = '₽'): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('RUB', currency);
};

// ============================================================================
// DISCOUNT TIER CALCULATIONS (GB 2.0 CORE)
// ============================================================================

/**
 * Calculate tiered price based on total units across entire cart
 * @param unitPrice - цена за единицу товара
 * @param quantity - количество единиц
 * @param tiers - массив тиров скидок
 * @param totalUnits - общее количество единиц во всей сессии
 * @returns итоговая цена с применённой скидкой
 */
export const calculateTieredPrice = (
  unitPrice: number,
  quantity: number,
  tiers: DiscountTier[],
  totalUnits: number
): number => {
  const applicableTier = getCurrentTier(totalUnits, tiers);
  const discountMultiplier = 1 - (applicableTier.discountPercent / 100);
  return unitPrice * quantity * discountMultiplier;
};

/**
 * Get current discount tier based on total units
 * @param totalUnits - общее количество единиц
 * @param tiers - массив тиров скидок
 * @returns текущий тир скидки
 */
export const getCurrentTier = (totalUnits: number, tiers: DiscountTier[]): DiscountTier => {
  const sortedTiers = [...tiers].sort((a, b) => b.minUnits - a.minUnits);
  for (const tier of sortedTiers) {
    if (totalUnits >= tier.minUnits) {
      return tier;
    }
  }
  return tiers[0];
};

/**
 * Get information about next achievable tier
 * @param currentUnits - текущее количество единиц
 * @param tiers - массив тиров скидок
 * @returns объект со следующим тиром и необходимым количеством единиц, или null если достигнут максимум
 */
export const getNextTierInfo = (
  currentUnits: number,
  tiers: DiscountTier[]
): { nextTier: DiscountTier; unitsNeeded: number } | null => {
  const sortedTiers = [...tiers].sort((a, b) => a.minUnits - b.minUnits);
  for (const tier of sortedTiers) {
    if (currentUnits < tier.minUnits) {
      return {
        nextTier: tier,
        unitsNeeded: tier.minUnits - currentUnits
      };
    }
  }
  return null; // Already at max tier
};

/**
 * Calculate total discount percent for current tier
 * @param totalUnits - общее количество единиц
 * @param tiers - массив тиров скидок
 * @returns процент скидки
 */
export const getCurrentDiscountPercent = (totalUnits: number, tiers: DiscountTier[]): number => {
  const tier = getCurrentTier(totalUnits, tiers);
  return tier.discountPercent;
};

/**
 * Check if next tier is achievable
 * @param totalUnits - текущее количество единиц
 * @param tiers - массив тиров скидок
 * @returns true если есть следующий тир
 */
export const hasNextTier = (totalUnits: number, tiers: DiscountTier[]): boolean => {
  return getNextTierInfo(totalUnits, tiers) !== null;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Group array of objects by key
 * @param array - исходный массив
 * @param key - ключ для группировки
 * @returns объект с группами
 */
export const groupBy = <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
  return array.reduce((result, currentItem) => {
    const groupKey = String(currentItem[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(currentItem);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Debounce function for performance optimization
 * @param func - функция для вызова
 * @param wait - время ожидания в мс
 * @returns debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for performance optimization
 * @param func - функция для вызова
 * @param limit - лимит в мс
 * @returns throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate random ID
 * @param prefix - префикс для ID
 * @returns уникальный ID
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Safely parse JSON
 * @param data - строка JSON
 * @param defaultValue - значение по умолчанию при ошибке
 * @returns распарсенный объект или defaultValue
 */
export const safeJsonParse = <T>(data: string, defaultValue: T): T => {
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - проверяемое значение
 * @returns true если пусто
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// ============================================================================
// DISCOUNT TIERS CONFIGURATION (GB 2.0)
// ============================================================================

export const DISCOUNT_TIERS = [
  { minUnits: 1, maxUnits: 9, discountPercent: 0, label: 'Розница' },
  { minUnits: 10, maxUnits: 49, discountPercent: 10, label: 'Мелкий опт' },
  { minUnits: 50, maxUnits: 99, discountPercent: 15, label: 'Средний опт' },
  { minUnits: 100, maxUnits: 499, discountPercent: 20, label: 'Крупный опт' },
  { minUnits: 500, maxUnits: Infinity, discountPercent: 25, label: 'Максимальный опт' },
];