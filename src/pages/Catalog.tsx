import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Users, BadgePercent, Layers3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { catalogCategories, getCatalogCategory, getCatalogGroup, productMatchesCatalogCategory } from '@/lib/catalog';
import { apiFetch } from '@/lib/api';
import { fetchCmsPage } from '@/lib/cms';
import { formatRuble, getFamilyActiveSessions, getProductCoverImage, getProductImages, loadProducts, getCurrentUser } from '@/lib/mvp';
import { canCreateGb, isVerifiedUser } from '@/lib/auth';
import type { Product } from '@/types';

export default function Catalog() {
  const currentUser = getCurrentUser();
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const section = searchParams.get('section') ?? '';
  const item = searchParams.get('item') ?? '';
  const selectedCategory = getCatalogCategory(category);
  const selectedGroup = category === 'electronics' && section ? getCatalogGroup(category, section) : null;
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
  const catalogPageQuery = useQuery({
    queryKey: ['cms-page-catalog'],
    queryFn: async () => {
      try {
        return await fetchCmsPage('catalog');
      } catch {
        return null;
      }
    },
  });
  const products = productsQuery.data || [];
  const catalogPage = catalogPageQuery.data || null;
  const catalogBanner = catalogPage?.blocks?.find((block) => block.blockType === 'promo_banner' || block.blockType === 'text');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery =
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = productMatchesCatalogCategory(product, category, section, item);
      return matchesQuery && matchesCategory;
    });
  }, [category, item, products, query, section]);

  if (productsQuery.isLoading && products.length === 0) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">Загрузка каталога...</div>;
  }

  const updateCategory = (nextCategory: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', nextCategory);
    }
    nextParams.delete('section');
    nextParams.delete('item');
    setSearchParams(nextParams);
  };

  const updateSection = (nextSection: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!nextSection) {
      nextParams.delete('section');
    } else {
      nextParams.set('section', nextSection);
    }
    nextParams.delete('item');
    setSearchParams(nextParams);
  };

  const updateItem = (nextItem: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!nextItem) {
      nextParams.delete('item');
    } else {
      nextParams.set('item', nextItem);
    }
    setSearchParams(nextParams);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Каталог SIDRAT</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{catalogBanner?.title || selectedCategory.label}</h1>
            <p className="mt-2 max-w-2xl text-gray-600">{catalogBanner?.body || selectedCategory.description}</p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по товарам"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Категории</p>
          <div className="mt-3 space-y-1">
            {catalogCategories.map((item) => {
              const Icon = item.icon;
              const selected = item.id === category;
              const categoryCount =
                item.id === 'all'
                  ? products.length
                  : products.filter((product) => productMatchesCatalogCategory(product, item.id)).length;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateCategory(item.id)}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors ${
                    selected ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#2A7F6E]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected ? 'bg-white text-[#2A7F6E]' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-gray-500">{categoryCount} позиций</span>
                    </span>
                  </span>
                  <span className="text-sm text-gray-400">›</span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-5">
          {catalogBanner ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">{catalogBanner.subtitle || 'CMS banner'}</p>
              <h2 className="mt-1 text-xl font-bold text-gray-900">{catalogBanner.title}</h2>
              <p className="mt-2 text-gray-600">{catalogBanner.body}</p>
            </div>
          ) : null}
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-gray-500">Найдено товаров</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{filteredProducts.length}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {catalogCategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateCategory(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      item.id === category
                        ? 'bg-[#2A7F6E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {category === 'electronics' ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Электроника</p>
                  <h2 className="mt-1 text-xl font-bold text-gray-900">Подкатегории</h2>
                </div>
                <button
                  type="button"
                  onClick={() => updateSection('')}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    !section ? 'bg-[#2A7F6E] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Все подкатегории
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedCategory.groups.map((group) => (
                  <button
                    key={group.slug}
                    type="button"
                    onClick={() => updateSection(group.slug)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      section === group.slug
                        ? 'bg-[#2A7F6E] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    {group.title}
                  </button>
                ))}
              </div>

              {selectedGroup ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{selectedGroup.title}</p>
                      <p className="text-sm text-gray-500">Выберите конкретный раздел или листовую категорию</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateItem('')}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        !item ? 'bg-white text-[#2A7F6E] shadow-sm' : 'bg-white/70 text-gray-600 hover:bg-white'
                      }`}
                    >
                      Все элементы
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedGroup.items.map((leaf) => (
                      <button
                        key={leaf.slug}
                        type="button"
                        onClick={() => updateItem(leaf.slug)}
                        className={`rounded-full border px-3 py-2 text-sm transition ${
                          item === leaf.slug
                            ? 'border-[#2A7F6E] bg-[#2A7F6E]/10 text-[#2A7F6E]'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#2A7F6E] hover:text-[#2A7F6E]'
                        }`}
                      >
                        {leaf.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product, index) => {
              const activeSessions = getFamilyActiveSessions(product.id);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <Link to={`/product/${product.slug}`}>
                    <img src={getProductCoverImage(product)} alt={product.name} className="h-56 w-full object-cover" />
                  </Link>
                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="rounded-full bg-[#2A7F6E]/10 px-2 py-1 text-[#2A7F6E]">{product.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {activeSessions.length} активных
                      </span>
                    </div>
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    </Link>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>

                    <div className="mt-4 flex gap-2 overflow-hidden">
                      {getProductImages(product).slice(0, 3).map((thumb) => (
                        <img
                          key={thumb}
                          src={thumb}
                          alt=""
                          className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-gray-500">Базовая цена</p>
                        <p className="font-semibold text-gray-900">{formatRuble(product.basePrice)}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-gray-500">Макс. скидка</p>
                        <p className="font-semibold text-gray-900">{product.maxDiscount}%</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                        <BadgePercent className="h-3.5 w-3.5" />
                        {product.discountStep}% за слот
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                        <Layers3 className="h-3.5 w-3.5" />
                        {product.variants.length} вариантов
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <Link to={`/product/${product.slug}`} className="flex-1">
                        <div className="w-full rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                          Подробнее
                        </div>
                      </Link>
                      {currentUser && isVerifiedUser(currentUser) && canCreateGb(currentUser) ? (
                        <Link to={`/session/create/${product.slug}`} className="flex-1">
                          <div className="w-full rounded-xl bg-[#2A7F6E] px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-[#236b5d]">
                            Создать GB
                          </div>
                        </Link>
                      ) : (
                        <Link to="/#seller-application" className="flex-1">
                          <div className="w-full rounded-xl border border-[#2A7F6E] bg-white px-4 py-2 text-center text-sm font-medium text-[#2A7F6E] transition hover:bg-[#2A7F6E]/10">
                            Стать продавцом
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
              <Layers3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Ничего не найдено</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}