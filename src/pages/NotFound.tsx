import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-9xl font-bold text-[#2A7F6E]/20 mb-4">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Страница не найдена</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Извините, запрашиваемая страница не существует или была перемещена.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/">
            <Button className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
              <Home className="w-4 h-4 mr-2" />
              На главную
            </Button>
          </Link>
          <Link to="/catalog">
            <Button variant="outline" className="border-[#2A7F6E] text-[#2A7F6E]">
              <Search className="w-4 h-4 mr-2" />
              В каталог
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}