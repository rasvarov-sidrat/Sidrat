import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, Filter, Layers3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { catalogCategories, getCatalogCategorySearchText } from '@/lib/catalog';
import { apiFetch } from '@/lib/api';
import { formatRuble, getSessionFillBucket, getSessionFillPercent, getSessionNextPrice, loadProducts, loadSessions, SESSION_FILL_BUCKET_OPTIONS } from '@/lib/mvp';
import type { Product, Session, User } from '@/types';

interface SessionsProps {
  user: User | null;
}

export default function Sessions({ user }: SessionsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<'all' | 'my'>('all');
  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      try {
        return await apiFetch<Session[]>(`/api/v1/sessions`);
      } catch {
        return loadSessions();
      }
    },
  });
  const productsQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      try {
        return await apiFetch<Product[]>(`/api/v1/catalog?limit=100`);
      } catch {
        return loadProducts();
      }
    },
  });
  const sessions = sessionsQuery.data || [];
  const products = productsQuery.data || [];
  const familyById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const query = searchParams.get('query') ?? '';
  const category = searchParams.get('category') ?? 'all';
  const fill = searchParams.get('fill') ?? '';

  const normalizedCategory = catalogCategories.some((item) => item.id === category) ? category : 'all';
  const normalizedFill = SESSION_FILL_BUCKET_OPTIONS.some((item) => item.value === fill) ? fill : '';

  const updateSearchParam = (key: string, value: string | null, replace = false) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace });
  };

  const visibleSessions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sessions
      .filter((session) => session.status === 'active')
      .filter((session) => {
        if (mode === 'my' && user) {
          return session.createdBy === user.id || session.participants.some((participant) => participant.userId === user.id);
        }
        return true;
      })
      .filter((session) => {
        const family = familyById.get(session.familyId);
        if (!family) return false;

        if (normalizedCategory !== 'all' && family.category !== normalizedCategory) {
          return false;
        }

        if (normalizedFill && getSessionFillBucket(session) !== normalizedFill) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const searchIndex = [
          session.title,
          session.description ?? '',
          session.familySlug,
          family.name,
          family.description,
          family.category,
          family.categorySlug ?? '',
          getCatalogCategorySearchText(family.category),
        ]
          .join(' ')
          .toLowerCase();

        return searchIndex.includes(normalizedQuery);
      });
  }, [familyById, mode, normalizedCategory, normalizedFill, query, sessions, user]);

  if ((sessionsQuery.isLoading || productsQuery.isLoading) && sessions.length === 0 && products.length === 0) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Загрузка сессий...</div>;
  }

  const totalParticipants = visibleSessions.reduce((sum, session) => sum + session.participants.length, 0);
  const maxSavings = visibleSessions.length > 0 ? Math.max(...visibleSessions.map((session) => session.basePriceSnapshot - session.currentFloorPrice)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Активные сессии</h1>
          <p className="mt-1 text-gray-600">Сессии, которые уже живут по snapshot-логике и принимают новые слоты.</p>
        </div>
        <Link to="/catalog">
          <Button className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
            <Layers3 className="mr-2 h-4 w-4" />
            Создать новую
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Активных сессий</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{visibleSessions.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Участников</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalParticipants}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Макс. экономия</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{formatRuble(maxSavings)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => updateSearchParam('query', e.target.value.trim() ? e.target.value : null, true)}
            placeholder="Поиск по сессии, товару или категории"
            className="pl-10 md:w-96"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={normalizedCategory}
            onChange={(e) => updateSearchParam('category', e.target.value === 'all' ? null : e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7F6E]"
          >
            {catalogCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={normalizedFill}
            onChange={(e) => updateSearchParam('fill', e.target.value || null)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7F6E]"
          >
            <option value="">Любая заполненность</option>
            {SESSION_FILL_BUCKET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button variant={mode === 'all' ? 'default' : 'outline'} onClick={() => setMode('all')}>Все</Button>
            {user ? <Button variant={mode === 'my' ? 'default' : 'outline'} onClick={() => setMode('my')}>Мои</Button> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleSessions.map((session) => {
          const family = familyById.get(session.familyId);
          const nextPrice = getSessionNextPrice(session);
          const fillPercent = getSessionFillPercent(session);
          return (
            <Link
              key={session.id}
              to={`/session/${session.id}`}
              state={{ session }}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-[#2A7F6E]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{family?.name || session.familySlug}</p>
                </div>
                <span className="rounded-full bg-[#2A7F6E]/10 px-3 py-1 text-xs text-[#2A7F6E]">{session.accessType}</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{session.currentSlots}/{session.targetSlots}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{new Date(session.expiresAt).toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#2A7F6E]" style={{ width: `${fillPercent}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Текущая цена</span>
                  <span className="font-semibold text-gray-900">{formatRuble(session.currentFloorPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Следующий слот</span>
                  <span className="font-semibold text-gray-900">{formatRuble(nextPrice)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {visibleSessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          Сессий по этим фильтрам пока нет.
        </div>
      ) : null}
    </div>
  );
}
