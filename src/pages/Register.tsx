import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User as UserType } from '@/types';

interface RegisterProps {
  onRegister: (user: UserType) => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const refCode = searchParams.get('ref');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
      return;
    }

    const users = JSON.parse(localStorage.getItem('demoUsers') || '[]');
    
    if (users.some((u: UserType) => u.email === formData.email)) {
      toast({ title: "Ошибка", description: "Пользователь с таким email уже существует", variant: "destructive" });
      return;
    }

    const newUser: UserType = {
      id: `user-${Date.now()}`,
      email: formData.email,
      name: formData.name,
      role: 'buyer',
      bonusBalance: refCode ? 100 : 0, // Welcome bonus + referral bonus
      referralCode: `REF${Date.now().toString(36).toUpperCase()}`,
      referredBy: refCode || undefined,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('demoUsers', JSON.stringify(users));

    // Award referrer
    if (refCode) {
      const referrerIndex = users.findIndex((u: UserType) => u.referralCode === refCode || u.id === refCode);
      if (referrerIndex !== -1) {
        users[referrerIndex].bonusBalance += 500;
        localStorage.setItem('demoUsers', JSON.stringify(users));

        const transactions = JSON.parse(localStorage.getItem('bonusTransactions') || '[]');
        transactions.push({
          id: `trans-${Date.now()}`,
          userId: users[referrerIndex].id,
          type: 'earned',
          amount: 500,
          description: 'Бонус за приглашение друга',
          relatedUserId: newUser.id,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('bonusTransactions', JSON.stringify(transactions));
      }
    }

    onRegister(newUser);
    toast({ title: "Регистрация успешна!", description: "Добро пожаловать в SIDRAT!" });
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Создать аккаунт</h2>
      
      {refCode && (
        <div className="mb-4 p-3 bg-[#2A7F6E]/10 rounded-lg text-center text-sm text-[#2A7F6E]">
          Вы пришли по реферальной ссылке! Получите 100 бонусов при регистрации!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Имя</Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="pl-10"
              placeholder="Иван Иванов"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="pl-10"
              placeholder="ivan@example.com"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="pl-10 pr-10"
              placeholder="••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            placeholder="••••••"
          />
        </div>

        <Button type="submit" className="w-full bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
          Зарегистрироваться
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-[#2A7F6E] hover:underline font-medium">
          Войти
        </Link>
      </p>
    </motion.div>
  );
}