import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Clock3, ImageOff, MapPin, PlayCircle, ShieldCheck, ShoppingCart, Truck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PriceDisplay } from '@/components/PriceDisplay';
import { ProgressBar } from '@/components/ProgressBar';
import { findProductFamily, getFamilyActiveSessions, getProductCoverImage, getProductImages, getSessionFillPercent, getSessionPriceTable, formatRuble } from '@/lib/mvp';
import { formatShoeSizeLabel, getProductShoeSizes, isFootwearCategory } from '@/lib/shoe-sizes';
import type { User } from '@/types';
import { useStore } from '@/stores/store';

interface ProductDetailProps {
  user: User | null;
}

export default function ProductDetail({ user }: ProductDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const [selectedShoeSizeId, setSelectedShoeSizeId] = useState('');
  const product = useMemo(() => findProductFamily(slug || ''), [slug]);
  const cart = useStore((state) => state.cart);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);

  useEffect(() => {
    setSelectedImage(0);
    setBrokenImages({});
  }, [slug]);

  const images = product ? getProductImages(product) : [];
  const activeSessions = product ? getFamilyActiveSessions(product.id) : [];
  const priceTable = activeSessions[0] ? getSessionPriceTable(activeSessions[0]) : [];
  const currentPrice = product ? (activeSessions[0]?.currentFloorPrice ?? product.basePrice) : 0;
  const originalPrice = product ? Math.max(product.basePrice, currentPrice + product.discountStep * 10) : 0;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.discountPrice ?? item.product.basePrice;
    return sum + itemPrice * item.quantity;
  }, 0);
  const footwearSizes = product ? getProductShoeSizes(product) : [];
  const isFootwear = product ? isFootwearCategory(product.category) : false;
  const selectedShoeSize = footwearSizes.find((size) => size.id === selectedShoeSizeId) || footwearSizes[0] || null;
  const activeCartItemId = product && isFootwear && selectedShoeSize ? `${product.id}__${selectedShoeSize.id}` : product ? `${product.id}__default` : '';
  const activeCartItem = cart.find((item) => activeCartItemId && (item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`) === activeCartItemId) || null;

  useEffect(() => {
    if (!isFootwear || footwearSizes.length === 0) {
      setSelectedShoeSizeId('');
      return;
    }

    if (!selectedShoeSizeId || !footwearSizes.some((size) => size.id === selectedShoeSizeId)) {
      setSelectedShoeSizeId(footwearSizes[0].id);
    }
  }, [footwearSizes, isFootwear, selectedShoeSizeId]);

  if (!product) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Товар не найден</div>;
  }

  const detailSpecs = [
    { label: 'Артикул', value: product?.id ? product.id.toUpperCase().replace(/-/g, ' ') : '—' },
    { label: 'Категория', value: product?.category || '—' },
    { label: 'Базовая цена', value: product ? formatRuble(product.basePrice) : '—' },
    { label: 'Скидка за слот', value: product ? `${product.discountStep}%` : '—' },
    { label: 'Макс. скидка', value: product ? `${product.maxDiscount}%` : '—' },
    { label: 'Состав', value: product?.specs?.['Состав'] || 'EVA' },
    { label: 'Сезон', value: product?.specs?.['Сезон'] || 'круглогодичный' },
    ...(isFootwear || !product
      ? []
      : [{ label: 'Доступные размеры', value: product.allowedSizes.join(', ') }]),
    { label: 'Доступные цвета', value: product?.allowedColors ? product.allowedColors.join(', ') : '—' },
    ...Object.entries(product?.specs || {}).map(([label, value]) => ({ label, value })),
  ].filter((item, index, items) => items.findIndex((candidate) => candidate.label === item.label) === index);
  const storeProduct = {
    id: product?.id || '',
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    basePrice: product?.basePrice || 0,
    discountPrice: currentPrice,
    images,
    category: product?.category || '',
    rating: product?.rating ?? 4.7,
    reviewsCount: product?.reviews ?? 0,
    inStock: product?.inStock ?? true,
    quantity: activeCartItem?.quantity ?? 0,
    specifications: product?.specs || {},
    sellerId: product?.sellerId || '',
    discountPerStep: product?.discountStep || 0,
    maxDiscountPercent: product?.maxDiscount || 0,
    sessionDuration: 24,
    categorySlug: product?.categorySlug ?? product?.category ?? '',
  };

  const isImageBroken = (index: number) => brokenImages[index] === true;
  const activeSession = activeSessions[0] || null;
  const sessionFillPercent = activeSession ? getSessionFillPercent(activeSession) : 0;
  const stockTotal = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  const isAvailable = stockTotal > 0;
  const trustFacts = [
    { icon: BadgeCheck, label: 'Проверенный товар', value: product.rating ? `${product.rating.toFixed(1)} / 5` : 'SIDRAT quality' },
    { icon: ShieldCheck, label: 'Доступность', value: isAvailable ? 'В наличии' : 'Нет в наличии' },
    { icon: Truck, label: 'Сессии', value: activeSessions.length > 0 ? `${activeSessions.length} активных` : 'Нет активных' },
    { icon: MapPin, label: 'Категория', value: product.category },
  ];
  const variantsSummary = {
    label: 'Вариантов',
    value: product.variants.length,
  };
  const nextSlotPrice = activeSession
    ? priceTable[activeSession.currentSlots]?.price ?? activeSession.currentFloorPrice
    : priceTable[0]?.price ?? product.basePrice;
  const priceSaving = Math.max(0, originalPrice - currentPrice);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-600 hover:text-[#2A7F6E]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад
      </button>

      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">{product.category}</p>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{product.name}</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Карточка товара в marketplace-формате: визуал, цена, варианты, доверие и быстрые действия для GB-сессии и корзины.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-gray-200 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <CardContent className="p-5">
              <div className="grid gap-4 lg:grid-cols-[96px_minmax(0,1fr)]">
                <div className="order-2 flex flex-row gap-3 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible">
                  {images.map((image, index) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImage(index)}
                      className={`group h-16 w-16 flex-none overflow-hidden rounded-2xl border-2 bg-white transition lg:h-20 lg:w-20 ${
                        selectedImage === index ? 'border-[#C5A059] ring-2 ring-[#C5A059]/20' : 'border-transparent hover:border-[#2A7F6E]/30'
                      }`}
                    >
                      {!isImageBroken(index) ? (
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [index]: true }))}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                          <ImageOff className="h-5 w-5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="order-1 overflow-hidden rounded-[28px] border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-[#C5A059]/10 lg:order-2">
                  <div className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[660px]">
                    <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-white/90 text-gray-700 shadow-sm">{product.category}</Badge>
                      <Badge className="rounded-full bg-[#2A7F6E] text-white shadow-sm">
                        {activeSessions.length > 0 ? 'Есть активные сессии' : 'Можно создать сессию'}
                      </Badge>
                    </div>
                    {!isImageBroken(selectedImage) ? (
                      <img
                        src={images[selectedImage] || images[0]}
                        alt={product.name}
                        className="absolute inset-0 h-full w-full object-cover object-center scale-[1.02]"
                        onError={() => setBrokenImages((prev) => ({ ...prev, [selectedImage]: true }))}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-gray-500">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
                          <ImageOff className="h-9 w-9 text-[#2A7F6E]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Изображение не загрузилось</p>
                          <p className="mt-1 text-sm">Показываем плейсхолдер, чтобы карточка не выглядела сломанной.</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur">
                      {selectedImage + 1} / {images.length}
                    </div>
                    <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Начальная цена</p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{formatRuble(originalPrice)}</p>
                        </div>
                        <div className="rounded-2xl bg-[#2A7F6E]/5 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-[#2A7F6E]">Цена сейчас</p>
                          <p className="mt-1 text-lg font-semibold text-[#17493f]">{formatRuble(currentPrice)}</p>
                        </div>
                        <div className="rounded-2xl bg-[#C5A059]/10 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-[#8b6a2f]">Следующий слот</p>
                          <p className="mt-1 text-lg font-semibold text-[#8b6a2f]">{formatRuble(nextSlotPrice)}</p>
                          <p className="mt-1 text-xs text-[#8b6a2f]">
                            Слот #{activeSession ? activeSession.currentSlots + 1 : 1}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Характеристики и описание</p>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">Данные товара</h2>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#C5A059]/15 px-4 py-3">
                  <span className="text-sm font-medium text-[#8b6a2f]">{variantsSummary.label}</span>
                  <span className="text-2xl font-semibold leading-none text-[#8b6a2f]">{variantsSummary.value}</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {!isFootwear
                  ? product.allowedSizes.slice(0, 4).map((size) => (
                      <span key={size} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {size}
                      </span>
                    ))
                  : null}
                {product.allowedColors.slice(0, 4).map((color) => (
                  <span key={color} className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-xs font-medium text-[#2A7F6E]">
                    {color}
                  </span>
                ))}
              </div>

              {isFootwear && footwearSizes.length > 0 ? (
                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-500">Выберите размер</p>
                    <span className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-xs font-medium text-[#2A7F6E]">
                      Таблица размеров
                    </span>
                  </div>
                  <Select value={selectedShoeSizeId} onValueChange={setSelectedShoeSizeId}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-300 bg-white text-sm shadow-sm focus:ring-[#2A7F6E]">
                      <SelectValue placeholder="Выберите размер" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {footwearSizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          <span className="flex w-full items-center justify-between gap-4">
                            <span className="font-medium text-gray-900">
                              {size.ru} RU / EU{size.eu}
                            </span>
                            <span className="text-[#2A7F6E]">{size.lengthCm} см</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {trustFacts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div key={fact.label} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="rounded-2xl bg-white p-2 text-[#2A7F6E] shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">{fact.label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{fact.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">Ключевые параметры</p>
                  <span className="text-xs text-gray-500">Горизонтальный формат</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {detailSpecs.slice(0, 8).map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="min-w-[180px] flex-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Описание</p>
                <p className="mt-2 leading-6 text-gray-700">{product.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="border-gray-200 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Цена сейчас</p>
                  <PriceDisplay originalPrice={originalPrice} discountedPrice={currentPrice} size="lg" className="mt-1" />
                </div>
                <div className="rounded-2xl bg-[#2A7F6E]/10 px-3 py-2 text-right">
                  <p className="text-xs text-[#2A7F6E]">Цена по слотам</p>
                  <p className="text-lg font-semibold text-[#17493f]">{product.discountStep}%</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="line-through">{formatRuble(originalPrice)}</span>
                <span>Макс. скидка {product.maxDiscount}%</span>
                <span className="rounded-full bg-[#C5A059]/15 px-2.5 py-1 text-xs font-medium text-[#8b6a2f]">
                  Экономия {formatRuble(priceSaving)}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Слоты</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {activeSession ? `${activeSession.currentSlots}/${activeSession.targetSlots}` : '—'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Статус</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {activeSession ? `${Math.round(sessionFillPercent)}%` : 'Нет сессии'}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">В корзине</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{activeCartItem ? activeCartItem.quantity : 0}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Заполнение активной сессии</span>
                  <span className="font-semibold text-gray-900">{activeSession ? `${Math.round(sessionFillPercent)}%` : '—'}</span>
                </div>
                <ProgressBar current={activeSession?.currentSlots || 0} target={activeSession?.targetSlots || 1} className="mt-3" />
                <p className="mt-3 text-sm text-gray-600">
                  Цена падает по мере занятия слотов, а возврат разницы считается автоматически.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#2A7F6E] text-[#2A7F6E] hover:bg-[#2A7F6E]/10"
                  onClick={() =>
                    addToCart(storeProduct, 1, {
                      selectedSizeId: selectedShoeSize?.id,
                      selectedSizeLabel: selectedShoeSize ? formatShoeSizeLabel(selectedShoeSize) : undefined,
                    })
                  }
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Добавить в корзину
                </Button>

                {activeCartItem ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-full border-[#2A7F6E] bg-[#2A7F6E]/5 text-[#2A7F6E] hover:bg-[#2A7F6E]/10"
                    onClick={() => navigate('/cart')}
                  >
                    В корзине: {activeCartItem.quantity}
                  </Button>
                ) : null}
              </div>

              {!user ? (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                  Чтобы создать сессию или присоединиться к слоту, войдите в систему.
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <a
                  href="#active-sessions"
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-center text-gray-700 transition hover:border-[#2A7F6E] hover:text-[#2A7F6E]"
                >
                  Активные сессии
                </a>
                <a
                  href="#slot-pricing"
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 text-center text-gray-700 transition hover:border-[#2A7F6E] hover:text-[#2A7F6E]"
                >
                  Цена по слотам
                </a>
              </div>

              <div className="mt-5 space-y-3">
                <Link to={`/session/create/${product.id}`} className="block">
                  <Button className="w-full rounded-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Создать GB-сессию
                  </Button>
                </Link>
                <Link to="/sessions" className="block">
                  <Button variant="outline" className="w-full rounded-full border-[#C5A059] text-[#2A7F6E] hover:bg-[#C5A059]/10">
                    Смотреть сессии
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Корзина</p>
                  <h2 className="mt-1 text-xl font-semibold text-gray-900">Быстрый обзор</h2>
                </div>
                <div className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-sm font-medium text-[#2A7F6E]">
                  {cartCount} шт.
                </div>
              </div>

              {cart.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {cart.slice(0, 3).map((item) => (
                    <div key={item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`} className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <img
                        src={getProductCoverImage(item.product)}
                        alt={item.product.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{item.product.name}</p>
                            {item.selectedSizeLabel ? (
                              <p className="text-xs text-[#2A7F6E]">{item.selectedSizeLabel}</p>
                            ) : null}
                            <p className="text-sm text-gray-600">
                              {item.quantity} × {formatRuble(item.product.discountPrice ?? item.product.basePrice)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id || `${item.product.id}__${item.selectedSizeId || 'default'}`)}
                            className="rounded-full p-2 text-gray-400 transition hover:bg-white hover:text-red-500"
                            aria-label={`Удалить ${item.product.name} из корзины`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cart.length > 3 ? (
                    <p className="text-sm text-gray-500">И ещё {cart.length - 3} товара в корзине.</p>
                  ) : null}

                  <div className="rounded-2xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Сумма</span>
                      <span className="font-semibold text-gray-900">{formatRuble(cartTotal)}</span>
                    </div>
                    <Link to="/cart" className="mt-4 block">
                      <Button className="w-full rounded-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                        Перейти в корзину
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  Корзина пустая. Добавьте товар, чтобы собрать заказ.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card id="active-sessions" className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Активные сессии</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">Что уже живо</h2>
              </div>
              <span className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-sm font-medium text-[#2A7F6E]">
                {activeSessions.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {activeSessions.length > 0 ? (
                activeSessions.map((session) => {
                  const fillPercent = Math.round(getSessionFillPercent(session));
                  return (
                    <Link
                      key={session.id}
                      to={`/session/${session.id}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#2A7F6E] hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{session.title}</p>
                          <p className="text-sm text-gray-600">
                            {session.currentSlots}/{session.targetSlots} слотов занято · {session.accessType === 'public' ? 'Открытая' : 'По ссылке'}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>{session.status}</div>
                          <div className="font-semibold text-[#2A7F6E]">{formatRuble(session.currentFloorPrice)}</div>
                        </div>
                      </div>
                      <ProgressBar current={session.currentSlots} target={session.targetSlots} className="mt-3" />
                      <p className="mt-3 text-xs text-gray-500">
                        Следующий слот меняет цену на {session.discountStepSnapshot}% с floor-ограничением.
                      </p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>Заполнено</span>
                        <span>{fillPercent}%</span>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                  Пока нет активных сессий.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card id="slot-pricing" className="border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#2A7F6E]" />
              <h2 className="text-xl font-semibold text-gray-900">Цена по слотам</h2>
            </div>
            <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
              <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-600">
                <span>Слот</span>
                <span>Цена</span>
              </div>
              {priceTable.length > 0 ? (
                priceTable.map((row) => (
                  <div key={row.slotNumber} className="grid grid-cols-2 border-b border-gray-100 px-4 py-3 text-sm last:border-0">
                    <span>#{row.slotNumber}</span>
                    <span className="font-medium">{formatRuble(row.price)}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">Создайте сессию, чтобы увидеть цену по слотам.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
