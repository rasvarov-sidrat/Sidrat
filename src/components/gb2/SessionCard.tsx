import { motion } from 'framer-motion';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GB2Session } from '@/types';
import { Button } from '@/components/ui/button';
import { getProductCoverImage } from '@/lib/mvp';

interface SessionCardProps {
  session: GB2Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const timeLeft = new Date(session.endsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={getProductCoverImage(session.product)}
          alt={session.product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-white text-sm font-medium"
          style={{ backgroundColor: session.currentTier.color }}>
          {session.currentTier.icon} {session.currentTier.discount}% OFF
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold truncate">{session.product.name}</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-gray-600">
            <Users className="w-4 h-4 mr-1" />
            <span className="text-sm">{session.participants.length} участников</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">{daysLeft} дн.</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-[#2A7F6E]">
              ${(session.product.price * (1 - session.currentTier.discount / 100)).toFixed(0)}
            </span>
            <span className="text-sm text-gray-400 line-through ml-2">
              ${session.product.price}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Экономия</div>
            <div className="text-sm font-medium text-[#C5A059]">
              ${(session.product.price * session.currentTier.discount / 100).toFixed(0)}
            </div>
          </div>
        </div>

        <Link to={`/session/${session.id}`}>
          <Button className="w-full bg-[#2A7F6E] hover:bg-[#236b5d] text-white group">
            Подробнее
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}