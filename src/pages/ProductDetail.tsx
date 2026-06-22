import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, Star, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, User } from '@/types';

interface ProductDetailProps {
  user: User | null;
}

export default function ProductDetail({ user }: ProductDetailProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const found = products.find((p: Product) => p.slug === slug);
    if (found) {
      setProduct(found);
    }
  }, [slug]);

  const addToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        product: product,
        quantity: quantity,
        discount: 0,
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  const buyNow = () => {
    addToCart();
    navigate('/checkout');
  };

  if (!product) {
    return <div className="flex items-center justify-center h-64">Загрузка...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-[#2A7F6E] mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-2xl overflow-hidden bg-gray-100"
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="flex gap-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx ? 'border-[#2A7F6E]' : 'border-transparent'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {product.category}
              </span>
              {product.supportsGB2 && (
                <span className="px-3 py-1 bg-[#2A7F6E]/10 text-[#2A7F6E] text-sm rounded-full flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  GB 2.0
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
                <span className="ml-1 font-medium">{product.rating}</span>
              </div>
              <span className="text-gray-500">{product.reviews} отзывов</span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-bold text-[#2A7F6E]">${product.price}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">${product.originalPrice}</span>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-sm rounded-full">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {product.inStock ? (
            <div className="flex items-center text-green-600">
              <Check className="w-5 h-5 mr-2" />
              В наличии
            </div>
          ) : (
            <div className="text-red-600">Нет в наличии</div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Количество:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100"
              >-</button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-100"
              >+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={addToCart}
              variant="outline"
              className="flex-1 border-[#2A7F6E] text-[#2A7F6E] hover:bg-[#2A7F6E]/10 py-6"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              В корзину
            </Button>
            <Button
              onClick={buyNow}
              className="flex-1 bg-[#2A7F6E] hover:bg-[#236b5d] text-white py-6"
            >
              Купить сейчас
            </Button>
          </div>

          {product.supportsGB2 && (
            <Button
              onClick={() => navigate(`/create-session/${product.id}`)}
              className="w-full bg-[#C5A059] hover:bg-[#b08d4b] text-white py-6"
            >
              <Users className="w-5 h-5 mr-2" />
              Создать групповую покупку
            </Button>
          )}

          {/* Specs */}
          {product.specs && (
            <Tabs defaultValue="specs" className="mt-8">
              <TabsList className="w-full">
                <TabsTrigger value="specs" className="flex-1">Характеристики</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">Отзывы</TabsTrigger>
              </TabsList>
              <TabsContent value="specs" className="mt-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4">
                <div className="text-center py-8 text-gray-500">
                  Отзывы скоро появятся...
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}