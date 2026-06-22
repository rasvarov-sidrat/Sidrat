import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Percent, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Product, GB2Session, User, TierConfig } from '@/types';
import { tierConfigs } from '@/data/mockData';

interface CreateSessionProps {
  user: User;
}

export default function CreateSession({ user }: CreateSessionProps) {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<TierConfig>(tierConfigs[0]);

  useEffect(() => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const found = products.find((p: Product) => p.id === productId);
    if (found) {
      setProduct(found);
      setLoading(false);
    } else {
      navigate('/catalog');
    }
  }, [productId, navigate]);

  const handleCreate = () => {
    if (!product) return;

    const newSession: GB2Session = {
      id: `session-${Date.now()}`,
      productId: product.id,
      product: product,
      creatorId: user.id,
      creator: user,
      participants: [{
        userId: user.id,
        user: user,
        joinedAt: new Date().toISOString(),
        lotusFruits: 0,
      }],
      currentTier: tierConfigs[0],
      maxTier: tierConfigs[tierConfigs.length - 1],
      status: 'active',
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalDiscount: tierConfigs[0].discount,
      referralTree: [{
        userId: user.id,
        user: user,
        children: [],
        depth: 0,
      }],
    };

    const sessions = JSON.parse(localStorage.getItem('gb2Sessions') || '[]');
    sessions.push(newSession);
    localStorage.setItem('gb2Sessions', JSON.stringify(sessions));

    toast({
      title: "Сессия создана!",
      description: "Групповая покупка успешно создана. Приглашайте друзей!",
    });

    navigate(`/session/${newSession.id}`);
  };

  if (loading || !product) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-[#2A7F6E] mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
      >
        <div className="grid md:grid-cols-2 gap-8 p-8">
          {/* Product Info */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-64 object-cover rounded-xl mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.description}</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#2A7F6E]">${product.price}</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-400 line-through">${product.originalPrice}</span>
              )}
            </div>
          </div>

          {/* Tier Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Выберите целевой тир</h2>
            <div className="space-y-3">
              {tierConfigs.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTier.name === tier.name
                      ? 'border-[#2A7F6E] bg-[#2A7F6E]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{tier.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {tier.minParticipants} участников
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: tier.color }}>
                        {tier.discount}%
                      </div>
                      <div className="text-xs text-gray-500">скидка</div>
                    </div>
                  </div>
                  {selectedTier.name === tier.name && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-[#2A7F6E]/20"
                    >
                      <p className="text-sm text-[#2A7F6E]">
                        Итоговая цена: ${(product.price * (1 - tier.discount / 100)).toFixed(2)}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                Сессия будет активна 7 дней
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Percent className="w-4 h-4 mr-2" />
                Скидка увеличивается с количеством участников
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="w-full mt-6 bg-[#2A7F6E] hover:bg-[#236b5d] text-white py-6 text-lg"
            >
              Создать групповую покупку
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}