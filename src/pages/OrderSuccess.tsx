import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order } from '@/types';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const found = orders.find((o: Order) => o.id === orderId);
    if (found) setOrder(found);
  }, [orderId]);

  if (!order) {
    return <div className="text-center py-16">Заказ не найден</div>;
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-600" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Заказ успешно оформлен!</h1>
        <p className="text-gray-600 mb-6">Спасибо за покупку. Мы отправили подтверждение на ваш email.</p>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">Номер заказа</span>
            <span className="text-xl font-mono font-bold text-[#2A7F6E]">{order.id}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">Сумма заказа</span>
            <span className="text-xl font-bold text-gray-900">${order.finalAmount.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Статус</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              В обработке
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Package className="w-6 h-6 mx-auto mb-2 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Сборка</p>
            <p className="text-xs text-gray-500">1-2 дня</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Truck className="w-6 h-6 mx-auto mb-2 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Доставка</p>
            <p className="text-xs text-gray-500">3-5 дней</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <Clock className="w-6 h-6 mx-auto mb-2 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Получение</p>
            <p className="text-xs text-gray-500">Ожидается</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/catalog">
            <Button variant="outline" className="border-[#2A7F6E] text-[#2A7F6E]">
              Продолжить покупки
            </Button>
          </Link>
          <Link to="/profile">
            <Button className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
              Мои заказы
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}