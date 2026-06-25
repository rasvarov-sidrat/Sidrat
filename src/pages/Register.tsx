import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, UserRound, KeyRound, ShieldCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { apiFetch } from '@/lib/api';
import { setAuthSession } from '@/lib/auth';
import { findUserByReferralCode } from '@/lib/mvp';
import type { User } from '@/types';

interface RegisterProps {
  onRegister: (user: User) => void;
}

type Step = 'details' | 'code';

export default function Register({ onRegister }: RegisterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const from = location.state?.from?.pathname || '/';
  const referralCode = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('ref') || params.get('referral') || referralCodeInput || '').trim();
  }, [location.search, referralCodeInput]);
  const referrer = useMemo(() => (referralCode ? findUserByReferralCode(referralCode) : null), [referralCode]);

  const handleRequestCode = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);
    if (password.trim().length < 6) {
      toast({ title: 'Ошибка', description: 'Пароль должен быть не короче 6 символов', variant: 'destructive' });
      setSending(false);
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Ошибка', description: 'Пароли не совпадают', variant: 'destructive' });
      setSending(false);
      return;
    }

    try {
      await apiFetch('/api/v1/auth/register/request-code', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          password,
          referralCode: referralCode || null,
        }),
      });
      setStep('code');
      toast({ title: 'Код отправлен', description: 'Проверьте inbox и spam. Введите 6-значный код из письма для завершения регистрации.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось отправить код';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    setVerifying(true);
    try {
      const result = await apiFetch<{ accessToken: string; user: User }>('/api/v1/auth/register/verify', {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
        }),
      });
      setAuthSession(result.user, result.accessToken);
      onRegister(result.user);
      toast({ title: 'Регистрация успешна', description: 'Аккаунт подтверждён и готов к работе.' });
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подтвердить код';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Регистрация</h2>
      <p className="mt-2 text-sm text-gray-600">
        Регистрация через e-mail: на почту придёт 6-значный код. Seller-заявка — внизу сайта.
      </p>
      {referrer ? (
        <div className="mt-4 rounded-2xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-4 text-sm text-[#17493f]">
          Вы пришли по приглашению <span className="font-medium">{referrer.name}</span>. После подтверждённых покупок этот пользователь будет получать 1% reward.
        </div>
      ) : referralCode ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Код приглашения не найден, регистрация пройдёт без referral.
        </div>
      ) : null}

      <form onSubmit={step === 'details' ? handleRequestCode : handleVerify} className="mt-6 space-y-4">
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
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="ivan@example.com" />
          </div>
        </div>
        <div>
          <Label htmlFor="referral">Referral code (опционально)</Label>
          <Input
            id="referral"
            value={referralCodeInput}
            onChange={(e) => setReferralCodeInput(e.target.value)}
            className="mt-1"
            placeholder="BUYER1"
          />
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <div className="relative mt-1">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" placeholder="минимум 6 символов" />
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

        {step === 'code' ? (
          <div>
            <Label htmlFor="code">6-значный код</Label>
            <div className="relative mt-1">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 tracking-[0.4em]"
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          </div>
        ) : null}

        <Button type="submit" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]" disabled={sending || verifying}>
          {step === 'details' ? (
            <>
              <Send className="mr-2 h-4 w-4" />
              Отправить код
            </>
          ) : (
            'Подтвердить и создать аккаунт'
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Уже есть аккаунт? <Link to="/login" className="font-medium text-[#2A7F6E] hover:underline">Войти</Link>
      </p>
    </div>
  );
}
