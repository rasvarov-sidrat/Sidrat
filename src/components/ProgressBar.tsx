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
        <div className={cn("h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500", animated && "transition-all duration-500 ease-out", percentage >= 100 && "from-green-500 to-green-400", barClassName)} style={{ width: `${percentage}%` }} />
      </div>
      {showPercentage && <div className="flex justify-between text-xs text-gray-500 mt-1"><span>{current}</span><span>{target}</span></div>}
    </div>
  );
};