import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock3, Copy, Layers3, MessageCircle, Send, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  findProductFamily,
  findPendingSessionOrder,
  findSession,
  formatRuble,
  getSessionFillPercent,
  getSessionPriceOverview,
  getSessionPriceTable,
  getSessionVariantOptions,
  joinSession,
  getProductCoverImage,
} from '@/lib/mvp';
import type { User } from '@/types';

interface SessionDetailProps {
  user: User | null;
}

function getSessionStatusLabel(status: string) {
  switch (status) {
    case 'active':
      return 'Активна';
    case 'completed':
      return 'Завершена';
    case 'expired':
      return 'Истекла';
    case 'cancelled':
      return 'Отменена';
    case 'draft':
      return 'Черновик';
    default:
      return status;
  }
}

function getSessionStatusHint(status: string) {
  switch (status) {
    case 'active':
      return 'Можно занять слот прямо сейчас.';
    case 'completed':
      return 'Все слоты уже закрыты, но состав участников и финальная цена видны сразу.';
    case 'expired':
      return 'Сессия закрылась по времени.';
    case 'cancelled':
      return 'Сессия остановлена продавцом.';
    case 'draft':
      return 'Сессия ещё на настройке.';
    default:
      return 'Статус сессии обновляется автоматически.';
  }
}

function formatSessionDate(value: string) {
  const date = new Date(value);
  const pad = (num: number) => String(num).padStart(2, '0');

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}  ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getPriceTextStyle(value: number) {
  const length = formatRuble(value).length;
  let fontSize = 14;

  if (length >= 10) {
    fontSize = 11;
  } else if (length >= 9) {
    fontSize = 12;
  } else if (length >= 8) {
    fontSize = 13;
  }

  return {
    fontSize: `${fontSize}px`,
    lineHeight: 1,
    whiteSpace: 'nowrap' as const,
  };
}

