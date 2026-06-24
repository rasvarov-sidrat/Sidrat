import { useState } from 'react';
import { Clock3, BadgeDollarSign, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { approveWithdrawalRequest, formatRuble, loadSessions, loadWithdrawals, updateSessionDeadline } from '@/lib/mvp';
import type { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { toast } = useToast();
  const sessions = loadSessions();
  const withdrawals = loadWithdrawals();
  const [deadlineDraft, setDeadlineDraft] = useState<Record<string, string>>({});

  const handleApprove = (requestId: string) => {
    try {
      approveWithdrawalRequest(requestId, user);
      toast({ title: 'Заявка одобрена' });
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось одобрить';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const handleDeadlineSave = (sessionId: string) => {
    const nextValue = deadlineDraft[sessionId];
    if (!nextValue) return;
    try {
      updateSessionDeadline(sessionId, new Date(nextValue).toISOString());
      toast({ title: 'Дедлайн обновлён' });
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить дедлайн';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Панель админа</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Контроль сессий и выплат</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Сессии</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{sessions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Заявки на вывод</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{withdrawals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Роль</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{user.role}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-[#2A7F6E]" />
            <h2 className="text-lg font-semibold text-gray-900">Заявки на вывод</h2>
          </div>
          <div className="space-y-3">
            {withdrawals.length > 0 ? withdrawals.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{request.id}</p>
                  <p className="text-sm text-gray-600">
                    {formatRuble(request.amount)} · fee {formatRuble(request.feeAmount)} · net {formatRuble(request.netAmount)} · {request.status}
                  </p>
                </div>
                  <Button onClick={() => handleApprove(request.id)} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Одобрить
                </Button>
              </div>
            )) : (
              <p className="text-sm text-gray-500">Заявок на вывод нет.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-[#2A7F6E]" />
            <h2 className="text-lg font-semibold text-gray-900">Обновление дедлайна сессии</h2>
          </div>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="grid gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <div>
                  <p className="font-medium text-gray-900">{session.title}</p>
                  <p className="text-sm text-gray-500">{session.id}</p>
                </div>
                <div>
                  <Label htmlFor={`deadline-${session.id}`}>Истекает</Label>
                  <Input
                    id={`deadline-${session.id}`}
                    type="datetime-local"
                    value={deadlineDraft[session.id] || new Date(session.expiresAt).toISOString().slice(0, 16)}
                    onChange={(event) => setDeadlineDraft((current) => ({ ...current, [session.id]: event.target.value }))}
                    className="mt-1"
                  />
                </div>
                  <Button onClick={() => handleDeadlineSave(session.id)} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                  Сохранить
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-[#2A7F6E]/20 bg-[#2A7F6E]/5 p-4 text-sm text-[#17493f]">
        Админ может менять дедлайны и одобрять вывод средств. Этого достаточно для MVP-операций.
      </div>
    </div>
  );
}
