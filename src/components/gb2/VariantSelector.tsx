import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductVariant, SelectedVariant } from '@/types';

interface VariantSelectorProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (variant: SelectedVariant) => void;
}

export default function VariantSelector({ product, isOpen, onClose, onConfirm }: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | undefined>();
  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);

  const hasVariants = product.variants && (
    product.variants.sizes?.length ||
    product.variants.colors?.length ||
    product.variants.materials?.length
  );

  const handleConfirm = () => {
    onConfirm({
      size: selectedSize,
      color: selectedColor,
      material: selectedMaterial,
      quantity,
    });
    onClose();
  };

  const isValid = () => {
    if (!hasVariants) return quantity > 0;
    const { sizes, colors, materials } = product.variants || {};
    if (sizes?.length && !selectedSize) return false;
    if (colors?.length && !selectedColor) return false;
    if (materials?.length && !selectedMaterial) return false;
    return quantity > 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Выберите вариант</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Product Image */}
              <div className="flex gap-4 mb-6">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-24 h-24 object-cover rounded-xl"
                />
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-2xl font-bold text-[#2A7F6E] mt-1">${product.price}</p>
                </div>
              </div>

              {/* Sizes */}
              {product.variants?.sizes && product.variants.sizes.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Размер {selectedSize && <span className="text-[#2A7F6E]">({selectedSize})</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedSize === size
                            ? 'border-[#2A7F6E] bg-[#2A7F6E]/10 text-[#2A7F6E]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.variants?.colors && product.variants.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Цвет {selectedColor && <span className="text-[#2A7F6E]">({selectedColor.name})</span>}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.colors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-full border-2 transition-all relative ${
                          selectedColor?.name === color.name
                            ? 'border-[#2A7F6E] ring-2 ring-[#2A7F6E]/30'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor?.name === color.name && (
                          <Check className="w-5 h-5 text-white absolute inset-0 m-auto drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {product.variants?.materials && product.variants.materials.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Материал {selectedMaterial && <span className="text-[#2A7F6E]">({selectedMaterial})</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.materials.map((material) => (
                      <button
                        key={material}
                        onClick={() => setSelectedMaterial(material)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedMaterial === material
                            ? 'border-[#2A7F6E] bg-[#2A7F6E]/10 text-[#2A7F6E]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Количество
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(5, quantity + 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Итого:</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(product.price * quantity).toFixed(0)}
                </span>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={!isValid()}
                className="w-full bg-[#2A7F6E] hover:bg-[#236b5d] text-white py-6"
              >
                Добавить в сессию
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}