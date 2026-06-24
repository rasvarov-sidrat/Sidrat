import { type Dispatch, type SetStateAction, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock3, Layers3, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSession, findProductFamily } from '@/lib/mvp';
import type { User } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CreateSessionProps {
  user: User;
}

export default function CreateSession({ user }: CreateSessionProps) {
  const { familyId } = useParams<{ familyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const family = useMemo(() => findProductFamily(familyId || ''), [familyId]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<'public' | 'invite-link'>('public');
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  if (!family) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Семейство товара не найдено</div>;
  }

  const toggleValue = (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const handleCreate = () => {
    try {
      const session = createSession({
        familyId: family.id,
        creator: user,
        accessType,
        expiresInHours,
        allowedSizes: selectedSizes,
        allowedColors: selectedColors,
        title: title.trim() || `${family.name} GB-сессия`,
        description: description.trim() || family.description,
      });
      toast({
        title: 'Сессия создана',
        description: `GB-сессия ${session.title} готова к набору слотов.`,
      });
      navigate(`/session/${session.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось создать сессию';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Создание сессии</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{family.name}</h1>
        <p className="mt-2 text-gray-600">{family.description}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Layers3 className="h-5 w-5 text-[#2A7F6E]" />
            Правила сессии
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Название сессии</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="Например, Air Max family buy" />
            </div>
            <div>
              <Label htmlFor="description">Описание</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Краткое описание правил" />
            </div>
            <div>
              <Label>Доступ</Label>
              <div className="mt-2 flex gap-2">
              <Button type="button" variant={accessType === 'public' ? 'default' : 'outline'} onClick={() => setAccessType('public')}>Публичная</Button>
              <Button type="button" variant={accessType === 'invite-link' ? 'default' : 'outline'} onClick={() => setAccessType('invite-link')}>По ссылке</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="expires">Срок действия, часов</Label>
              <Input id="expires" type="number" min={1} value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-[#2A7F6E]" />
            Варианты
          </h2>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700">Размеры</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {family.allowedSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleValue(size, setSelectedSizes)}
                    className={`rounded-full border px-3 py-1 text-sm ${selectedSizes.includes(size) ? 'border-[#2A7F6E] bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'border-gray-200 text-gray-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Цвета</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {family.allowedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleValue(color, setSelectedColors)}
                    className={`rounded-full border px-3 py-1 text-sm ${selectedColors.includes(color) ? 'border-[#2A7F6E] bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'border-gray-200 text-gray-700'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Количество слотов рассчитывается по шагу скидки и максимальной скидке.
              </div>
              <div className="mt-2">
                <strong>{family.discountStep}%</strong> шаг, <strong>{family.maxDiscount}%</strong> потолок, {Math.floor(family.maxDiscount / family.discountStep) + 1} слотов.
              </div>
              <div className="mt-2 text-xs text-gray-500">Создатель: {user.name} · Роль: {user.role}</div>
            </div>

            <Button onClick={handleCreate} className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
              <Shield className="mr-2 h-4 w-4" />
              Создать GB-сессию
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
