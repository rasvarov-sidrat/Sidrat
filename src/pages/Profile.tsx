import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Gift, ShoppingBag, Users, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Order, BonusTransaction } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function Profile({ user, onUpdate }: ProfileProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [orders, setOrders] = useState<Order[]>(() => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    return allOrders.filter((o: Order) => o.userId === user.id);
  });
  const [transactions, setTransactions] = useState<BonusTransaction[]>(() => {
    const all = JSON.parse(localStorage.getItem('bonusTransactions') || '[]');
    return all.filter((t: BonusTransaction) => t.userId === user.id);
  });

  const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Ссылка скопирована!" });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#2A7F6E] to-[#236b5d] rounded-2xl p-8 text-white mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
            <p className="text-white/80">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
              {user.role === 'buyer' ? 'Покупатель' : user.role === 'seller' ? 'Продавец' : 'Администратор'}
            </span>
          </div>
          <div className="text-center md:text-right">
            <p className="text-white/80 text-sm mb-1">Бонусный баланс</p>
            <p className="text-4xl font-bold">{user.bonusBalance}</p>
            <Link to="/bonus" className="text-sm text-white/80 hover:text-white underline">
              История начислений
            </Link>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="orders" className="flex-1">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Заказы
          </TabsTrigger>
          <TabsTrigger value="referral" className="flex-1">
            <Users className="w-4 h-4 mr-2" />
            Реферальная программа
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="flex-1">
            <Gift className="w-4 h-4 mr-2" />
            Бонусы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[#2A7F6E]">{order.id}</span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {order.status === 'pending' ? 'В обработке' : order.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{item.product.name} x{item.quantity}</span>
                        <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between">
                    <span className="font-medium">Итого</span>
                    <span className="font-bold text-lg">${order.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">У вас пока нет заказов</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="referral">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ваша реферальная ссылка</h3>
            <p className="text-gray-600 mb-4">
              Приглашайте друзей и получайте 500 бонусов за регистрацию и 5% от их покупок!
            </p>
            
            <div className="flex gap-2 mb-6">
              <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-600 break-all">
                {referralLink}
              </div>
              <Button onClick={copyLink} variant="outline" className="border-[#2A7F6E] text-[#2A7F6E]">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#2A7F6E]/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-[#2A7F6E]">
                  {transactions.filter(t => t.type === 'earned' && t.description.includes('приглашение')).length * 500}
                </p>
                <p className="text-sm text-gray-600">Заработано с рефералов</p>
              </div>
              <div className="p-4 bg-[#C5A059]/5 rounded-lg text-center">
                <p className="text-2xl font-bold text-[#C5A059]">
                  {transactions.filter(t => t.type === 'earned' && t.description.includes('приглашение')).length}
                </p>
                <p className="text-sm text-gray-600">Приглашено друзей</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bonuses">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {transactions.map((t) => (
                  <div key={t.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{t.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-bold ${t.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'earned' ? '+' : '-'}{t.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">История бонусов пуста</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}