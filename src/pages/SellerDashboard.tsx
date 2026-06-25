import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  BarChart3,
  Box,
  Boxes,
  Building2,
  Globe2,
  Layers3,
  MapPin,
  PlusCircle,
  RefreshCw,
  Save,
  ShoppingCart,
  Target,
  TrendingUp,
  Truck,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { catalogCategories, getCatalogCategory, getCatalogGroup } from '@/lib/catalog';
import { formatRuble } from '@/lib/mvp';
import {
  formatShoeSizeLabel,
  getLegacyShoeSizesFromIds,
  getShoeSizeIdsFromLegacySizes,
  isFootwearCategory,
  SHOE_SIZE_OPTIONS,
} from '@/lib/shoe-sizes';
import {
  archiveSellerProduct,
  buildSellerDashboardSnapshot,
  createEmptySellerProductDraft,
  createSellerProduct,
  draftFromProduct,
  parseCommaList,
  type SellerProductDraft,
  validateSellerProductDraft,
} from '@/lib/seller';
import { getProductImageOptions } from '@/lib/image-manifest';
import type { User } from '@/types';

interface SellerDashboardProps {
  user: User;
}

type SellerTab = 'overview' | 'products' | 'revenue' | 'costs' | 'analytics';

function metricCard(label: string, value: string, icon: ComponentType<{ className?: string }>, hint?: string) {
  const Icon = icon;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
          </div>
          <span className="rounded-2xl bg-[#2A7F6E]/10 p-3 text-[#2A7F6E]">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function moneyBar(value: number, maxValue: number) {
  const width = maxValue > 0 ? Math.max(6, (value / maxValue) * 100) : 6;
  return <div className="h-2 rounded-full bg-[#2A7F6E]" style={{ width: `${width}%` }} />;
}

export default function SellerDashboard({ user }: SellerDashboardProps) {
  const { toast } = useToast();
  const isAdmin = user.role === 'admin';
  const [tab, setTab] = useState<SellerTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string>('new');
  const [draft, setDraft] = useState<SellerProductDraft>(() => createEmptySellerProductDraft());

  const snapshot = useMemo(() => buildSellerDashboardSnapshot(user), [user, refreshKey]);
  const selectedProduct = snapshot.products.find((product) => product.id === selectedProductId) || null;
  const isCreatingProduct = selectedProductId === 'new';
  const electronicsCategory = getCatalogCategory('electronics');
  const selectedSection = draft.category === 'electronics' ? getCatalogGroup('electronics', draft.catalogSectionSlug) : null;
  const draftValidation = useMemo(() => validateSellerProductDraft(draft), [draft]);
  const selectedFootwearSizeIds = draft.shoeSizeIds.length > 0 ? draft.shoeSizeIds : getShoeSizeIdsFromLegacySizes(draft.allowedSizes);
  const selectedFootwearSizeSet = new Set(selectedFootwearSizeIds);
  const imageOptions = useMemo(
    () => getProductImageOptions(draft.slug || selectedProduct?.slug || undefined),
    [draft.slug, selectedProduct?.slug],
  );

  useEffect(() => {
    if (selectedProductId !== 'new' && !snapshot.products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(snapshot.products[0]?.id ?? 'new');
      return;
    }

    if (selectedProduct) {
      setDraft(draftFromProduct(selectedProduct));
    } else {
      setDraft(createEmptySellerProductDraft());
    }
  }, [selectedProduct, selectedProductId, snapshot.products]);

  const updateDraft = (patch: Partial<SellerProductDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const updateVariant = (index: number, patch: Partial<SellerProductDraft['variants'][number]>) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (variantIndex === index ? { ...variant, ...patch } : variant)),
    }));
  };

  const updateFootwearSizes = (nextSizeIds: string[]) => {
    const uniqueIds = Array.from(new Set(nextSizeIds));
    setDraft((current) => ({
      ...current,
      shoeSizeIds: uniqueIds,
      allowedSizes: getLegacyShoeSizesFromIds(uniqueIds),
    }));
  };

  const addVariant = () => {
    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          size: 'One size',
          color: 'Default',
          sku: '',
          stock: 0,
          image: current.image,
          isAllowedInGb: true,
        },
      ],
    }));
  };

  const removeVariant = (index: number) => {
    setDraft((current) => ({
      ...current,
      variants: current.variants.length > 1 ? current.variants.filter((_, variantIndex) => variantIndex !== index) : current.variants,
    }));
  };

  const resetToNewProduct = () => {
    setSelectedProductId('new');
    setDraft(createEmptySellerProductDraft());
    setTab('products');
  };

  const handleSaveProduct = () => {
    if (draftValidation.errors.length > 0) {
      toast({
        title: 'Заполните обязательные поля',
        description: draftValidation.errors.join(' · '),
        variant: 'destructive',
      });
      return;
    }

    try {
      const saved = createSellerProduct(user, draft, selectedProduct?.id);
      setSelectedProductId(saved.id);
      setRefreshKey((value) => value + 1);
      toast({
        title: selectedProduct ? 'Товар обновлён' : 'Товар создан',
        description: `${saved.name} теперь доступен в seller panel.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось сохранить товар';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const handleArchiveProduct = () => {
    if (!selectedProduct) return;
    try {
      archiveSellerProduct(selectedProduct.id);
      setRefreshKey((value) => value + 1);
      toast({ title: 'Товар архивирован', description: selectedProduct.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось архивировать товар';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const categoryBreakdownMax = Math.max(...snapshot.categoryBreakdown.map((item) => item.revenue), 1);
  const revenueSeriesMax = Math.max(...snapshot.revenueSeries.map((item) => item.grossRevenue), 1);
  const topGeoMax = Math.max(...snapshot.geoStats.map((item) => item.revenue), 1);
  const topProductStats = [...snapshot.productPerformance].sort((a, b) => b.revenue - a.revenue);
  const lowStockProducts = snapshot.lowStockProducts.slice(0, 5);
  const categoryOptions = catalogCategories.filter((item) => item.id !== 'all');
  const categoryPreview =
    draft.category === 'electronics'
      ? [draft.category, draft.catalogSectionSlug, draft.catalogItemSlug].filter(Boolean).join(' / ')
      : draft.category;
  const requiredFieldsHint = isCreatingProduct
    ? 'Для первого релиза нужны: название, категория, цена, изображение и хотя бы один вариант.'
    : 'Можно менять любой параметр и сохранять без смены товара.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Панель продавца</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Revenue, costs, products</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Полный локальный seller shell: товары, себестоимость, выручка, география и базовые KPI без backend.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={resetToNewProduct}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Новый товар
          </Button>
          <Link to="/catalog">
            <Button className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Открыть каталог
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCard('Выручка', formatRuble(snapshot.summary.grossRevenue), TrendingUp, 'Признанные заказы и buyouts')}
        {metricCard('Нетто', formatRuble(snapshot.summary.netRevenue), Wallet, 'После оценки cost model')}
        {metricCard('Заказы', String(snapshot.summary.orderCount), ShoppingCart, `Buyouts: ${snapshot.summary.buyoutCount}`)}
        {metricCard('Баланс', formatRuble(snapshot.summary.walletBalance), Wallet, isAdmin ? 'Админ видит свой wallet' : 'Личный кошелёк')}
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SellerTab)} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 md:grid-cols-5">
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="products">Товары</TabsTrigger>
          <TabsTrigger value="revenue">Выручка</TabsTrigger>
          <TabsTrigger value="costs">Себестоимость</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">14-day revenue</p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-900">Серии выручки</h2>
                  </div>
                  <Badge variant="secondary">Orders: {snapshot.summary.orderCount}</Badge>
                </div>

                <div className="space-y-3">
                  {snapshot.revenueSeries.map((point) => (
                    <div key={point.label} className="grid grid-cols-[72px_minmax(0,1fr)_72px] items-center gap-3">
                      <span className="text-xs text-gray-500">{point.label}</span>
                      <div className="h-2 rounded-full bg-gray-100">
                        {moneyBar(point.grossRevenue, revenueSeriesMax)}
                      </div>
                      <div className="text-right text-sm font-medium text-gray-900">{formatRuble(point.grossRevenue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">География</h2>
                </div>
                <div className="space-y-3">
                  {snapshot.geoStats.slice(0, 5).map((item) => (
                    <div key={`${item.city}-${item.country}`} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-900">{item.city}</span>
                        <span className="text-gray-500">{item.orders} заказов</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        {moneyBar(item.revenue, topGeoMax)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {item.region} · {item.country} · {formatRuble(item.revenue)}
                      </p>
                    </div>
                  ))}
                  {snapshot.geoStats.length === 0 ? <p className="text-sm text-gray-500">Пока нет продаж с адресами доставки.</p> : null}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Ключевые KPI</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Средний чек</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{formatRuble(snapshot.summary.averageOrderValue)}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Fill rate</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{Math.round(snapshot.summary.conversionRate * 100)}%</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Активных товаров</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{snapshot.summary.activeProducts}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Активных сессий</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">{snapshot.summary.activeSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Box className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Низкий запас</h2>
                </div>
                <div className="space-y-3">
                  {lowStockProducts.map((product) => {
                    const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
                    return (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.category} · {totalStock} шт.</p>
                        </div>
                        <Badge variant="destructive">Low stock</Badge>
                      </div>
                    );
                  })}
                  {lowStockProducts.length === 0 ? <p className="text-sm text-gray-500">Запасы в норме.</p> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card>
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Каталог селлера</p>
                    <h2 className="text-lg font-semibold text-gray-900">Товары</h2>
                  </div>
                  <Badge variant="secondary">{snapshot.products.length}</Badge>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={resetToNewProduct}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedProductId === 'new' ? 'border-[#2A7F6E] bg-[#2A7F6E]/5' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">Новый товар</p>
                        <p className="text-sm text-gray-500">Создать семейство с нуля</p>
                      </div>
                      <PlusCircle className="h-5 w-5 text-[#2A7F6E]" />
                    </div>
                  </button>

                  {snapshot.products.map((product) => {
                    const performance = snapshot.productPerformance.find((item) => item.product.id === product.id);
                    const selected = selectedProductId === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selected ? 'border-[#2A7F6E] bg-[#2A7F6E]/5' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{formatRuble(product.basePrice)} · {product.category}</p>
                          </div>
                          <Badge variant={product.active ? 'default' : 'secondary'}>{product.active ? 'active' : 'archived'}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span>{performance?.orders ?? 0} orders</span>
                          <span>•</span>
                          <span>{performance?.activeSessions ?? 0} sessions</span>
                          <span>•</span>
                          <span>{performance?.lowStock ? 'low stock' : 'ok'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">
                      {isCreatingProduct ? 'Создание товара' : 'Редактирование товара'}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-gray-900">{isCreatingProduct ? 'Новый товар' : selectedProduct?.name || 'Товар'}</h2>
                    <p className="mt-2 text-sm text-gray-500">Категория: {categoryPreview || 'n/a'}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedProduct ? (
                      <Button variant="outline" size="sm" onClick={handleArchiveProduct}>
                        <Archive className="mr-2 h-4 w-4" />
                        Архивировать
                      </Button>
                    ) : null}
                    <Button size="sm" onClick={handleSaveProduct}>
                      <Save className="mr-2 h-4 w-4" />
                      {isCreatingProduct ? 'Создать товар' : 'Сохранить изменения'}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#C5A059]/25 bg-[#C5A059]/10 p-4 text-sm text-[#6d4f19]">
                  <p className="font-medium text-[#7a5a19]">Что нужно для первого релиза</p>
                  <p className="mt-1">{requiredFieldsHint}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seller-name">Название</Label>
                    <Input id="seller-name" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} placeholder="Air Max 2024" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-slug">Slug</Label>
                    <Input id="seller-slug" value={draft.slug} onChange={(event) => updateDraft({ slug: event.target.value })} placeholder="air-max-2024" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="seller-description">Описание</Label>
                    <textarea
                      id="seller-description"
                      value={draft.description}
                      onChange={(event) => updateDraft({ description: event.target.value })}
                      rows={4}
                      className="min-h-[96px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#2A7F6E] focus:ring-2 focus:ring-[#2A7F6E]/20"
                      placeholder="Что это за товар и в чём его сильная сторона"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select
                      value={draft.category}
                      onValueChange={(value) =>
                        updateDraft({
                          category: value as SellerProductDraft['category'],
                          catalogSectionSlug: value === 'electronics' ? draft.catalogSectionSlug || electronicsCategory?.groups[0]?.slug || '' : '',
                          catalogItemSlug: value === 'electronics' ? draft.catalogItemSlug : '',
                          shoeSizeIds: value === 'footwear' ? selectedFootwearSizeIds : [],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {draft.category === 'electronics' ? (
                    <>
                      <div className="space-y-2">
                        <Label>Раздел</Label>
                        <Select
                          value={draft.catalogSectionSlug}
                          onValueChange={(value) =>
                            updateDraft({
                              catalogSectionSlug: value,
                              catalogItemSlug: '',
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите раздел" />
                          </SelectTrigger>
                          <SelectContent>
                            {electronicsCategory?.groups.map((group) => (
                              <SelectItem key={group.slug} value={group.slug}>
                                {group.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Подраздел</Label>
                        <Select
                          value={draft.catalogItemSlug || '__all__'}
                          onValueChange={(value) => updateDraft({ catalogItemSlug: value === '__all__' ? '' : value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Можно оставить пустым" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__all__">Все элементы</SelectItem>
                            {selectedSection?.items.map((item) => (
                              <SelectItem key={item.slug} value={item.slug}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : null}

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="seller-image">Главное изображение</Label>
                      <Select
                        value={draft.image || '__none__'}
                        onValueChange={(value) => updateDraft({ image: value === '__none__' ? '' : value })}
                      >
                        <SelectTrigger id="seller-image">
                          <SelectValue placeholder="Выберите локальный файл" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Не выбрано</SelectItem>
                          {imageOptions.map((option) => (
                            <SelectItem key={option.src} value={option.src}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Галерея из локальных ассетов</Label>
                      <p className="text-xs text-gray-500">Кликни по карточке, чтобы добавить или убрать изображение из галереи.</p>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {imageOptions.map((option) => {
                          const selected = draft.images.includes(option.src);
                          return (
                            <button
                              key={option.src}
                              type="button"
                              onClick={() =>
                                updateDraft({
                                  images: selected
                                    ? draft.images.filter((src) => src !== option.src)
                                    : [...draft.images, option.src],
                                })
                              }
                              className={`overflow-hidden rounded-2xl border text-left transition ${
                                selected
                                  ? 'border-[#2A7F6E] bg-[#2A7F6E]/5 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-[#2A7F6E]/40 hover:bg-gray-50'
                              }`}
                            >
                              <img src={option.src} alt={option.label} className="h-28 w-full object-cover" />
                              <div className="space-y-1 p-3">
                                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                                <p className="text-xs text-gray-500">{option.src}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-price">Цена</Label>
                    <Input
                      id="seller-price"
                      type="number"
                      value={draft.basePrice}
                      onChange={(event) => updateDraft({ basePrice: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-orig-price">Старая цена</Label>
                    <Input
                      id="seller-orig-price"
                      type="number"
                      value={draft.originalPrice}
                      onChange={(event) => updateDraft({ originalPrice: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-step">Шаг скидки</Label>
                    <Input
                      id="seller-step"
                      type="number"
                      value={draft.discountStep}
                      onChange={(event) => updateDraft({ discountStep: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-max-discount">Потолок скидки</Label>
                    <Input
                      id="seller-max-discount"
                      type="number"
                      value={draft.maxDiscount}
                      onChange={(event) => updateDraft({ maxDiscount: Number(event.target.value) })}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="seller-landed-cost">Себестоимость</Label>
                    <Input
                      id="seller-landed-cost"
                      type="number"
                      value={draft.landedCost}
                      onChange={(event) => updateDraft({ landedCost: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-packaging-cost">Упаковка</Label>
                    <Input
                      id="seller-packaging-cost"
                      type="number"
                      value={draft.packagingCost}
                      onChange={(event) => updateDraft({ packagingCost: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-fulfillment-cost">Фулфилмент</Label>
                    <Input
                      id="seller-fulfillment-cost"
                      type="number"
                      value={draft.fulfillmentCost}
                      onChange={(event) => updateDraft({ fulfillmentCost: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-currency">Валюта</Label>
                    <Select value={draft.currency} onValueChange={(value) => updateDraft({ currency: value as SellerProductDraft['currency'] })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RUB">RUB</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-platform-fee">Платформенный fee %</Label>
                    <Input
                      id="seller-platform-fee"
                      type="number"
                      value={draft.platformFeePercent}
                      onChange={(event) => updateDraft({ platformFeePercent: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-payment-fee">Платёжный fee %</Label>
                    <Input
                      id="seller-payment-fee"
                      type="number"
                      value={draft.paymentFeePercent}
                      onChange={(event) => updateDraft({ paymentFeePercent: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-tax-reserve">Резерв налога %</Label>
                    <Input
                      id="seller-tax-reserve"
                      type="number"
                      value={draft.taxReservePercent}
                      onChange={(event) => updateDraft({ taxReservePercent: Number(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-target-margin">Target margin %</Label>
                    <Input
                      id="seller-target-margin"
                      type="number"
                      value={draft.marginTargetPercent}
                      onChange={(event) => updateDraft({ marginTargetPercent: Number(event.target.value) })}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {isFootwearCategory(draft.category) ? (
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label>Таблица размеров обуви</Label>
                          <p className="text-sm text-gray-500">Выбери только те размеры, которые реально доступны у товара.</p>
                        </div>
                        <Badge variant="secondary">{selectedFootwearSizeIds.length} выбрано</Badge>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                        {SHOE_SIZE_OPTIONS.map((option) => {
                          const selected = selectedFootwearSizeSet.has(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                updateFootwearSizes(
                                  selected
                                    ? selectedFootwearSizeIds.filter((id) => id !== option.id)
                                    : [...selectedFootwearSizeIds, option.id],
                                )
                              }
                              className={`rounded-2xl border p-4 text-left transition ${
                                selected
                                  ? 'border-[#2A7F6E] bg-[#2A7F6E]/5 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-[#2A7F6E]/40 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{option.ru} RU / EU{option.eu}</p>
                                  <p className="mt-1 text-sm text-gray-600">Длина стопы {String(option.lengthCm).replace(/\.0$/, '')} см</p>
                                </div>
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                    selected ? 'border-[#2A7F6E] bg-[#2A7F6E] text-white' : 'border-gray-300 bg-white text-transparent'
                                  }`}
                                >
                                  ✓
                                </span>
                              </div>
                              <p className="mt-3 text-xs text-gray-500">{formatShoeSizeLabel(option)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="seller-sizes">Размеры, через запятую</Label>
                      <Input
                        id="seller-sizes"
                        value={draft.allowedSizes.join(', ')}
                        onChange={(event) => updateDraft({ allowedSizes: parseCommaList(event.target.value) })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="seller-colors">Цвета, через запятую</Label>
                    <Input
                      id="seller-colors"
                      value={draft.allowedColors.join(', ')}
                      onChange={(event) => updateDraft({ allowedColors: parseCommaList(event.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-tags">Теги, через запятую</Label>
                    <Input
                      id="seller-tags"
                      value={draft.tags.join(', ')}
                      onChange={(event) => updateDraft({ tags: parseCommaList(event.target.value) })}
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.active}
                      onChange={(event) => updateDraft({ active: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Активен
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.inStock}
                      onChange={(event) => updateDraft({ inStock: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    В наличии
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.supportsGB2}
                      onChange={(event) => updateDraft({ supportsGB2: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    Поддерживает GB 2.0
                  </label>
                </div>

                <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Варианты</p>
                      <p className="text-sm text-gray-500">{draft.variants.length} rows</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addVariant}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Добавить вариант
                    </Button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {draft.variants.map((variant, index) => (
                      <div key={variant.id || `${variant.size}-${variant.color}-${index}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                          <div className="space-y-2">
                            <Label>Size</Label>
                            <Input value={variant.size} onChange={(event) => updateVariant(index, { size: event.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Color</Label>
                            <Input value={variant.color} onChange={(event) => updateVariant(index, { color: event.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>SKU</Label>
                            <Input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Stock</Label>
                            <Input type="number" value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} />
                          </div>
                          <div className="space-y-2 xl:col-span-1">
                            <Label>Image</Label>
                            <Select
                              value={variant.image || '__none__'}
                              onValueChange={(value) => updateVariant(index, { image: value === '__none__' ? '' : value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Local asset" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Не выбрано</SelectItem>
                                {imageOptions.map((option) => (
                                  <SelectItem key={`${variant.id || index}-${option.src}`} value={option.src}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={variant.isAllowedInGb}
                                onChange={(event) => updateVariant(index, { isAllowedInGb: event.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                              />
                              GB
                            </label>
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => removeVariant(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metricCard('Gross revenue', formatRuble(snapshot.summary.grossRevenue), TrendingUp)}
            {metricCard('Net revenue', formatRuble(snapshot.summary.netRevenue), Wallet)}
            {metricCard('Refunds', formatRuble(snapshot.summary.refundAmount), RefreshCw)}
            {metricCard('Payout ready', formatRuble(snapshot.summary.payoutReady), Building2)}
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-[#2A7F6E]" />
                <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
              </div>

              <div className="space-y-3">
                {snapshot.orders.map((order) => (
                  <div key={order.id} className="grid gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[1.2fr_0.8fr_0.7fr_0.8fr] md:items-center">
                    <div>
                      <p className="font-medium text-gray-900">{order.familyName}</p>
                      <p className="text-sm text-gray-500">{order.variantLabel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Сумма</p>
                      <p className="font-medium text-gray-900">{formatRuble(order.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Статус</p>
                      <Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.shippingAddress?.city || 'Без адреса'} · {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                ))}
                {snapshot.orders.length === 0 ? <p className="text-sm text-gray-500">Заказов пока нет.</p> : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Boxes className="h-5 w-5 text-[#2A7F6E]" />
                <h2 className="text-lg font-semibold text-gray-900">Стоимость и маржа</h2>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="grid grid-cols-6 gap-3 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <div>Товар</div>
                  <div>Cost/unit</div>
                  <div>Break-even</div>
                  <div>Маржа/заказ</div>
                  <div>Orders</div>
                  <div>Risk</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {topProductStats.map((item) => {
                    const totalCostPerUnit = item.estimatedCost + item.estimatedFeeCost;
                    const marginPerOrder = item.contributionMarginPerOrder;
                    return (
                      <div key={item.product.id} className="grid grid-cols-6 gap-3 px-4 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">{item.product.category}</p>
                        </div>
                        <div className="text-gray-700">{formatRuble(totalCostPerUnit)}</div>
                        <div className="text-gray-700">{formatRuble(item.breakEvenPrice)}</div>
                        <div className={marginPerOrder >= 0 ? 'text-emerald-600' : 'text-red-600'}>{formatRuble(marginPerOrder)}</div>
                        <div className="text-gray-700">{item.orders}</div>
                        <div className="text-gray-700">{item.lowStock ? 'stock' : 'ok'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                Себестоимость считается как `landedCost + packaging + fulfillment + fee load`. Это локальная модель, но формула уже готова для API.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Продажи по городам</h2>
                </div>
                <div className="space-y-4">
                  {snapshot.geoStats.slice(0, 8).map((item) => (
                    <div key={`${item.city}-${item.country}`} className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{item.city}</p>
                          <p className="text-xs text-gray-500">{item.region} · {item.country}</p>
                        </div>
                        <p className="text-gray-500">{item.orders} orders</p>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">{moneyBar(item.revenue, topGeoMax)}</div>
                      <p className="text-xs text-gray-500">{formatRuble(item.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Категории</h2>
                </div>
                <div className="space-y-3">
                  {snapshot.categoryBreakdown.map((item) => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-900">{item.label}</span>
                        <span className="text-gray-500">{item.count} товаров</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">{moneyBar(item.revenue, categoryBreakdownMax)}</div>
                      <p className="text-xs text-gray-500">{formatRuble(item.revenue)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#2A7F6E]" />
                <h2 className="text-lg font-semibold text-gray-900">Сессионная воронка</h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {snapshot.sessions.slice(0, 4).map((session) => {
                  const fill = Math.round((session.currentSlots / Math.max(1, session.targetSlots)) * 100);
                  return (
                    <div key={session.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{session.title}</p>
                          <p className="text-xs text-gray-500">{session.familySlug}</p>
                        </div>
                        <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>{session.status}</Badge>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white">
                        <div className="h-2 rounded-full bg-[#2A7F6E]" style={{ width: `${fill}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {session.currentSlots}/{session.targetSlots} слотов · {fill}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
