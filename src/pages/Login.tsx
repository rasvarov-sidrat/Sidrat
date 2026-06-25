import { type FormEvent, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { setAuthSession } from '@/lib/auth';
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
  const [loading, setLoading] = useState(false);
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiFetch<{ accessToken: string; user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthSession(result.user, result.accessToken);
      onLogin(result.user);
      toast({ title: 'Добро пожаловать', description: `Вход выполнен как ${result.user.name}` });
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось войти';
      toast({ title: 'Ошибка входа', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Вход</h2>
      <p className="mt-2 text-sm text-gray-600">Вход идёт через backend. Нужен уже подтверждённый e-mail.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="buyer@example.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="любая строка" />
          </div>
        </div>
        <Button type="submit" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]" disabled={loading}>
          Войти
        </Button>
      </form>

      <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-900">Demo accounts</p>
        <p className="mt-2">buyer@example.com / buyer-demo-password</p>
        <p>seller@example.com / seller-demo-password</p>
        <p>admin@example.com / admin-demo-password</p>
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Нет аккаунта? <Link to="/register" className="font-medium text-[#2A7F6E] hover:underline">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
