import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem, User } from '@/types';

interface CartProps {
  user: User | null;
}

export default function Cart({ user }: CartProps) {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [bonusInput, setBonusInput] = useState('');
  const [appliedBonuses, setAppliedBonuses] = useState(0);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(stored);
  }, []);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('storage'));
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    updateCart(newCart);
  };

  const removeItem = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    updateCart(newCart);
  };

  const applyBonuses = () => {
    const amount = parseInt(bonusInput) || 0;
    if (!user) {
      alert('Войдите, чтобы использовать бонусы');
      return;
    }
    if (amount > user.bonusBalance) {
      alert('Недостаточно бонусов');
      return;
    }
    if (amount > subtotal) {
      alert('Бонусы не могут превышать сумму заказа');
      return;
    }
    setAppliedBonuses(amount);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = cart.reduce((sum, item) => 
    sum + (item.product.originalPrice ? (item.product.originalPrice - item.product.price) : 0) * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - appliedBonuses);

  if (cart.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Корзина пуста</h2>
        <p className="text-gray-500 mb-6">Добавьте товары, чтобы продолжить покупки</p>
        <Link to="/catalog">
          <Button className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
            Перейти в каталог
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Корзина</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex gap-4"
              >
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <Link 
                    to={`/product/${item.product.slug}`}
                    className="font-semibold text-gray-900 hover:text-[#2A7F6E]"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">${item.product.price} / шт.</p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="px-3 py-1 hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Итого</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Подытог</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Скидка</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              {appliedBonuses > 0 && (
                <div className="flex justify-between text-[#C5A059]">
                  <span>Бонусы</span>
                  <span>-${appliedBonuses}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>К оплате</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {user && user.bonusBalance > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Доступно бонусов: {user.bonusBalance}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Сумма бонусов"
                    value={bonusInput}
                    onChange={(e) => setBonusInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={applyBonuses}
                    variant="outline"
                    className="border-[#C5A059] text-[#C5A059]"
                  >
                    Применить
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate('/checkout', { state: { appliedBonuses } })}
              className="w-full mt-6 bg-[#2A7F6E] hover:bg-[#236b5d] text-white py-6"
            >
              Оформить заказ
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}