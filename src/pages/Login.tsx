import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check demo users
    const demoUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
    const user = demoUsers.find((u: User) => 
      u.email === formData.email && 
      (formData.password === 'demo123' || formData.password === 'seller123' || formData.password === 'admin123' || formData.password === 'password')
    );

    if (user) {
      onLogin(user);
      toast({ title: "Добро пожаловать!", description: `Вы вошли как ${user.name}` });
      navigate(from, { replace: true });
    } else {
      toast({ 
        title: "Ошибка входа", 
        description: "Неверный email или пароль. Попробуйте демо-данные.",
        variant: "destructive"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Вход в аккаунт</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="demo@sidrat.com"
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

        <Button type="submit" className="w-full bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
          Войти
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Демо-доступ:</p>
        <p className="mt-1">demo@sidrat.com / demo123</p>
        <p>seller@sidrat.com / seller123</p>
        <p>admin@sidrat.com / admin123</p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Нет аккаунта?{' '}
        <Link to="/register" className="text-[#2A7F6E] hover:underline font-medium">
          Зарегистрироваться
        </Link>
      </p>
    </motion.div>
  );
}