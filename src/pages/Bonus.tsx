import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { User, BonusTransaction } from '@/types';

interface BonusProps {
  user: User;
}

export default function Bonus({ user }: BonusProps) {
  const [transactions, setTransactions] = useState<BonusTransaction[]>([]);
  const [stats, setStats] = useState({ earned: 0, spent: 0 });

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('bonusTransactions') || '[]');
    const userTrans = all.filter((t: BonusTransaction) => t.userId === user.id);
    setTransactions(userTrans);
    
    const earned = userTrans.filter((t: BonusTransaction) => t.type === 'earned').reduce((sum: number, t: BonusTransaction) => sum + t.amount, 0);
    const spent = userTrans.filter((t: BonusTransaction) => t.type === 'spent').reduce((sum: number, t: BonusTransaction) => sum + t.amount, 0);
    setStats({ earned, spent });
  }, [user.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Бонусный кошелёк</h1>

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-[#C5A059] to-[#b08d4b] rounded-2xl p-8 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-lg mb-2">Текущий баланс</p>
            <p className="text-5xl font-bold">{user.bonusBalance}</p>
            <p className="text-white/60 text-sm mt-2">1 бонус = $1</p>
          </div>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet className="w-10 h-10" />
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Всего начислено</p>
              <p className="text-2xl font-bold text-green-600">{stats.earned}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Всего списано</p>
              <p className="text-2xl font-bold text-red-600">{stats.spent}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowDownRight className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">История операций</h3>
        </div>
        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                    t.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {t.type === 'earned' ? (
                      <Gift className={`w-5 h-5 text-green-600`} />
                    ) : (
                      <ArrowDownRight className={`w-5 h-5 text-red-600`} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(t.createdAt).toLocaleDateString()} • {new Date(t.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-lg ${t.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'earned' ? '+' : '-'}{t.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">История операций пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}