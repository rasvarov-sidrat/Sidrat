import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import { I18nProvider } from '@/i18n/I18nProvider';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import OrderSuccess from '@/pages/OrderSuccess';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Bonus from '@/pages/Bonus';
import Sessions from '@/pages/Sessions';
import CreateSession from '@/pages/CreateSession';
import SessionDetail from '@/pages/SessionDetail';
import NotFound from '@/pages/NotFound';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'seller' | 'admin';
  bonusBalance: number;
  referralCode: string;
  referredBy?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <I18nProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="product/:slug" element={<ProductDetail user={user} />} />
              <Route path="cart" element={<Cart user={user} />} />
              <Route path="sessions" element={<Sessions user={user} />} />
              <Route path="session/:id" element={<SessionDetail user={user} />} />
              <Route path="create-session/:productId" element={
                user ? <CreateSession user={user} /> : <Navigate to="/login" replace />
              } />
              <Route path="order-success/:orderId" element={<OrderSuccess />} />
              <Route path="bonus" element={user ? <Bonus user={user} /> : <Navigate to="/login" replace />} />
              <Route path="profile" element={
                user ? <Profile user={user} onUpdate={setUser} /> : <Navigate to="/login" replace />
              } />
            </Route>

            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="login" element={
                user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />
              } />
              <Route path="register" element={
                user ? <Navigate to="/" replace /> : <Register onRegister={handleLogin} />
              } />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <Toaster />
      </Router>
    </I18nProvider>
  );
}

export default App;