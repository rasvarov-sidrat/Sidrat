import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Search, 
  Users, 
  Gift, 
  Home, 
  Store,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nProvider';
import { User as UserType } from '@/types';

interface MainLayoutProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function MainLayout({ user, onLogout }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(cart.reduce((sum: number, item: any) => sum + item.quantity, 0));
  }, [location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/catalog', icon: Store, label: t('catalog') },
    { path: '/sessions', icon: Users, label: t('sessions') },
  ];

  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-bold text-[#2A7F6E]"
              >
                {t('appName')}
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
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
            </nav>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-600 hover:text-[#2A7F6E]">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{languages.find(l => l.code === language)?.flag}</span>
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        language === lang.code ? 'text-[#2A7F6E] font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-[#2A7F6E]">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C5A059] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User Menu */}
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
                      {t('profile')}
                    </Link>
                    <Link
                      to="/bonus"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {t('bonus')} ({user.bonusBalance})
                    </Link>
                    <button
                      onClick={onLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 last:rounded-b-lg"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white"
                >
                  {t('login')}
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-4 py-3 space-y-2">
                {navItems.map((item) => (
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
                {user ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      <span>{t('profile')}</span>
                    </Link>
                    <Link
                      to="/bonus"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      <Gift className="w-5 h-5" />
                      <span>{t('bonus')} ({user.bonusBalance})</span>
                    </Link>
                    <button
                      onClick={() => {
                        onLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg w-full"
                    >
                      <span>{t('logout')}</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 bg-[#2A7F6E] text-white rounded-lg"
                  >
                    <span>{t('login')}</span>
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-[#2A7F6E] mb-4">{t('appName')}</h3>
              <p className="text-sm text-gray-600">
                Group Buying 2.0 - покупайте вместе, экономьте больше!
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Покупателям</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/catalog" className="hover:text-[#2A7F6E]">Каталог</Link></li>
                <li><Link to="/sessions" className="hover:text-[#2A7F6E]">Групповые покупки</Link></li>
                <li><Link to="/bonus" className="hover:text-[#2A7F6E]">Бонусная программа</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Продавцам</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#2A7F6E]">Как начать</a></li>
                <li><a href="#" className="hover:text-[#2A7F6E]">Тарифы</a></li>
                <li><a href="#" className="hover:text-[#2A7F6E]">Поддержка</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Контакты</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>support@sidrat.com</li>
                <li>+7 (999) 123-45-67</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            © 2024 SIDRAT. Все права защищены.
          </div>
        </div>
      </footer>
    </div>
  );
}