export default function SessionDetail({ user }: SessionDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const session = useMemo(() => findSession(id || ''), [id]);
  const family = useMemo(() => (session ? findProductFamily(session.familyId) : null), [session]);

  if (!session || !family) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Сессия не найдена</p>
          <Link to="/sessions">
            <Button className="mt-4">К списку сессий</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const variantOptions = getSessionVariantOptions(session);
  const priceTable = getSessionPriceTable(session);
  const priceOverview = getSessionPriceOverview(session);
  const currentVariant = variantOptions.find((variant) => variant.id === selectedVariantId) || variantOptions[0];
  const progressPercent = getSessionFillPercent(session);
  const remainingSlots = Math.max(0, session.targetSlots - session.currentSlots);
  const currentParticipantPreview = session.participants.slice(0, 3);
  const statusLabel = getSessionStatusLabel(session.status);
  const statusHint = getSessionStatusHint(session.status);
  const currentPriceDelta = Math.max(0, session.basePriceSnapshot - session.currentFloorPrice);
  const shareUrl = `${window.location.origin}/session/${session.id}`;
  const shareText = `Посмотри GB-сессию SIDRAT: ${session.title} · ${family.name}`;
  const shareMessage = `${shareText}\n${shareUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const pendingOrder = user ? findPendingSessionOrder(user.id, session.id) : null;
  const pendingParticipation = pendingOrder ? session.participants.find((participant) => participant.id === pendingOrder.participationId) || null : null;
  const pendingStepLabel = pendingParticipation ? `Незавершённая оплата: слот #${pendingParticipation.slotNumber}` : 'Незавершённая оплата';

  useEffect(() => {
    if (!variantOptions.length) {
      return;
    }

    const participantVariantId = user
      ? session.participants.find((participant) => participant.userId === user.id)?.variantId
      : '';
    const preferredVariantId = participantVariantId && variantOptions.some((variant) => variant.id === participantVariantId)
      ? participantVariantId
      : variantOptions[0].id;

    if (!selectedVariantId || !variantOptions.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(preferredVariantId);
    }
  }, [session.id, session.participants, selectedVariantId, user, variantOptions]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Ссылка скопирована' });
    setTimeout(() => setCopied(false), 1500);
  };

  const handleJoin = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/session/${session.id}` } } });
      return;
    }
    if (pendingOrder) {
      navigate(`/checkout/${pendingOrder.id}`);
      return;
    }
    if (!currentVariant) {
      toast({ title: 'Вариант не выбран', description: 'Выберите size/color вариант', variant: 'destructive' });
      return;
    }
    if (session.status !== 'active') {
      toast({ title: 'Сессия недоступна', description: statusHint, variant: 'destructive' });
      return;
    }

    try {
      const result = joinSession({
        sessionId: session.id,
        user,
        variantId: currentVariant.id,
        walletSpend: 0,
      });
      toast({
        title: 'Слот занят',
        description: `Оплачено ${formatRuble(result.participation.pricePaid)}. ${result.refundDelta > 0 ? `Возврат в кошелёк: ${formatRuble(result.refundDelta)}` : 'Без возврата.'}`,
      });
      navigate(`/checkout/${result.order.id}`);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'pending_payment' && pendingOrder) {
        navigate(`/checkout/${pendingOrder.id}`);
        return;
      }
      const message = error instanceof Error ? error.message : 'Не удалось присоединиться';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const nextSlotNumber = pendingParticipation ? pendingParticipation.slotNumber : session.currentSlots + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full bg-gray-100 text-gray-700">
            {family.category}
          </Badge>
          <Badge className="rounded-full bg-[#2A7F6E] text-white">
            {statusLabel}
          </Badge>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#C5A059]/15 px-3 py-1 text-sm text-[#8b6a2f]">
            <Layers3 className="h-3.5 w-3.5" />
            Детали сессии
          </span>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl lg:pt-3">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{family.name}</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? 'Скопировано' : 'Поделиться'}
            </Button>
            <Button
              className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]"
              onClick={handleJoin}
              disabled={!pendingOrder && (session.status !== 'active' || !variantOptions.length)}
            >
              <Users className="mr-2 h-4 w-4" />
              {pendingOrder ? 'Продолжить оплату' : user ? 'Занять слот' : 'Войти и занять слот'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
        <Card className="overflow-hidden">
          <CardContent className="grid gap-0 p-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-gray-50 via-white to-[#C5A059]/10">
              <img src={getProductCoverImage(family)} alt={family.name} className="h-full min-h-[260px] w-full object-cover" />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="rounded-full bg-white/90 text-gray-700 shadow-sm">
                  {family.name}
                </Badge>
                <Badge className="rounded-full bg-[#2A7F6E] text-white shadow-sm">
                  {session.accessType === 'public' ? 'Открытая сессия' : 'Доступ по ссылке'}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="grid items-stretch gap-0 sm:grid-cols-3 sm:divide-x sm:divide-gray-300/40">
                  <div className="flex h-full flex-col justify-center sm:pr-4">
                    <p className="text-[10px] uppercase tracking-tight text-gray-500 whitespace-nowrap">Начальная цена</p>
                    <p className="mt-1 font-bold text-gray-900" style={getPriceTextStyle(priceOverview.initialPrice)}>
                      {formatRuble(priceOverview.initialPrice)}
                    </p>
                  </div>
                  <div className="flex h-full flex-col justify-center sm:px-4">
                    <p className="text-[10px] uppercase tracking-tight text-gray-500 whitespace-nowrap">Сейчас</p>
                    <p className="mt-1 font-bold text-gray-900" style={getPriceTextStyle(priceOverview.currentPrice)}>
                      {formatRuble(priceOverview.currentPrice)}
                    </p>
                  </div>
                  <div className="flex h-full flex-col justify-center sm:pl-4 sm:text-right">
                    <p className="text-[10px] uppercase tracking-tight text-[#8b6a2f] whitespace-nowrap">Следующий слот</p>
                    <p className="mt-1 font-bold text-[#C5A059]" style={getPriceTextStyle(priceOverview.nextPrice)}>
                      {formatRuble(priceOverview.nextPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Слоты</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {session.currentSlots}/{session.targetSlots}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Доступно</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{remainingSlots}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Экономия</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatRuble(currentPriceDelta)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-4 w-4" />
                    Истекает {formatSessionDate(session.expiresAt)}
                  </span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#2A7F6E]" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Цена меняется слот за слотом, а возврат из-за снижения цены считается автоматически.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link to={`/product/${family.slug}`} className="block">
                  <Button variant="outline" className="w-full border-[#C5A059] text-[#2A7F6E] hover:bg-[#C5A059]/10">
                    Открыть карточку товара
                  </Button>
                </Link>
                <Button variant="outline" onClick={copyLink} className="w-full">
                  Копировать ссылку
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button asChild variant="outline" className="w-full border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10">
                  <a href={whatsappShareUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10">
                  <a href={telegramShareUrl} target="_blank" rel="noreferrer">
                    <Send className="mr-2 h-4 w-4" />
                    Telegram
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Готовность к действию</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Занять слот</h2>
              </div>
              <div className="rounded-2xl bg-[#2A7F6E]/10 px-3 py-2 text-right">
                <p className="text-xs text-[#2A7F6E]">Текущая цена</p>
                <p className="text-lg font-semibold text-[#17493f]">{formatRuble(session.currentFloorPrice)}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Выбор варианта</p>
              <Select value={selectedVariantId || currentVariant?.id || ''} onValueChange={setSelectedVariantId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Выберите вариант" />
                </SelectTrigger>
                <SelectContent>
                  {variantOptions.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.size} / {variant.color} · осталось {variant.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-gray-500">
                Доступные варианты: {session.allowedSizes.join(', ')} · {session.allowedColors.join(', ')}
              </p>
            </div>

            {pendingOrder ? (
              <div className="rounded-2xl border border-[#C5A059]/25 bg-[#C5A059]/10 p-4 text-sm text-[#6f541b]">
                <p className="font-medium">Слот уже забронирован, но оплата не завершена.</p>
                <p className="mt-1">
                  {pendingStepLabel}. Открой checkout и заверши оплату, прежде чем занимать следующий слот.
                </p>
              </div>
            ) : null}

            {!user ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Войдите, чтобы быстрее перейти к оплате после выбора слота.
              </div>
            ) : null}

            <div className="rounded-2xl bg-[#2A7F6E]/5 p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Что произойдёт дальше</p>
              <p className="mt-2">
                Нажмите на слот ниже, слот бронируется, создаётся заказ, и вы сразу попадаете на checkout с реальным `orderId`.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#2A7F6E]/15">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Все слоты товара</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Занять слот с оплатой</h2>
            </div>
            <div className="rounded-full bg-[#C5A059]/15 px-3 py-1 text-xs font-medium text-[#8b6a2f]">
              Следующий #{nextSlotNumber}
            </div>
          </div>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {priceTable.map((row) => {
              const isFilled = row.slotNumber <= session.currentSlots && !pendingParticipation;
              const isReserved = pendingParticipation?.slotNumber === row.slotNumber;
              const isNext = !pendingParticipation && row.slotNumber === nextSlotNumber;
              return (
                <div
                  key={row.slotNumber}
                  className={`min-w-[240px] flex-none rounded-2xl border p-4 ${
                    isReserved ? 'border-[#2A7F6E] bg-[#2A7F6E]/5' : isNext ? 'border-[#2A7F6E] bg-[#2A7F6E]/5' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Слот #{row.slotNumber}</p>
                      <p className={`text-xs ${isFilled ? 'text-gray-500' : 'text-[#8b6a2f]'}`}>
                        {isReserved ? 'Ожидает оплату' : isFilled ? 'Уже занят' : isNext ? 'Доступен сейчас' : 'Откроется позже'}
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${isFilled ? 'text-gray-700' : 'text-[#C5A059]'}`}>
                      {formatRuble(row.price)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className={`mt-4 w-full ${
                      isReserved || (isNext && session.status === 'active')
                        ? 'bg-[#2A7F6E] text-white hover:bg-[#236b5d]'
                        : 'bg-gray-200 text-gray-500 hover:bg-gray-200'
                    }`}
                    onClick={handleJoin}
                    disabled={pendingOrder ? !isReserved : session.status !== 'active' || !isNext}
                  >
                    {isReserved ? 'Продолжить оплату' : isFilled ? 'Занято' : isNext ? 'Занять и оплатить' : pendingParticipation ? 'Заблокировано' : 'Недоступно'}
                  </Button>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm" className="w-full border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10">
                      <a href={whatsappShareUrl} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="w-full border-[#229ED9] text-[#229ED9] hover:bg-[#229ED9]/10">
                      <a href={telegramShareUrl} target="_blank" rel="noreferrer">
                        <Send className="mr-2 h-4 w-4" />
                        Telegram
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Товар</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Короткое резюме</h2>
              </div>
              <span className="rounded-full bg-[#C5A059]/15 px-3 py-1 text-sm font-medium text-[#8b6a2f]">
                {family.variants.length} вариантов
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <img src={getProductCoverImage(family)} alt={family.name} className="h-40 w-full rounded-2xl object-cover" />
              <div className="space-y-4">
                <p className="leading-6 text-gray-700">{family.description}</p>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Шаг</p>
                    <p className="font-semibold text-gray-900">{family.discountStep}%</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Потолок</p>
                    <p className="font-semibold text-gray-900">{family.maxDiscount}%</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Размеры</p>
                    <p className="font-semibold text-gray-900">{session.allowedSizes.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Доступные цвета</p>
                <p className="mt-1 font-medium text-gray-900">{session.allowedColors.join(', ')}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-[#8b6a2f]">Следующий слот</p>
                <p className="mt-1 font-medium text-[#C5A059]">{formatRuble(priceOverview.nextPrice)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Социальное доказательство</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Участники</h2>
              </div>
              <span className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-sm font-medium text-[#2A7F6E]">
                {session.participants.length}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {currentParticipantPreview.map((participant) => (
                <div key={participant.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{participant.userName}</p>
                      <p className="text-sm text-gray-500">
                        Слот #{participant.slotNumber} · {participant.size} / {participant.color}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-700">{formatRuble(participant.pricePaid)}</span>
                  </div>
                </div>
              ))}
              {session.participants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
                  Пока никто не занял слот. Это шанс войти первым.
                </div>
              ) : null}
              {session.participants.length > currentParticipantPreview.length ? (
                <details className="rounded-2xl border border-gray-200 bg-white">
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-[#2A7F6E]">
                    Показать всех участников ({session.participants.length})
                  </summary>
                  <div className="space-y-3 border-t border-gray-200 p-4">
                    {session.participants.slice(currentParticipantPreview.length).map((participant) => (
                      <div key={participant.id} className="rounded-2xl bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900">{participant.userName}</p>
                            <p className="text-sm text-gray-500">
                              Слот #{participant.slotNumber} · {participant.size} / {participant.color}
                            </p>
                          </div>
                          <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-700">
                            {formatRuble(participant.pricePaid)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <details className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Цена по слотам</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">Лестница цен</h2>
            </div>
            <span className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-sm font-medium text-[#2A7F6E]">
              {priceTable.length} уровней
            </span>
          </div>
        </summary>
        <div className="border-t border-gray-200 p-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
              <span>Слот</span>
              <span>Цена</span>
            </div>
            {priceTable.map((row) => (
              <div
                key={row.slotNumber}
                className={`grid grid-cols-2 border-b border-gray-100 px-4 py-3 text-sm last:border-0 ${
                  row.slotNumber === session.currentSlots ? 'bg-[#2A7F6E]/5' : ''
                }`}
              >
                <span>#{row.slotNumber}</span>
                <span className="font-medium">{formatRuble(row.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      {session.status === 'completed' ? (
        <div className="rounded-2xl border border-[#2A7F6E]/20 bg-[#2A7F6E]/5 p-5 text-[#17493f]">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5" />
            Сессия завершена
          </div>
          <p className="mt-2 text-sm">Все слоты заняты. Заказы готовы к оформлению и фулфилменту.</p>
        </div>
      ) : null}
    </div>
  );
}
