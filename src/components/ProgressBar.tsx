import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  target: number;
  className?: string;
  barClassName?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  className = '',
  barClassName = '',
  showPercentage = false,
  animated = true
}) => {
  const percentage = Math.min(100, Math.max(0, (current / target) * 100));
  return (
    <div className={cn("w-full", className)}>
      <div className="h-full w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-[#2A7F6E] via-[#4f8f81] to-[#C5A059] transition-all duration-500",
            animated && "ease-out",
            percentage >= 100 && "from-[#8b6a2f] via-[#C5A059] to-[#d8b56f]",
            barClassName,
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{current}</span><span>{target}</span></div>}
    </div>
  );
};