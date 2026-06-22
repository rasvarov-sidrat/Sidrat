import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Sparkles, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface LotusGameProps {
  userFruits: number;
  onCollect: (amount: number, watchedAd: boolean) => void;
  onExchange: () => void;
  maxDiscount: number;
  currentDiscount: number;
}

export default function LotusGame({ 
  userFruits, 
  onCollect, 
  onExchange,
  maxDiscount,
  currentDiscount 
}: LotusGameProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedAmount, setCollectedAmount] = useState(0);
  const [watchedAd, setWatchedAd] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();

  const handleCollect = () => {
    setIsCollecting(true);
    setShowAnimation(true);
    
    // Simulate collection
    const baseAmount = Math.floor(Math.random() * 10) + 1;
    const finalAmount = watchedAd ? baseAmount * 2 : baseAmount;
    
    setCollectedAmount(finalAmount);
    
    setTimeout(() => {
      onCollect(finalAmount, watchedAd);
      setIsCollecting(false);
      setShowAnimation(false);
      setWatchedAd(false);
      
      toast({
        title: "Плоды собраны! 🎉",
        description: `Вы получили ${finalAmount} плодов лотоса${watchedAd ? ' (удвоено за рекламу)' : ''}`,
      });
    }, 1500);
  };

  const handleWatchAd = () => {
    setWatchedAd(true);
    toast({
      title: "Реклама просмотрена!",
      description: "Следующий сбор принесёт двойные плоды!",
    });
  };

  const canExchange = userFruits >= 10;
  const exchangeDiscount = Math.min(Math.floor(userFruits / 10), maxDiscount - currentDiscount);

  return (
    <div className="bg-gradient-to-br from-[#2A7F6E]/5 to-[#C5A059]/5 rounded-xl p-6 border border-[#2A7F6E]/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-[#2A7F6E]" />
            Плоды лотоса
          </h3>
          <p className="text-sm text-gray-500">Собирайте плоды для дополнительных скидок</p>
        </div>
        <div className="text-center">
          <motion.div 
            key={userFruits}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold text-[#2A7F6E]"
          >
            {userFruits}
          </motion.div>
          <span className="text-xs text-gray-500">плодов</span>
        </div>
      </div>

      {/* Collection Animation */}
      <AnimatePresence>
        {showAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              {[...Array(collectedAmount)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0.5],
                    x: (Math.random() - 0.5) * 100,
                    y: -50 - Math.random() * 50
                  }}
                  transition={{ duration: 1, delay: i * 0.05 }}
                  className="absolute"
                >
                  <Leaf className="w-6 h-6 text-[#2A7F6E]" />
                </motion.div>
              ))}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Sparkles className="w-12 h-12 text-[#C5A059]" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          onClick={handleCollect}
          disabled={isCollecting}
          className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white"
        >
          {isCollecting ? (
            <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Leaf className="w-4 h-4 mr-2" />
          )}
          Собрать плоды
        </Button>
        
        <Button
          onClick={handleWatchAd}
          disabled={watchedAd || isCollecting}
          variant="outline"
          className={`border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059]/10 ${
            watchedAd ? 'opacity-50' : ''
          }`}
        >
          <Play className="w-4 h-4 mr-2" />
          {watchedAd ? 'Реклама просмотрена' : 'Смотреть рекламу'}
        </Button>
      </div>

      {/* Exchange Section */}
      {canExchange && exchangeDiscount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-4 border-t border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                10 плодов = 1% скидки
              </p>
              <p className="text-sm font-medium text-[#C5A059]">
                Можно обменять на {exchangeDiscount}% доп. скидки
              </p>
            </div>
            <Button
              onClick={onExchange}
              className="bg-[#C5A059] hover:bg-[#b08d4b] text-white"
            >
              Обменять
            </Button>
          </div>
        </motion.div>
      )}

      {currentDiscount >= maxDiscount && (
        <p className="text-sm text-green-600 text-center mt-3">
          ✓ Достигнута максимальная скидка тира!
        </p>
      )}
    </div>
  );
}