import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Product } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

export default function Catalog() {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'price' | 'popularity'>('popularity');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('products') || '[]');
    setProducts(stored);
    setFilteredProducts(stored);
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      return b.reviews - a.reviews;
    });

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, sortBy, products]);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        product: product,
        quantity: 1,
        discount: 0,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{t('catalog')}</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A7F6E]"
          >
            <option value="all">Все категории</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'popularity')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2A7F6E]"
          >
            <option value="popularity">По популярности</option>
            <option value="price">По цене</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <Link to={`/product/${product.slug}`}>
              <div className="relative h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {product.supportsGB2 && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-[#2A7F6E] text-white text-xs rounded-full flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    GB 2.0
                  </div>
                )}
              </div>
            </Link>
            
            <div className="p-4">
              <Link to={`/product/${product.slug}`}>
                <h3 className="font-semibold text-gray-900 mb-1 hover:text-[#2A7F6E] transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xl font-bold text-[#2A7F6E]">${product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ${product.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-yellow-500">
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-gray-400 ml-1">({product.reviews})</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => addToCart(product)}
                  variant="outline"
                  className="flex-1 border-[#2A7F6E] text-[#2A7F6E] hover:bg-[#2A7F6E]/10"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  В корзину
                </Button>
                {product.supportsGB2 && (
                  <Link to={`/create-session/${product.id}`} className="flex-1">
                    <Button className="w-full bg-[#C5A059] hover:bg-[#b08d4b] text-white">
                      <Users className="w-4 h-4 mr-2" />
                      GB
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Товары не найдены</h3>
          <p className="text-gray-500">Попробуйте изменить параметры поиска</p>
        </div>
      )}
    </div>
  );
}