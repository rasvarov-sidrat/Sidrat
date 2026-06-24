import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgePercent, Users, Wallet } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import { formatRuble, getProductCoverImage, getProductImages, loadProducts } from '@/lib/mvp';

export default function Home() {
  const products = loadProducts();

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
