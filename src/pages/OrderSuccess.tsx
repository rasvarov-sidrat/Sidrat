import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { formatRuble, loadOrders } from '@/lib/mvp';
import type { Order } from '@/types';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
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

  if (!order) {
    if (orderQuery.isLoading) {
      return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Загрузка заказа...</div>;
    }
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Заказ не найден</div>;
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">Заказ готов</h1>
      <p className="mt-3 text-gray-600">Слот был оплачен, заказ подтвержден и готовится к исполнению.</p>

      <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="mt-1 font-semibold text-gray-900">{order.id}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Сумма</p>
            <p className="mt-1 font-semibold text-gray-900">{formatRuble(order.totalAmount)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <Package className="mx-auto mb-2 h-6 w-6 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Сборка</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <Truck className="mx-auto mb-2 h-6 w-6 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Доставка</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-[#2A7F6E]" />
            <p className="text-sm font-medium text-gray-900">Fulfillment</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/catalog">
            <Button variant="outline">Продолжить покупки</Button>
          </Link>
          <Link to="/profile">
            <Button className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Мои заказы</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
