import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/types';

export const useSession = (sessionId?: string) => {
  return useQuery<Session, Error>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID required');
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch session');
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
};