import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Store } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { buildCatalogHref, catalogCategories, getCatalogCategory } from '@/lib/catalog';
import { cn } from '@/lib/utils';

export default function CatalogMegaMenu() {
  const location = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');

  const routeCategoryId = useMemo(() => {
    if (!location.pathname.startsWith('/catalog')) {
      return 'all';
    }
    return new URLSearchParams(location.search).get('category') ?? 'all';
  }, [location.pathname, location.search]);

  const selectedCategory = getCatalogCategory(selectedCategoryId);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (open) {
      setSelectedCategoryId(routeCategoryId);
    }
  }, [open, routeCategoryId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const openCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setOpen(true);
  };

  return (
    <div ref={wrapperRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
          location.pathname.startsWith('/catalog')
            ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]'
            : 'text-gray-700 hover:bg-gray-50 hover:text-[#2A7F6E]',
        )}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Store className="h-4 w-4" />
        <span>Каталог</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-x-0 top-[72px] z-[60] hidden pt-3 md:block"
          >
            <div className="mx-auto w-[min(1120px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
              <div className="grid min-h-[460px] grid-cols-[270px_minmax(0,1fr)]">
                <aside className="border-r border-gray-200 bg-gray-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Категории</p>
                  <div className="space-y-1">
                    {catalogCategories.map((category) => {
                      const Icon = category.icon;
                      const selected = selectedCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => openCategory(category.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition-colors',
                            selected ? 'bg-white text-[#2A7F6E] shadow-sm' : 'text-gray-700 hover:bg-white hover:text-[#2A7F6E]',
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100',
                                selected && 'bg-[#2A7F6E]/10 text-[#2A7F6E]',
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="flex flex-col">
                              <span className="text-sm font-semibold">{category.label}</span>
                              <span className="text-xs text-gray-500">{category.description}</span>
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <div className="max-h-[calc(100vh-150px)] overflow-y-auto p-6 pr-4">
                  <div className={cn('mb-6 overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-white', selectedCategory.accent)}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                        <selectedCategory.icon className="h-7 w-7" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white/80">Каталог SIDRAT</p>
                        <h3 className="mt-1 text-2xl font-bold">{selectedCategory.label}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">{selectedCategory.description}</p>
                      </div>
                    </div>
                  </div>

                  {selectedCategoryId === 'all' ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {catalogCategories
                        .filter((category) => category.id !== 'all')
                        .map((category) => {
                          const Icon = category.icon;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => openCategory(category.id)}
                              className="group rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2A7F6E] hover:shadow-md"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2A7F6E]/10 text-[#2A7F6E]">
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900">{category.label}</h4>
                                    <p className="text-xs text-gray-500">{category.description}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {selectedCategory.groups.map((group) => (
                          <div key={group.title} className="rounded-2xl border border-gray-200 bg-white p-4">
                            <Link
                              to={buildCatalogHref(selectedCategory.id, group.slug)}
                              onClick={() => setOpen(false)}
                              className="inline-flex text-sm font-bold text-black transition hover:text-[#2A7F6E]"
                            >
                              {group.title}
                            </Link>
                            <div className="mt-3 space-y-2">
                              {group.items.map((item) => (
                                <Link
                                  key={item.label}
                                  to={item.href}
                                  onClick={() => setOpen(false)}
                                  className="block rounded-xl px-3 py-2 transition hover:bg-gray-50"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-normal text-black">{item.label}</span>
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                  </div>
                                  {item.note ? <p className="mt-1 text-xs text-gray-500">{item.note}</p> : null}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Быстрый переход</p>
                        <div className="mt-3 space-y-2">
                          <Button asChild className="w-full bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                            <Link to={buildCatalogHref(selectedCategory.id)} onClick={() => setOpen(false)}>
                              Открыть раздел
                            </Link>
                          </Button>
                          <Button asChild variant="outline" className="w-full">
                            <Link to="/sessions" onClick={() => setOpen(false)}>
                              Активные сессии
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
