import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createWithdrawalRequest, formatRuble, getUserWalletTransactions, getUserWithdrawals } from '@/lib/mvp';
import type { User } from '@/types';

interface WalletProps {
  user: User;
}

export default function WalletPage({ user }: WalletProps) {
  const { toast } = useToast();
  const transactions = useMemo(() => getUserWalletTransactions(user.id), [user.id]);
  const withdrawals = useMemo(() => getUserWithdrawals(user.id), [user.id]);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = () => {
    try {
      const amount = Number(withdrawAmount);
      const request = createWithdrawalRequest({ user, amount });
      toast({
        title: 'Заявка создана',
        description: `Комиссия ${formatRuble(request.feeAmount)} · к выдаче ${formatRuble(request.netAmount)}`,
      });
      setWithdrawAmount('');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать заявку';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-[#2A7F6E] to-[#17493f] p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm text-white/70">Текущий баланс кошелька</p>
            <h1 className="text-4xl font-bold">{formatRuble(user.walletBalance || 0)}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
              <p className="text-sm text-gray-500">Накоплено операций</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{transactions.filter((item) => item.type === 'credit').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5 text-red-600" />
              <p className="text-sm text-gray-500">Заявок на вывод</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{withdrawals.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Вывод средств</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <Label htmlFor="withdraw">Сумма</Label>
              <Input id="withdraw" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="mt-1" placeholder="1000" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleWithdraw} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                Создать заявку
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">Комиссия на вывод удерживается из суммы заявки. Деньги можно оставить в системе и потратить на другие товары.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">История кошелька</h2>
          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatRuble(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Пока нет операций.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
