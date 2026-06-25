import { useQuery } from '@tanstack/react-query';
import type { Session } from '@/types';
import { apiFetch } from '@/lib/api';

export const useSession = (sessionId?: string) => {
  return useQuery<Session, Error>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID required');
      return apiFetch<Session>(`/api/v1/sessions/${sessionId}`);
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
  });
};