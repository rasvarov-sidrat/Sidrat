import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

interface PriceDisplayProps {
  originalPrice: number;
  discountedPrice?: number;
  quantity?: number;
  showPerUnit?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  originalPrice,
  discountedPrice,
  quantity = 1,
  showPerUnit = false,
  size = 'md',
  align = 'left',
  className = ''
}) => {
  const hasDiscount = discountedPrice !== undefined && discountedPrice < originalPrice;
  const savings = hasDiscount ? originalPrice - discountedPrice : 0;
  const discountPercent = hasDiscount ? Math.round((savings / originalPrice) * 100) : 0;
  const sizeClasses = {
    sm: { original: 'text-xs', discounted: 'text-sm', savings: 'text-xs' },
    md: { original: 'text-sm', discounted: 'text-lg', savings: 'text-xs' },
    lg: { original: 'text-base', discounted: 'text-2xl', savings: 'text-sm' }
  };
  const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' }[align];
  const displayOriginal = showPerUnit ? originalPrice / quantity : originalPrice;
  const displayDiscounted = hasDiscount && showPerUnit ? discountedPrice / quantity : discountedPrice;

  return (
    <div className={`${alignClass} ${className}`}>
      {hasDiscount ? (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`${sizeClasses[size].discounted} font-bold text-[#17493f]`}>
              {formatPrice(displayDiscounted ?? displayOriginal)}
            </span>
            <span className={`${sizeClasses[size].original} text-gray-400 line-through`}>{formatPrice(displayOriginal)}</span>
            <Badge className="rounded-full bg-[#C5A059]/15 text-[#8b6a2f] hover:bg-[#C5A059]/15 text-xs">
              -{discountPercent}%
            </Badge>
          </div>
          {savings > 0 && !showPerUnit ? (
            <span className={`${sizeClasses[size].savings} mt-0.5 text-[#2A7F6E]`}>
              Экономия: {formatPrice(savings)}
            </span>
          ) : null}
        </div>
      ) : (
        <span className={`${sizeClasses[size].discounted} font-bold text-[#17493f]`}>{formatPrice(displayOriginal)}</span>
      )}
    </div>
  );
};