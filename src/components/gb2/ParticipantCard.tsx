import { motion } from 'framer-motion';
import { User, Crown, Leaf, Package } from 'lucide-react';
import { SessionParticipant } from '@/types';

interface ParticipantCardProps {
  participant: SessionParticipant;
  isCreator: boolean;
  index: number;
}

export default function ParticipantCard({ participant, isCreator, index }: ParticipantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex items-center p-3 rounded-lg border ${
        isCreator 
          ? 'bg-[#C5A059]/10 border-[#C5A059]' 
          : 'bg-white border-gray-200'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isCreator ? 'bg-[#C5A059] text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {isCreator ? <Crown className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>
      
      <div className="ml-3 flex-1">
        <div className="flex items-center">
          <span className="font-medium text-gray-900">
            {participant.user.name}
          </span>
          {isCreator && (
            <span className="ml-2 px-2 py-0.5 bg-[#C5A059] text-white text-xs rounded-full">
              Организатор
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{new Date(participant.joinedAt).toLocaleDateString()}</span>
          {participant.quantity > 1 && (
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {participant.quantity} ед.
            </span>
          )}
        </div>
        {participant.variant && (
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            {participant.variant.size && <span>Размер: {participant.variant.size}</span>}
            {participant.variant.color && (
              <span className="flex items-center gap-1">
                Цвет: 
                <span 
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: participant.variant.color.hex }}
                />
                {participant.variant.color.name}
              </span>
            )}
          </div>
        )}
      </div>

      {participant.lotusFruits > 0 && (
        <div className="flex items-center text-[#2A7F6E]">
          <Leaf className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{participant.lotusFruits}</span>
        </div>
      )}
    </motion.div>
  );
}