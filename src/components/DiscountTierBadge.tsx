import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Crown, Package, ShoppingBag } from 'lucide-react';
import type { DiscountTier } from '@/types';

interface DiscountTierBadgeProps {
  tier: DiscountTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const tierIcons: Record<string, React.ReactNode> = {
  'Розница': <ShoppingBag className="h-3 w-3" />,
  'Мелкий опт': <Package className="h-3 w-3" />,
  'Средний опт': <Package className="h-3 w-3" />,
  'Крупный опт': <TrendingDown className="h-3 w-3" />,
  'Максимальный опт': <Crown className="h-3 w-3" />,
};

const tierColors: Record<string, string> = {
  'Розница': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  'Мелкий опт': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  'Средний опт': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  'Крупный опт': 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  'Максимальный опт': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
};

export const DiscountTierBadge: React.FC<DiscountTierBadgeProps> = ({ tier, size = 'md', showIcon = true, className = '' }) => {
  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };
  return (
    <Badge variant="secondary" className={`${tierColors[tier.label] || 'bg-gray-100'} ${sizeClasses[size]} font-medium ${className}`}>
      {showIcon && <span className="mr-1">{tierIcons[tier.label]}</span>}
      {tier.discountPercent > 0 ? <span>-{tier.discountPercent}%</span> : <span>{tier.label}</span>}
    </Badge>
  );
};