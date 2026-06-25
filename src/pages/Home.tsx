import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgePercent, Store, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroCarousel from '@/components/HeroCarousel';
import { apiFetch } from '@/lib/api';
import { fetchCmsPage } from '@/lib/cms';
import { formatRuble, getProductCoverImage, getProductImages, loadProducts } from '@/lib/mvp';
import type { Product } from '@/types';

export default function Home() {
  const productsQuery = useQuery({
    queryKey: ['home-catalog'],
    queryFn: async () => {
      try {
        return await apiFetch<Product[]>(`/api/v1/catalog?limit=3`);
      } catch {
        return loadProducts().slice(0, 3);
      }
    },
  });
  const homePageQuery = useQuery({
    queryKey: ['cms-page-home'],
    queryFn: async () => {
      try {
        return await fetchCmsPage('home');
      } catch {
        return null;
      }
    },
  });
  const products = productsQuery.data || loadProducts().slice(0, 3);
  const homePage = homePageQuery.data || null;
  const featureBlock = homePage?.blocks?.find((block) => block.blockType === 'feature_list');
  const ctaBlock = homePage?.blocks?.find((block) => block.blockType === 'cta');
  const featureItems = Array.isArray(featureBlock?.props?.items) ? (featureBlock?.props?.items as string[]) : null;

  const highlights = [
    {
      icon: Users,
      title: 'Групповые покупки 2.0',
      text: 'Один товар, одно семейство, много допустимых вариаций внутри одной сессии.',
    },
    {
      icon: BadgePercent,
      title: 'Пошаговая скидка',
      text: 'Цена падает по мере занятия слотов и ограничивается потолком скидки.',
    },
    {
      icon: Wallet,
      title: 'Внутренний баланс',
      text: 'Разница по цене уходит в wallet и может быть потрачена или выведена с комиссией.',
    },
  ];

  return (
    <div className="space-y-16">
      <section>
        <HeroCarousel />
      </section>

      <section className="rounded-3xl border border-[#2A7F6E]/15 bg-[#2A7F6E]/5 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Для продавцов</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{ctaBlock?.title || 'Хочешь запускать GB-сессии?'}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {ctaBlock?.body || 'Подай заявку на доступ продавца, и админ вручную подтвердит твой аккаунт.'}
            </p>
          </div>
          <Button asChild className="rounded-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
            <Link to={(ctaBlock?.ctaLink as string) || '/seller-application'}>
              <Store className="mr-2 h-4 w-4" />
              {(ctaBlock?.ctaText as string) || 'Подать заявку продавца'}
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {highlights.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A7F6E]/10 text-[#2A7F6E]">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
          </motion.div>
        ))}
      </section>

      {featureBlock ? (
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">{featureBlock.subtitle || 'CMS-блок'}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{featureBlock.title || 'Покупайте вместе.'}</h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">{featureBlock.body || 'Контент теперь редактируется из админки.'}</p>
          {featureItems?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {featureItems.map((item) => (
                <div key={item} className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">{item}</div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Товары с картинками</h2>
            <p className="mt-1 text-gray-600">Картинки уже лежат в данных, так что можно сразу показывать витрину без дополнительной загрузки.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src={getProductCoverImage(product)} alt={product.name} className="h-48 w-full object-cover" loading="lazy" />
              <div className="p-5">
                <p className="text-sm text-[#2A7F6E]">{product.category}</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900">{product.name}</h3>
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
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{product.variants.length} вариантов</span>
                  <span className="font-semibold text-gray-900">{formatRuble(product.basePrice)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
