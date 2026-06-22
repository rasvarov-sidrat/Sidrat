import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Filter, TrendingUp, Users, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SessionCard from '@/components/gb2/SessionCard';
import { GB2Session, User } from '@/types';
import { useI18n } from '@/i18n/I18nProvider';

interface SessionsProps {
  user: User | null;
}

export default function Sessions({ user }: SessionsProps) {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<GB2Session[]>([]);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [sortBy, setSortBy] = useState<'participants' | 'discount'>('participants');
  const [stats, setStats] = useState({ total: 0, participants: 0, maxDiscount: 0 });

  useEffect(() => {
    const storedSessions = JSON.parse(localStorage.getItem('gb2Sessions') || '[]');
    const allSessions = storedSessions.filter((s: GB2Session) => s.status === 'active');
    
    // Calculate stats
    const totalParticipants = allSessions.reduce((sum: number, s: GB2Session) => 
      sum + s.participants.length, 0);
    const maxDisc = allSessions.length > 0 
      ? Math.max(...allSessions.map((s: GB2Session) => s.currentTier.discount))
      : 0;
    
    setStats({
      total: allSessions.length,
      participants: totalParticipants,
      maxDiscount: maxDisc
    });

    // Filter and sort
    let filtered = allSessions;
    if (filter === 'my' && user) {
      filtered = allSessions.filter((s: GB2Session) => 
        s.creatorId === user.id || s.participants.some((p: any) => p.userId === user.id)
      );
    }

    filtered.sort((a: GB2Session, b: GB2Session) => {
      if (sortBy === 'participants') {
        return b.participants.length - a.participants.length;
      }
      return b.currentTier.discount - a.currentTier.discount;
    });

    setSessions(filtered);
  }, [filter, sortBy, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('gb2.title', 'gb2')}</h1>
          <p className="text-gray-600 mt-1">Покупайте вместе, экономьте больше!</p>
        </div>
        <Link to="/catalog">
          <Button className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Создать сессию
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Активных сессий</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-[#2A7F6E]/10 rounded-full flex items-center justify-center">
              <Filter className="w-6 h-6 text-[#2A7F6E]" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Всего участников</p>
              <p className="text-2xl font-bold text-gray-900">{stats.participants}</p>
            </div>
            <div className="w-12 h-12 bg-[#C5A059]/10 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#C5A059]" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Макс. скидка</p>
              <p className="text-2xl font-bold text-[#C5A059]">{stats.maxDiscount}%</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'my')}>
          <TabsList>
            <TabsTrigger value="all">Все сессии</TabsTrigger>
            {user && <TabsTrigger value="my">Мои сессии</TabsTrigger>}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Сортировать:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'participants' | 'discount')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2A7F6E]"
          >
            <option value="participants">По участникам</option>
            <option value="discount">По скидке</option>
          </select>
        </div>
      </div>

      {/* Sessions Grid */}
      {sessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Нет активных сессий</h3>
          <p className="text-gray-500 mb-4">Будьте первым, кто создаст групповую покупку!</p>
          <Link to="/catalog">
            <Button className="bg-[#2A7F6E] hover:bg-[#236b5d] text-white">
              Выбрать товар
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}