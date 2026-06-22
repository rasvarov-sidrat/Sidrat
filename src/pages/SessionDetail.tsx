import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  Package, 
  ChevronLeft, 
  TrendingDown, 
  Sparkles,
  ShoppingCart,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useStore } from '@/stores/store';
import { formatPrice, getCurrentTier, getNextTierInfo } from '@/lib/utils';
import { DISCOUNT_TIERS } from '@/lib/utils';

interface SessionParticipant {
  userId: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  joinedAt: string;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface Session {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled';
  participants: SessionParticipant[];
  products: any[];
  createdAt: Date;
  createdBy: string;
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('gb2Sessions') || '[]');
    const found = sessions.find((s: any) => s.id === id);
    if (found) {
      setSession(found);
    }
    setLoading(false);
  }, [id]);

  const totalUnits = useMemo(() => {
    if (!session) return 0;
    return session.participants.reduce((sum, p) => sum + (p.quantity || 1), 0);
  }, [session]);

  const currentTier = useMemo(() => {
    if (!session) return null;
    return getCurrentTier(totalUnits, DISCOUNT_TIERS);
  }, [totalUnits]);

  const nextTierInfo = useMemo(() => {
    if (!session) return null;
    return getNextTierInfo(totalUnits, DISCOUNT_TIERS);
  }, [totalUnits]);

  const progressPercent = nextTierInfo
    ? (totalUnits / nextTierInfo.nextTier.minUnits) * 100
    : 100;

  const handleCopyLink = () => {
    if (!user) {
      toast.error('Войдите, чтобы получить ссылку');
      return;
    }
    const link = `${window.location.origin}/session/${id}?ref=${user.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Ссылка скопирована!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = () => {
    if (!user) {
      toast.error('Войдите, чтобы присоединиться');
      return;
    }
    if (!session) return;

    const isAlreadyJoined = session.participants.some(p => p.userId === user.id);
    if (isAlreadyJoined) {
      toast.error('Вы уже участвуете в этой сессии');
      return;
    }

    const newParticipant: SessionParticipant = {
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      joinedAt: new Date().toISOString(),
      quantity: 1,
    };

    const sessions = JSON.parse(localStorage.getItem('gb2Sessions') || '[]');
    const index = sessions.findIndex((s: any) => s.id === id);
    sessions[index].participants.push(newParticipant);
    localStorage.setItem('gb2Sessions', JSON.stringify(sessions));

    setSession(sessions[index]);
    toast.success('Вы присоединились к сессии!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">Сессия не найдена</p>
            <Button onClick={() => navigate('/sessions')}>К списку сессий</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isParticipant = user && session.participants.some(p => p.userId === user.id);
  const isCreator = user && session.createdBy === user.id;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{session.name || 'Групповая сессия'}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {session.participants.length} участников
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.status === 'active' ? 'Активна' : 'Завершена'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Discount Status Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  currentTier?.discountPercent > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {currentTier?.discountPercent > 0 ? (
                    <Sparkles className="h-6 w-6" />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Текущая скидка</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {currentTier?.discountPercent > 0 ? `-${currentTier.discountPercent}%` : 'Розница'}
                    </span>
                    {currentTier && currentTier.discountPercent > 0 && (
                      <Badge variant="secondary">{currentTier.label}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {nextTierInfo && (
                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">
                      До скидки {nextTierInfo.nextTier.discountPercent}% 
                      <span className="text-gray-400"> ({nextTierInfo.nextTier.label})</span>
                    </span>
                    <span className="font-medium">
                      ещё {nextTierInfo.unitsNeeded} шт.
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                  <p className="text-xs text-gray-500 mt-2">
                    Добавьте ещё {nextTierInfo.unitsNeeded} единиц для скидки {nextTierInfo.nextTier.discountPercent}%
                  </p>
                </div>
              )}

              <div className="text-center lg:text-right">
                <p className="text-sm text-gray-500">Всего единиц</p>
                <p className="text-3xl font-bold text-primary">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {session.products && session.products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.products.map((product, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                      {currentTier && currentTier.discountPercent > 0 && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Товары в этой сессии пока не добавлены</p>
            </CardContent>
          </Card>
        )}

        {/* Participants List */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Участники ({session.participants.length})
            </h3>
            <div className="space-y-2">
              {session.participants.map((participant, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      {participant.user.avatar ? (
                        <img src={participant.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {participant.user.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{participant.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(participant.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{participant.quantity || 1} шт.</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-gray-500">
                {totalUnits} единиц • Скидка {currentTier?.discountPercent || 0}%
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? 'Скопировано' : 'Скопировать ссылку'}
              </Button>
              {!isParticipant && session.status === 'active' && (
                <Button onClick={handleJoin} className="bg-primary hover:bg-primary/90">
                  <Users className="h-4 w-4 mr-2" />
                  Присоединиться
                </Button>
              )}
              {isParticipant && (
                <Button disabled variant="outline" className="text-green-600">
                  ✓ Вы участвуете
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}