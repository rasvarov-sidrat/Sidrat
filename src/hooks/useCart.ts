import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CartItem } from '@/types';

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
      const response = await fetch(`/api/sessions/${sessionId}/cart`);
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
    enabled: !!sessionId,
  });

  const addItem = useMutation({
    mutationFn: async (item: CartItem) => {
      const response = await fetch(`/api/sessions/${sessionId}/cart/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await fetch(`/api/sessions/${sessionId}/cart/items/${itemId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update quantity');
      return response.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/sessions/${sessionId}/cart/items/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to remove item');
      return response.json();
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