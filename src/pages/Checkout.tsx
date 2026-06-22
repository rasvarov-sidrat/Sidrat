import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Truck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Order, User, CartItem } from '@/types';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  
  const appliedBonuses = location.state?.appliedBonuses || 0;
  const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');
  const currentUser: User | null = JSON.parse(localStorage.getItem('currentUser') || 'null');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const finalAmount = Math.max(0, subtotal - appliedBonuses);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create order
    const order: Order = {
      id: `ORD-${Date.now()}`,
      userId: currentUser?.id || 'guest',
      items: cart,
      totalAmount: subtotal,
      discountAmount: subtotal - finalAmount,
      bonusUsed: appliedBonuses,
      finalAmount: finalAmount,
      status: 'pending',
      shippingAddress: formData,
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // Save order
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    localStorage.setItem('cart', '[]');
    window.dispatchEvent(new Event('storage'));

    // Deduct bonuses
    if (appliedBonuses > 0 && currentUser) {
      const users = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      const userIndex = users.findIndex((u: User) => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex].bonusBalance -= appliedBonuses;
        localStorage.setItem('demoUsers', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
      }

      // Add transaction
      const transactions = JSON.parse(localStorage.getItem('bonusTransactions') || '[]');
      transactions.push({
        id: `trans-${Date.now()}`,
        userId: currentUser.id,
        type: 'spent',
        amount: appliedBonuses,
        description: 'Использовано при оформлении заказа',
        relatedOrderId: order.id,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('bonusTransactions', JSON.stringify(transactions));
    }

    // Award referral bonus (5% of purchase)
    if (currentUser?.referredBy) {
      const bonusAmount = Math.round(finalAmount * 0.05);
      const users = JSON.parse(localStorage.getItem('demoUsers') || '[]');
      const referrerIndex = users.findIndex((u: User) => u.id === currentUser.referredBy);
      
      if (referrerIndex !== -1) {
        users[referrerIndex].bonusBalance += bonusAmount;
        localStorage.setItem('demoUsers', JSON.stringify(users));

        const transactions = JSON.parse(localStorage.getItem('bonusTransactions') || '[]');
        transactions.push({
          id: `trans-${Date.now()}`,
          userId: currentUser.referredBy,
          type: 'earned',
          amount: bonusAmount,
          description: `5% от покупки ${currentUser.name}`,
          relatedUserId: currentUser.id,
          relatedOrderId: order.id,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('bonusTransactions', JSON.stringify(transactions));
      }
    }

    setTimeout(() => {
      setLoading(false);
      navigate(`/order-success/${order.id}`);
    }, 1500);
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Корзина пуста</h2>
        <Button onClick={() => navigate('/catalog')} className="bg-[#2A7F6E]">
          В каталог
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Оформление заказа</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-[#2A7F6E]" />
                Адрес доставки
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="fullName">ФИО</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Почтовый индекс</Label>
                  <Input
                    id="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="country">Страна</Label>
                  <Input
                    id="country"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            </motion.div>

            {/* Payment Method */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-[#2A7F6E]" />
                Способ оплаты
              </h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg mb-2 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex-1 cursor-pointer">Банковская карта</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">Наличные при получении</Label>
                </div>
              </RadioGroup>
            </motion.div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2A7F6E] hover:bg-[#236b5d] text-white py-6 text-lg"
            >
              {loading ? 'Оформление...' : 'Подтвердить заказ'}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ваш заказ</h3>
            
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product.name} x{item.quantity}</span>
                  <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Подытог</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {appliedBonuses > 0 && (
                <div className="flex justify-between text-sm text-[#C5A059]">
                  <span>Бонусы</span>
                  <span>-${appliedBonuses}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                <span>Итого</span>
                <span>${finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}