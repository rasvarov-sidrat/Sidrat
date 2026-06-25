import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CartItem } from '@/types';
import { apiFetch } from '@/lib/api';

interface CartData {
  items: CartItem[];
  totalUnits: number;
  totalOriginal: number;
  totalDiscounted: number;
}

export const useCart = (sessionId?: string) => {
  const queryClient = useQueryClient();
  const queryKey = ['cart', sessionId];
  const { data, ...rest } = useQuery<CartData, Error>({
    queryKey,
    queryFn: async () => {
      if (!sessionId) return { items: [], totalUnits: 0, totalOriginal: 0, totalDiscounted: 0 };
      return apiFetch<CartData>(`/api/v1/sessions/${sessionId}/cart`);
    },
    enabled: !!sessionId,
  });

  const addItem = useMutation({
    mutationFn: async (item: CartItem) => {
      return apiFetch<CartData>(`/api/v1/sessions/${sessionId}/cart/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      return apiFetch<CartData>(`/api/v1/sessions/${sessionId}/cart/items/${itemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      return apiFetch<CartData>(`/api/v1/sessions/${sessionId}/cart/items/${itemId}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    items: data?.items || [],
    totalUnits: data?.totalUnits || 0,
    totalOriginal: data?.totalOriginal || 0,
    totalDiscounted: data?.totalDiscounted || 0,
    ...rest,
    addItem: addItem.mutateAsync,
    updateQuantity: updateQuantity.mutateAsync,
    removeItem: removeItem.mutateAsync,
  };
};