import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A7F6E]/10 to-[#C5A059]/10 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Button asChild variant="ghost" className="text-3xl font-bold text-[#2A7F6E] hover:bg-transparent hover:text-[#236b5d]">
            <Link to="/">SIDRAT</Link>
          </Button>
          <p className="mt-2 text-gray-600">MVP маркетплейса для групповых покупок</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}