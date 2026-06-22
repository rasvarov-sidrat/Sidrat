import { DISCOUNT_TIERS, DiscountTier } from '@/stores/store';

export const useTierCalculator = (participantCount: number) => {
  const getCurrentTier = (): DiscountTier | null => {
    for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
      if (participantCount >= DISCOUNT_TIERS[i].minParticipants) {
        return DISCOUNT_TIERS[i];
      }
    }
    return null;
  };

  const getNextTier = (): DiscountTier | null => {
    for (const tier of DISCOUNT_TIERS) {
      if (participantCount < tier.minParticipants) {
        return tier;
      }
    }
    return null;
  };

  const getParticipantsToNextTier = (): number => {
    const next = getNextTier();
    return next ? next.minParticipants - participantCount : 0;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const participantsToNextTier = getParticipantsToNextTier();

  return { currentTier, nextTier, participantsToNextTier };
};