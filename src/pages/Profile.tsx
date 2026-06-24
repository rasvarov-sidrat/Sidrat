import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Copy, UserCircle2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserOrders, getUserWalletTransactions, getUserWithdrawals, loadSessions, formatRuble, findUserByReferralCode } from '@/lib/mvp';
import type { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

export default function Profile({ user }: ProfileProps) {
  const { toast } = useToast();
  const orders = useMemo(() => getUserOrders(user.id), [user.id]);
  const walletTransactions = useMemo(() => getUserWalletTransactions(user.id), [user.id]);
  const withdrawals = useMemo(() => getUserWithdrawals(user.id), [user.id]);
  const sessions = useMemo(() => loadSessions(), []);
  const mySessions = sessions.filter((session) => session.createdBy === user.id || session.participants.some((participant) => participant.userId === user.id));
  const referralLink = `${window.location.origin}/register?ref=${encodeURIComponent(user.referralCode)}`;
  const inviter = useMemo(() => (user.referredBy ? findUserByReferralCode(user.referredBy) : null), [user.referredBy]);

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast({ title: 'Ссылка скопирована', description: 'Можно отправлять друзьям и участникам GB.' });
    } catch {
      toast({ title: 'Не удалось скопировать', description: referralLink, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="bg-gradient-to-br from-[#2A7F6E] to-[#17493f] p-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <UserCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <p className="text-white/80">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
                  <BadgeCheck className="h-4 w-4" />
                  {user.role}
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/10 p-5 text-right">
              <p className="text-sm text-white/70">Баланс кошелька</p>
              <p className="mt-1 text-4xl font-bold">{formatRuble(user.walletBalance || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Реферальная ссылка</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-900">1% reward для прямого реферера</h2>
            <p className="mt-2 text-sm text-gray-600">
              Поделитесь ссылкой. Когда приглашённый подтвердит заказ, reward получит именно прямой реферер.
            </p>
            {inviter ? <p className="mt-2 text-sm text-gray-500">Вас пригласил: <span className="font-medium text-gray-900">{inviter.name}</span></p> : null}
          </div>
          <div className="flex flex-col gap-3 md:w-[420px]">
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Ваш код</p>
              <p className="mt-1 font-mono text-sm text-gray-900">{user.referralCode}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">Ссылка</p>
              <p className="mt-1 break-all text-sm text-gray-900">{referralLink}</p>
            </div>
            <Button onClick={copyReferralLink} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
              <Copy className="mr-2 h-4 w-4" />
              Скопировать ссылку
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="wallet">Кошелёк</TabsTrigger>
          <TabsTrigger value="sessions">Сессии</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4 space-y-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-[#2A7F6E]">{order.id}</p>
                      <p className="mt-1 text-gray-900">{order.familyName}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">{order.status}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{order.variantLabel}</span>
                    <span className="text-lg font-semibold text-gray-900">{formatRuble(order.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">Пока нет заказов</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="wallet" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-[#2A7F6E]" />
                <div>
                  <p className="text-sm text-gray-500">Текущий кошелёк</p>
                  <p className="text-2xl font-bold text-gray-900">{formatRuble(user.walletBalance || 0)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Эти деньги можно потратить на другие покупки или вывести с комиссией через страницу кошелька.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Заявки на вывод</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{withdrawals.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Операции кошелька</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{walletTransactions.length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4 space-y-4">
          {mySessions.length > 0 ? (
            mySessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{session.title}</p>
                      <p className="text-sm text-gray-500">{session.currentSlots}/{session.targetSlots} слотов</p>
                    </div>
                    <Link to={`/session/${session.id}`}>
                      <Button variant="outline">Открыть</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">Активных сессий нет</CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
