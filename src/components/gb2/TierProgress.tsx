import { motion } from 'framer-motion';
import { TierConfig } from '@/types';

interface TierProgressProps {
  tiers: TierConfig[];
  totalUnits: number;
  currentTier: TierConfig;
}

export default function TierProgress({ tiers, totalUnits, currentTier }: TierProgressProps) {
  const maxUnits = tiers[tiers.length - 1].minUnits;
  const progress = Math.min((totalUnits / maxUnits) * 100, 100);
  
  const currentTierIndex = tiers.findIndex(t => t.name === currentTier.name);
  const nextTier = tiers[currentTierIndex + 1];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Прогресс скидки</h3>
          <p className="text-sm text-gray-500">
            {totalUnits} единиц товара • Текущий тир: {currentTier.icon} {currentTier.name}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: currentTier.color }}>
            {currentTier.discount}%
          </span>
          <p className="text-xs text-gray-500">скидка</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full rounded-full"
          style={{ backgroundColor: currentTier.color }}
        />
        {/* Tier Markers */}
        {tiers.map((tier) => {
          const position = (tier.minUnits / maxUnits) * 100;
          return (
            <div
              key={tier.name}
              className="absolute top-0 w-1 h-full bg-white/50"
              style={{ left: `${position}%` }}
              title={`${tier.name}: ${tier.minUnits} ед.`}
            />
          );
        })}
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-5 gap-2">
        {tiers.map((tier, index) => {
          const isActive = index <= currentTierIndex;
          const isCurrent = index === currentTierIndex;
          
          return (
            <motion.div
              key={tier.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`text-center p-3 rounded-lg border-2 ${
                isCurrent 
                  ? 'border-[#2A7F6E] bg-[#2A7F6E]/5' 
                  : isActive 
                    ? 'border-gray-300' 
                    : 'border-gray-100 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{tier.icon}</div>
              <div className="text-xs font-medium text-gray-900">{tier.name}</div>
              <div className="text-xs text-gray-500">{tier.minUnits} ед.</div>
              <div className="text-sm font-bold" style={{ color: tier.color }}>
                {tier.discount}%
              </div>
            </motion.div>
          );
        })}
      </div>

      {nextTier && (
        <div className="mt-4 p-3 bg-[#C5A059]/10 rounded-lg text-center">
          <p className="text-sm text-[#C5A059]">
            Ещё {nextTier.minUnits - totalUnits} единиц до {nextTier.name} ({nextTier.discount}% скидки)!
          </p>
        </div>
      )}
    </div>
  );
}