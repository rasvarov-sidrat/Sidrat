import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatPrice, calculateTieredPrice, groupBy } from '@/lib/utils';
import type { ProductVariant, DiscountTier } from '@/types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedQuantities: Record<string, number>;
  onQuantityChange: (variant: ProductVariant, quantity: number) => void;
  totalUnits: number;
  discountTiers: DiscountTier[];
  onQuickAdd?: (variant: ProductVariant) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedQuantities,
  onQuantityChange,
  totalUnits,
  discountTiers,
  onQuickAdd
}) => {
  const groupedBySize = useMemo(() => groupBy(variants, 'size'), [variants]);
  const availableSizes = useMemo(() => Object.keys(groupedBySize), [groupedBySize]);

  const getDisplayPrice = (variant: ProductVariant, quantity: number) => {
    const original = variant.price * quantity;
    const discounted = calculateTieredPrice(variant.price, quantity, discountTiers, totalUnits);
    return { original, discounted };
  };

  const getStockColor = (stock: number): string => {
    if (stock === 0) return 'text-red-500';
    if (stock < 10) return 'text-orange-500';
    return 'text-green-600';
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {availableSizes.map(size => (
          <div key={size} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Размер: {size}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {groupedBySize[size].map(variant => {
                const quantity = selectedQuantities[variant.id] || 0;
                const { original, discounted } = getDisplayPrice(variant, quantity || 1);
                const isSelected = quantity > 0;
                const savings = original - discounted;
                const hasDiscount = savings > 0;

                return (
                  <Tooltip key={variant.id}>
                    <TooltipTrigger asChild>
                      <div className={`relative border rounded-lg p-2 transition-all ${
                        isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'
                      } ${variant.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: variant.colorHex || variant.color }} />
                            <span className="text-xs text-gray-600 truncate max-w-[60px]">{variant.color}</span>
                          </div>
                          <span className={`text-xs ${getStockColor(variant.stock)}`}>
                            {variant.stock > 0 ? `${variant.stock} шт.` : 'Нет'}
                          </span>
                        </div>
                        <div className="mb-2">
                          {isSelected && hasDiscount ? (
                            <div className="text-right">
                              <span className="text-xs text-gray-400 line-through block">{formatPrice(variant.price)}</span>
                              <span className="text-sm font-bold text-green-700">{formatPrice(discounted / quantity)}</span>
                              <Badge variant="destructive" className="text-[10px] ml-1">-{Math.round((savings / original) * 100)}%</Badge>
                            </div>
                          ) : (
                            <p className="text-sm font-medium text-right">{formatPrice(variant.price)}</p>
                          )}
                        </div>
                        {isSelected ? (
                          <div className="flex items-center justify-between gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onQuantityChange(variant, quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onQuantityChange(variant, quantity + 1)} disabled={quantity >= variant.stock}><Plus className="h-3 w-3" /></Button>
                          </div>
                        ) : (
                          <Button variant="secondary" size="sm" className="w-full h-7 text-xs" onClick={() => onQuantityChange(variant, 1)} disabled={variant.stock === 0}>
                            {variant.stock > 0 ? <> <Plus className="h-3 w-3 mr-1" /> Добавить</> : 'Нет в наличии'}
                          </Button>
                        )}
                        {!isSelected && onQuickAdd && variant.stock > 0 && (
                          <Button size="icon" variant="ghost" className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); onQuickAdd(variant); }}>
                            <ShoppingBag className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{variant.sku || 'Артикул не указан'}</p>
                        <p className="text-sm text-gray-500">{size} / {variant.color}</p>
                        {variant.stock > 0 ? <p className="text-sm">В наличии: {variant.stock} шт.</p> : <p className="text-sm text-red-500">Нет в наличии</p>}
                        {hasDiscount && <p className="text-sm text-green-600">Скидка применена: {formatPrice(savings)} экономии</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
        {variants.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Нет доступных вариантов</p>}
      </div>
    </TooltipProvider>
  );
};