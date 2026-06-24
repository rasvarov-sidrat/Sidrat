import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { loadUsers } from '@/lib/mvp';
import type { User } from '@/types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const user = loadUsers().find((item) => item.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      toast({ title: 'Ошибка входа', description: 'Пользователь не найден', variant: 'destructive' });
      return;
    }

    if (password.trim().length < 3) {
      toast({ title: 'Ошибка входа', description: 'Введите любой пароль длинее 2 символов', variant: 'destructive' });
      return;
    }

    onLogin(user);
    toast({ title: 'Добро пожаловать', description: `Вход выполнен как ${user.name}` });
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Вход</h2>
      <p className="mt-2 text-sm text-gray-600">Для локального MVP достаточно войти демо-аккаунтом.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="buyer@sidrat.local" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="любая строка" />
          </div>
        </div>
        <Button type="submit" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
          Войти
        </Button>
      </form>

      <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Demo accounts</p>
        <p className="mt-2">buyer@sidrat.local</p>
        <p>seller@sidrat.local</p>
        <p>admin@sidrat.local</p>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Нет аккаунта? <Link to="/register" className="font-medium text-[#2A7F6E] hover:underline">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
