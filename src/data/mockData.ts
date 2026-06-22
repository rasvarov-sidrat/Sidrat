import { Product, User, TierConfig } from '@/types';

export const tierConfigs: TierConfig[] = [
  { name: 'Bronze', minUnits: 5, discount: 5, color: '#CD7F32', icon: '🥉' },
  { name: 'Silver', minUnits: 15, discount: 10, color: '#C0C0C0', icon: '🥈' },
  { name: 'Gold', minUnits: 30, discount: 15, color: '#FFD700', icon: '🥇' },
  { name: 'Platinum', minUnits: 50, discount: 20, color: '#E5E4E2', icon: '💎' },
  { name: 'Diamond', minUnits: 100, discount: 30, color: '#B9F2FF', icon: '💠' },
];

export const products: Product[] = [
  {
    id: '1',
    slug: 'iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    description: 'The most advanced iPhone ever with A17 Pro chip, titanium design, and 48MP camera system.',
    price: 1199,
    originalPrice: 1299,
    category: 'smartphones',
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
    images: [
      'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800',
      'https://images.unsplash.com/photo-1696446702188-3d5f53f49c2f?w=800',
    ],
    rating: 4.9,
    reviews: 2847,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs,
    specs: {
      'Display': '6.7" Super Retina XDR',
      'Chip': 'A17 Pro',
      'Camera': '48MP Main + 12MP Ultra Wide',
      'Storage': '256GB',
      'Battery': 'Up to 29 hours video',
    },
    variants: {
      colors: [
        { name: 'Natural Titanium', hex: '#C4C4C4' },
        { name: 'Blue Titanium', hex: '#4A5568' },
        { name: 'White Titanium', hex: '#F7FAFC' },
        { name: 'Black Titanium', hex: '#1A202C' },
      ],
    },
  },
  {
    id: '2',
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Galaxy AI is here. Powered by the most intelligent mobile processor ever.',
    price: 1299,
    originalPrice: 1399,
    category: 'smartphones',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
      'https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=800',
    ],
    rating: 4.8,
    reviews: 1923,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs,
    specs: {
      'Display': '6.8" QHD+ AMOLED',
      'Chip': 'Snapdragon 8 Gen 3',
      'Camera': '200MP Main + 50MP Periscope',
      'Storage': '512GB',
      'Battery': '5000mAh',
    },
    variants: {
      colors: [
        { name: 'Titanium Gray', hex: '#718096' },
        { name: 'Titanium Black', hex: '#2D3748' },
        { name: 'Titanium Violet', hex: '#805AD5' },
        { name: 'Titanium Yellow', hex: '#D69E2E' },
      ],
    },
  },
  {
    id: '3',
    slug: 'nike-air-max',
    name: 'Nike Air Max 2024',
    description: 'Maximum cushioning meets bold style in the latest Air Max evolution.',
    price: 189,
    originalPrice: 220,
    category: 'footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
    ],
    rating: 4.6,
    reviews: 892,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs.slice(0, 4),
    specs: {
      'Upper': 'Breathable mesh',
      'Midsole': 'Air Max unit',
      'Outsole': 'Rubber',
      'Weight': '320g',
      'Fit': 'True to size',
    },
    variants: {
      sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12'],
      colors: [
        { name: 'University Red', hex: '#E53E3E' },
        { name: 'Black/White', hex: '#1A202C' },
        { name: 'Royal Blue', hex: '#3182CE' },
      ],
    },
  },
  {
    id: '4',
    slug: 'adidas-ultraboost',
    name: 'Adidas Ultraboost Light',
    description: 'Revolutionary light BOOST technology for endless energy return.',
    price: 190,
    originalPrice: 230,
    category: 'footwear',
    image: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
    images: [
      'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800',
    ],
    rating: 4.7,
    reviews: 1234,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs.slice(0, 4),
    specs: {
      'Upper': 'Primeknit',
      'Midsole': 'Light BOOST',
      'Outsole': 'Continental Rubber',
      'Weight': '290g',
      'Drop': '10mm',
    },
    variants: {
      sizes: ['US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'US 12', 'US 13'],
      colors: [
        { name: 'Core Black', hex: '#1A202C' },
        { name: 'Cloud White', hex: '#F7FAFC' },
        { name: 'Solar Red', hex: '#FC8181' },
      ],
    },
  },
  {
    id: '5',
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling with exceptional sound quality.',
    price: 399,
    originalPrice: 449,
    category: 'audio',
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800',
    ],
    rating: 4.7,
    reviews: 3421,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs.slice(0, 3),
    specs: {
      'Type': 'Over-ear wireless',
      'ANC': 'Industry-leading',
      'Battery': '30 hours',
      'Charging': 'USB-C Quick Charge',
      'Weight': '250g',
    },
    variants: {
      colors: [
        { name: 'Black', hex: '#1A202C' },
        { name: 'Silver', hex: '#E2E8F0' },
      ],
    },
  },
  {
    id: '6',
    slug: 'macbook-pro-16',
    name: 'MacBook Pro 16"',
    description: 'Mind-blowing performance with M3 Max chip and stunning Liquid Retina XDR display.',
    price: 2499,
    originalPrice: 2699,
    category: 'laptops',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    ],
    rating: 4.9,
    reviews: 1567,
    inStock: true,
    supportsGB2: true,
    tiers: tierConfigs,
    specs: {
      'Display': '16.2" Liquid Retina XDR',
      'Chip': 'M3 Max',
      'Memory': '36GB unified',
      'Storage': '1TB SSD',
      'Battery': '22 hours',
    },
    variants: {
      colors: [
        { name: 'Space Black', hex: '#1A202C' },
        { name: 'Silver', hex: '#E2E8F0' },
      ],
    },
  },
];

export const demoUsers: User[] = [
  {
    id: 'demo-buyer',
    email: 'demo@sidrat.com',
    name: 'Demo Buyer',
    role: 'buyer',
    bonusBalance: 1000,
    referralCode: 'DEMO123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-seller',
    email: 'seller@sidrat.com',
    name: 'Demo Seller',
    role: 'seller',
    bonusBalance: 500,
    referralCode: 'SELLER123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-admin',
    email: 'admin@sidrat.com',
    name: 'Admin User',
    role: 'admin',
    bonusBalance: 0,
    referralCode: 'ADMIN123',
    createdAt: new Date().toISOString(),
  },
];

export const initializeMockData = () => {
  if (!localStorage.getItem('products')) {
    localStorage.setItem('products', JSON.stringify(products));
  }
  if (!localStorage.getItem('demoUsers')) {
    localStorage.setItem('demoUsers', JSON.stringify(demoUsers));
  }
  if (!localStorage.getItem('gb2Sessions')) {
    localStorage.setItem('gb2Sessions', JSON.stringify([]));
  }
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify([]));
  }
  if (!localStorage.getItem('bonusTransactions')) {
    localStorage.setItem('bonusTransactions', JSON.stringify([]));
  }
};