import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Home, Store, Users, Wallet, User, Shield, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User as UserType } from '@/types';
import { useStore } from '@/stores/store';
import CatalogMegaMenu from '@/components/CatalogMegaMenu';
import { isVerifiedUser } from '@/lib/auth';

interface MainLayoutProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = useStore((state) => state.cart.reduce((sum, item) => sum + item.quantity, 0));
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/sessions', icon: Users, label: 'Сессии' },
    { path: '/wallet', icon: Wallet, label: 'Кошелёк' },
  ];
  const mobileNavItems = [
    { path: '/catalog', icon: Store, label: 'Каталог' },
    ...navItems,
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button asChild variant="ghost" className="px-2 text-2xl font-bold text-[#2A7F6E] hover:bg-transparent hover:text-[#236b5d]">
              <Link to="/">SIDRAT</Link>
            </Button>

            <nav className="hidden md:flex items-center space-x-8">
              <CatalogMegaMenu />
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-[#2A7F6E]'
                      : 'text-gray-600 hover:text-[#2A7F6E]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              {user && isVerifiedUser(user) && (user.role === 'seller' || user.role === 'admin') ? (
                <Link to="/seller" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-[#2A7F6E]">
                  <Store className="w-4 h-4" />
                  <span>Продавец</span>
                </Link>
              ) : null}
              {user && isVerifiedUser(user) && user.role === 'admin' ? (
                <Link to="/admin" className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-[#2A7F6E]">
                  <Shield className="w-4 h-4" />
                  <span>Админ</span>
                </Link>
              ) : null}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/cart"
                className={`relative rounded-full p-2 transition ${
                  location.pathname === '/cart'
                    ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2A7F6E]'
                }`}
                aria-label="Корзина"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#C5A059] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-[#2A7F6E]">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.name}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                    >
                      Профиль
                    </Link>
                    <Link
                      to="/wallet"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Кошелёк ({user.walletBalance ?? 0})
                    </Link>
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 last:rounded-b-lg"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white"
                >
                  Войти
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 md:hidden">
              <Link
                to="/cart"
                className={`relative rounded-full p-2 transition ${
                  location.pathname === '/cart'
                    ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#2A7F6E]'
                }`}
                aria-label="Корзина"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#C5A059] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <button
                className="p-2 text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-3 space-y-2">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                      location.pathname === item.path
                        ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                {user && isVerifiedUser(user) && (user.role === 'seller' || user.role === 'admin') ? (
                  <Link
                    to="/seller"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Store className="w-5 h-5" />
                    <span>Продавец</span>
                  </Link>
                ) : null}
                {user && isVerifiedUser(user) && user.role === 'admin' ? (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Админ</span>
                  </Link>
                ) : null}
                {user ? (
                  <>
                    <Link
                      to="/cart"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Корзина{cartCount > 0 ? ` (${cartCount})` : ''}</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      <span>Профиль</span>
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
                    >
                      <span>Выйти</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 bg-[#2A7F6E] text-white rounded-lg"
                  >
                    <span>Войти</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-[#2A7F6E] mb-4">SIDRAT</h3>
              <p className="text-sm text-gray-600">Маркетплейс для групповых покупок 2.0 со снижением цены по слотам.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Покупателям</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/catalog" className="hover:text-[#2A7F6E]">Каталог</Link></li>
                <li><Link to="/sessions" className="hover:text-[#2A7F6E]">Групповые сессии</Link></li>
                <li><Link to="/wallet" className="hover:text-[#2A7F6E]">Кошелёк</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Продавцам</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/seller" className="hover:text-[#2A7F6E]">Панель продавца</Link></li>
                <li><Link to="/catalog" className="hover:text-[#2A7F6E]">Создать сессию</Link></li>
                <li><Link to="/admin" className="hover:text-[#2A7F6E]">Инструменты админа</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Контакты</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/seller-application" className="hover:text-[#2A7F6E]">Подать заявку продавца</Link></li>
                <li>support@sidrat.local</li>
                <li>+7 (999) 123-45-67</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2026 SIDRAT. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}