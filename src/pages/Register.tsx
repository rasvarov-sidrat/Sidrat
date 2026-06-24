import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, UserRound, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { findUserByReferralCode, loadUsers, saveUsers, setCurrentUser } from '@/lib/mvp';
import type { User } from '@/types';

interface RegisterProps {
  onRegister: (user: User) => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const from = location.state?.from?.pathname || '/';
  const referralCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('ref') || params.get('referral') || '').trim();
  }, [location.search]);
  const referrer = useMemo(() => (referralCode ? findUserByReferralCode(referralCode) : null), [referralCode]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const users = loadUsers();
    if (users.some((item) => item.email.toLowerCase() === email.toLowerCase())) {
      toast({ title: 'Ошибка', description: 'Пользователь уже существует', variant: 'destructive' });
      return;
    }

    if (password.trim().length < 3) {
      toast({ title: 'Ошибка', description: 'Пароль должен быть не короче 3 символов', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }

    const nextUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'buyer',
      walletBalance: 0,
      referralCode: `REF-${Date.now().toString(36).toUpperCase()}`,
      referredBy: referrer?.referralCode,
      createdAt: new Date().toISOString(),
    };

    users.unshift(nextUser);
    saveUsers(users);
    setCurrentUser(nextUser);
    onRegister(nextUser);
    toast({ title: 'Регистрация успешна', description: 'Добро пожаловать в SIDRAT' });
    navigate(from, { replace: true });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Регистрация</h2>
      <p className="mt-2 text-sm text-gray-600">Новый аккаунт создаёт buyer-роль по умолчанию.</p>
      {referrer ? (
        <div className="mt-4 rounded-2xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-4 text-sm text-[#17493f]">
          Вы пришли по приглашению <span className="font-medium">{referrer.name}</span>. После подтверждённых покупок этот пользователь будет получать 1% reward.
        </div>
      ) : referralCode ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Код приглашения не найден, регистрация пройдёт без referral.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Имя</Label>
          <div className="relative mt-1">
            <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Иван Иванов" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="ivan@sidrat.local" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="любая строка" />
          </div>
        </div>
        <div>
          <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10"
              placeholder="повторите пароль"
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
          Создать аккаунт
        </Button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Уже есть аккаунт? <Link to="/login" className="font-medium text-[#2A7F6E] hover:underline">Войти</Link>
      </p>
    </div>
  );
}
