import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import MainLayout from '@/layouts/MainLayout';
import AuthLayout from '@/layouts/AuthLayout';
import type { User } from '@/types';
import { getCurrentUser, seedMvpData, setCurrentUser } from '@/lib/mvp';
import { clearAuthSession, isVerifiedUser } from '@/lib/auth';

const Home = lazy(() => import('@/pages/Home'));
const Catalog = lazy(() => import('@/pages/Catalog'));
const ProductDetail = lazy(() => import('@/pages/ProductDetail'));
const Sessions = lazy(() => import('@/pages/Sessions'));
const SessionDetail = lazy(() => import('@/pages/SessionDetail'));
const CreateSession = lazy(() => import('@/pages/CreateSession'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Profile = lazy(() => import('@/pages/Profile'));
const Wallet = lazy(() => import('@/pages/Bonus'));
const SellerDashboard = lazy(() => import('@/pages/SellerDashboard'));
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const SellerApplication = lazy(() => import('@/pages/SellerApplication'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function CheckoutRoute({ user }: { user: User | null }) {
  const location = useLocation();
  if (!user || !isVerifiedUser(user)) {
    return <Navigate to="/register" replace state={{ from: location }} />;
  }
  return <Checkout user={user} />;
}

function CreateSessionRoute({ user }: { user: User | null }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/register" replace state={{ from: location }} />;
  }
  if (!isVerifiedUser(user)) {
    return <Navigate to="/register" replace state={{ from: location }} />;
  }
  return <CreateSession user={user} />;
}

function PageFallback() {
  return <div className="min-h-[60vh] rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">Загрузка...</div>;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedMvpData();
    setUser(getCurrentUser());
    setReady(true);

    const handleUserUpdate = () => setUser(getCurrentUser());
    window.addEventListener('sidrat-user-updated', handleUserUpdate);
    return () => window.removeEventListener('sidrat-user-updated', handleUserUpdate);
  }, []);

  const handleLogin = (nextUser: User) => {
    setUser(nextUser);
    setCurrentUser(nextUser);
  };

  const handleLogout = () => {
    setUser(null);
    clearAuthSession();
  };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <Router>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<MainLayout user={user} onLogout={handleLogout} />}>
            <Route index element={<Home />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="product/:slug" element={<ProductDetail user={user} />} />
            <Route path="sessions" element={<Sessions user={user} />} />
            <Route path="session/:id" element={<SessionDetail user={user} />} />
            <Route path="cart" element={<Cart user={user} />} />
            <Route path="session/create/:familyId" element={<CreateSessionRoute user={user} />} />
            <Route path="checkout/:orderId" element={<CheckoutRoute user={user} />} />
            <Route path="order-success/:orderId" element={<OrderSuccess />} />
            <Route path="wallet" element={user ? <Wallet user={user} /> : <Navigate to="/login" replace />} />
            <Route path="profile" element={user ? <Profile user={user} onUpdate={handleLogin} /> : <Navigate to="/login" replace />} />
            <Route path="seller" element={user && isVerifiedUser(user) && (user.role === 'seller' || user.role === 'admin') ? <SellerDashboard user={user} /> : <Navigate to="/" replace />} />
            <Route path="admin" element={user && isVerifiedUser(user) && user.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/" replace />} />
            <Route path="seller-application" element={<SellerApplication />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="register" element={user ? <Navigate to="/" replace /> : <Register onRegister={handleLogin} />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </Router>
  );
}

export default App;