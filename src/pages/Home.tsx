import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Gift, Gamepad2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeMockData } from '@/data/mockData';

export default function Home() {
  useEffect(() => {
    initializeMockData();
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Групповые покупки 2.0',
      description: 'Покупайте вместе с друзьями и получайте скидки до 30%',
      color: '#2A7F6E',
    },
    {
      icon: Gift,
      title: 'Реферальная программа',
      description: 'Приглашайте друзей и получайте 500 бонусов за каждого',
      color: '#C5A059',
    },
    {
      icon: Gamepad2,
      title: 'Игра "Плоды лотоса"',
      description: 'Собирайте плоды и обменивайте их на дополнительные скидки',
      color: '#2A7F6E',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#2A7F6E] to-[#236b5d] rounded-3xl overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>
        
        <div className="relative px-8 py-16 md:py-24 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Покупайте вместе,<br />
              <span className="text-[#C5A059]">экономьте больше</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              SIDRAT — это новый способ покупок. Создавайте групповые сессии, 
              приглашайте друзей и получайте эксклюзивные скидки до 30%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/catalog">
                <Button size="lg" className="bg-white text-[#2A7F6E] hover:bg-gray-100 px-8">
                  Начать покупки
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/sessions">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8">
                  <Users className="w-4 h-4 mr-2" />
                  Активные сессии
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Почему SIDRAT?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Мы объединили лучшие практики групповых покупок с игровыми механиками 
            и реферальной программой
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                style={{ backgroundColor: `${feature.color}15` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#C5A059]/10 to-[#2A7F6E]/10 rounded-2xl p-8 md:p-12 text-center">
        <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[#2A7F6E]" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Готовы начать экономить?</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Присоединяйтесь к тысячам пользователей, которые уже покупают умнее вместе с SIDRAT
        </p>
        <Link to="/catalog">
          <Button size="lg" className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white px-8">
            Смотреть каталог
          </Button>
        </Link>
      </section>
    </div>
  );
}