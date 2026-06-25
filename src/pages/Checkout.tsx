import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, MapPin, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { confirmOrder, formatRuble, loadOrders } from '@/lib/mvp';
import type { Order, ShippingAddress, User } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import {
  COUNTRY_OPTIONS,
  buildPhonePreview,
  fetchYandexAddressSuggestions,
  formatPhoneDigits,
  getPhonePlaceholder,
  normalizePhoneDigits,
  searchRussianCities,
  type AddressSuggestion,
  type CityOption,
} from '@/lib/checkout-location';

interface CheckoutProps {
  user: User | null;
}

export default function Checkout({ user }: CheckoutProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) {
        throw new Error('Order ID required');
      }
      try {
        return await apiFetch<Order>(`/api/v1/orders/${orderId}`);
      } catch {
        const localOrder = loadOrders().find((item) => item.id === orderId) || null;
        if (!localOrder) {
          throw new Error('Order not found');
        }
        return localOrder;
      }
    },
    enabled: !!orderId,
  });
  const order = orderQuery.data || null;
  const [phoneCountryCode, setPhoneCountryCode] = useState<'RU' | 'AE' | 'MY'>('RU');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Российская Федерация',
  });

  useEffect(() => {
    const countryToDialCode: Record<string, 'RU' | 'AE' | 'MY'> = {
      'Российская Федерация': 'RU',
      'ОАЭ': 'AE',
      'Малайзия': 'MY',
    };
    setPhoneCountryCode(countryToDialCode[address.country] || 'RU');
  }, [address.country]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const query = cityQuery.trim();
      if (query.length < 2) {
        if (active) {
          setCitySuggestions([]);
          setCityLoading(false);
        }
        return;
      }
      setCityLoading(true);
      const results = await searchRussianCities(query, 10);
      if (active) {
        setCitySuggestions(results);
        setCityLoading(false);
      }
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cityQuery]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const query = addressQuery.trim();
      if (query.length < 3) {
        if (active) {
          setAddressSuggestions([]);
          setAddressLoading(false);
        }
        return;
      }
      setAddressLoading(true);
      const countryIso = address.country === 'ОАЭ' ? 'ae' : address.country === 'Малайзия' ? 'my' : 'ru';
      const results = await fetchYandexAddressSuggestions(query, countryIso);
      if (active) {
        setAddressSuggestions(results);
        setAddressLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [address.country, addressQuery]);

  if (!order) {
    if (orderQuery.isLoading) {
      return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Загрузка заказа...</div>;
    }
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Заказ не найден</div>;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const normalizedPhone = buildPhonePreview(phoneCountryCode, phoneDigits);
      const shippingAddress: ShippingAddress = {
        ...address,
        fullName: address.fullName.trim(),
        phone: normalizedPhone,
        address: address.address.trim(),
        city: address.city.trim(),
        postalCode: address.postalCode.trim(),
        country: address.country,
      };

      await apiFetch<Order>(`/api/v1/orders/${order.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ shippingAddress }),
      });
      if (loadOrders().some((item) => item.id === order.id)) {
        confirmOrder(order.id, shippingAddress);
      }
      navigate(`/order-success/${order.id}`);
    } catch (error) {
      try {
        const normalizedPhone = buildPhonePreview(phoneCountryCode, phoneDigits);
        const shippingAddress: ShippingAddress = {
          ...address,
          fullName: address.fullName.trim(),
          phone: normalizedPhone,
          address: address.address.trim(),
          city: address.city.trim(),
          postalCode: address.postalCode.trim(),
          country: address.country,
        };
        confirmOrder(order.id, shippingAddress);
        navigate(`/order-success/${order.id}`);
        return;
      } catch (fallbackError) {
        const message = fallbackError instanceof Error ? fallbackError.message : error instanceof Error ? error.message : 'Не удалось подтвердить заказ';
        toast({ title: 'Ошибка', description: message, variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Оформление заказа</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Оформление заказа</h1>
        <p className="mt-2 text-gray-600">Оплата слота уже проведена. Здесь фиксируем доставку и финальный статус заказа.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <MapPin className="h-5 w-5 text-[#2A7F6E]" />
              <h2 className="text-lg font-semibold">Адрес доставки</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">ФИО</Label>
                <Input
                  id="fullName"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="mt-1"
                  placeholder="Введите ФИО"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <div className="mt-1 grid grid-cols-[112px_minmax(0,1fr)] gap-3">
                  <Select value={phoneCountryCode} onValueChange={(value) => setPhoneCountryCode(value as 'RU' | 'AE' | 'MY')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Код" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.dialCode} · {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    value={formatPhoneDigits(phoneDigits, phoneCountryCode)}
                    onChange={(e) => setPhoneDigits(normalizePhoneDigits(e.target.value))}
                    placeholder={getPhonePlaceholder(phoneCountryCode)}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Формат:{' '}
                  {phoneDigits
                    ? buildPhonePreview(phoneCountryCode, phoneDigits)
                    : `${COUNTRY_OPTIONS.find((item) => item.code === phoneCountryCode)?.dialCode || COUNTRY_OPTIONS[0].dialCode} ${getPhonePlaceholder(phoneCountryCode)}`}
                </p>
              </div>
              <div>
                <Label htmlFor="address">Адрес</Label>
                <div className="relative mt-1">
                  <Input
                    id="address"
                    value={addressQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setAddressQuery(value);
                      setAddress({ ...address, address: value });
                    }}
                    className="pr-24"
                    placeholder="Улица, дом, квартира"
                    required
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {addressLoading ? 'Ищем...' : 'Yandex'}
                  </div>
                  {addressSuggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                      {addressSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.value}
                          type="button"
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50"
                          onClick={() => {
                            setAddress({ ...address, address: suggestion.value });
                            setAddressQuery(suggestion.value);
                            setAddressSuggestions([]);
                          }}
                        >
                          <div className="font-medium text-gray-900">{suggestion.value}</div>
                          {suggestion.subtitle ? <div className="mt-1 text-xs text-gray-500">{suggestion.subtitle}</div> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {import.meta.env.VITE_YANDEX_SUGGEST_API_KEY ? null : (
                  <p className="mt-1 text-xs text-gray-500">Подсказки адреса включатся после добавления `VITE_YANDEX_SUGGEST_API_KEY`.</p>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    value={cityQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCityQuery(value);
                      setAddress({ ...address, city: value });
                    }}
                    className="mt-1"
                    placeholder="Начните вводить город"
                    required
                  />
                  {cityLoading ? <p className="mt-1 text-xs text-gray-500">Ищем города...</p> : null}
                  {citySuggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
                      {citySuggestions.map((suggestion) => (
                        <button
                          key={suggestion.value}
                          type="button"
                          className="block w-full border-b border-gray-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-gray-50"
                          onClick={() => {
                            setCityQuery(suggestion.value);
                            setAddress({ ...address, city: suggestion.value });
                            setCitySuggestions([]);
                          }}
                        >
                          <div className="font-medium text-gray-900">{suggestion.value}</div>
                          {suggestion.region ? <div className="mt-1 text-xs text-gray-500">{suggestion.region}</div> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="postalCode">Индекс</Label>
                  <Input
                    id="postalCode"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="mt-1"
                    placeholder="101000"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="country">Страна</Label>
                <Select
                  value={address.country}
                  onValueChange={(value) => setAddress({ ...address, country: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите страну" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.code} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]" disabled={loading}>
                <PackageCheck className="mr-2 h-4 w-4" />
                {loading ? 'Сохраняем...' : 'Подтвердить заказ'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-2 text-gray-900">
              <CreditCard className="h-5 w-5 text-[#2A7F6E]" />
              <h2 className="text-lg font-semibold">Сводка заказа</h2>
            </div>

            <div className="space-y-3 rounded-2xl bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID заказа</span>
                <span className="font-medium">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Семейство</span>
                <span className="font-medium">{order.familyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Вариант</span>
                <span className="font-medium">{order.variantLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Сумма</span>
                <span className="font-semibold text-gray-900">{formatRuble(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Списано из wallet</span>
                <span className="font-semibold text-gray-900">{formatRuble(order.walletDeduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Статус</span>
                <span className="font-semibold text-gray-900">{order.status}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#2A7F6E]/20 bg-[#2A7F6E]/5 p-4 text-sm text-[#17493f]">
              Оплата на слот была проведена раньше. Эта страница фиксирует доставку и переводит заказ в финальный статус.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
