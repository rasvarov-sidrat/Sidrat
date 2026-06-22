import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityAdjusterProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (quantity: number) => void;
  showDelete?: boolean;
  onDelete?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const QuantityAdjuster: React.FC<QuantityAdjusterProps> = ({
  quantity,
  min = 0,
  max = 999,
  onChange,
  showDelete = true,
  onDelete,
  size = 'md',
  className = ''
}) => {
  const handleDecrement = () => { if (quantity > min) onChange(quantity - 1); };
  const handleIncrement = () => { if (quantity < max) onChange(quantity + 1); };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) onChange(Math.max(min, Math.min(max, value)));
  };
  const sizeClasses = {
    sm: { button: 'h-7 w-7', input: 'h-7 w-12 text-sm', icon: 'h-3 w-3' },
    md: { button: 'h-9 w-9', input: 'h-9 w-16 text-base', icon: 'h-4 w-4' }
  };
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showDelete && quantity === min && onDelete ? (
        <Button variant="ghost" size="icon" className={sizeClasses[size].button} onClick={onDelete}>
          <Trash2 className={`${sizeClasses[size].icon} text-red-500`} />
        </Button>
      ) : (
        <Button variant="outline" size="icon" className={sizeClasses[size].button} onClick={handleDecrement} disabled={quantity <= min}>
          <Minus className={sizeClasses[size].icon} />
        </Button>
      )}
      <Input type="number" value={quantity} onChange={handleInputChange} className={`${sizeClasses[size].input} text-center font-medium`} min={min} max={max} />
      <Button variant="outline" size="icon" className={sizeClasses[size].button} onClick={handleIncrement} disabled={quantity >= max}>
        <Plus className={sizeClasses[size].icon} />
      </Button>
    </div>
  );
};