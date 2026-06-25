import { useEffect, useMemo, useState } from 'react';
import { BadgeDollarSign, Blocks, CheckCircle2, Clock3, ImagePlus, LayoutDashboard, LibraryBig, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageEditor from '@/components/admin/PageEditor';
import { apiFetch } from '@/lib/api';
import { approveWithdrawalRequest, formatRuble, loadSessions, loadWithdrawals, updateSessionDeadline } from '@/lib/mvp';
import type {
  CmsBlock,
  CmsHeroSlide,
  CmsMediaAsset,
  CmsPage,
  Product,
  ProductDisplayConfig,
  User,
} from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface AdminDashboardProps {
  user: User;
}

type TabKey = 'overview' | 'content' | 'media' | 'hero' | 'products' | 'users' | 'revisions';

function safeJson(value: string, fallback: unknown) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function prettyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const { toast } = useToast();
  const sessions = loadSessions();
  const withdrawals = loadWithdrawals();
  const [tab, setTab] = useState<TabKey>('overview');
  const [reloadKey, setReloadKey] = useState(0);
  const [deadlineDraft, setDeadlineDraft] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [cmsLoadError, setCmsLoadError] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<CmsMediaAsset[]>([]);
  const [heroSlides, setHeroSlides] = useState<CmsHeroSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productConfigs, setProductConfigs] = useState<Record<string, ProductDisplayConfig>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [revisions, setRevisions] = useState<Array<{ id: string; entityType: string; entityId: string; action: string; note?: string | null; createdAt: string }>>([]);

  const [mediaDraft, setMediaDraft] = useState({
    key: '',
    label: '',
    altText: '',
    kind: 'generic',
    sourceUrl: '',
    mimeType: '',
    width: '',
    height: '',
    usage: '',
    tags: '[]',
    metadata: '{}',
    status: 'published',
  });
  const [heroDraft, setHeroDraft] = useState({
    title: '',
    subtitle: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    mediaAssetId: '',
    position: 1,
    visible: true,
    status: 'published',
    props: '{}',
  });
  const [selectedProductSlug, setSelectedProductSlug] = useState('');
  const [productDraft, setProductDraft] = useState({
    templateKey: 'standard',
    headline: '',
    subtitle: '',
    badgeText: '',
    ctaText: '',
    ctaLink: '',
    heroMediaAssetId: '',
    galleryMediaAssetIds: '[]',
    specs: '{}',
    sections: '[]',
    status: 'draft',
    props: '{}',
  });
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userDraft, setUserDraft] = useState({
    email: '',
    name: '',
    role: 'buyer',
    walletBalance: 0,
    referralCode: '',
    phone: '',
    fullName: '',
    isActive: true,
    password: '',
  });

  const selectedProduct = useMemo(() => products.find((product) => product.slug === selectedProductSlug) || products[0] || null, [products, selectedProductSlug]);
  const selectedUser = useMemo(() => users.find((item) => item.id === selectedUserId) || users[0] || null, [selectedUserId, users]);

  const refresh = () => setReloadKey((current) => current + 1);

  const loadAdminData = async () => {
    setCmsLoadError(null);
    try {
      const [pagesRes, mediaRes, heroRes, productsRes, usersRes, revisionsRes] = await Promise.all([
        apiFetch<CmsPage[]>('/api/v1/admin/content/pages'),
        apiFetch<CmsMediaAsset[]>('/api/v1/admin/content/media'),
        apiFetch<CmsHeroSlide[]>('/api/v1/admin/content/hero-slides'),
        apiFetch<Product[]>('/api/v1/catalog?limit=100'),
        apiFetch<User[]>('/api/v1/admin/content/users'),
        apiFetch<Array<{ id: string; entityType: string; entityId: string; action: string; note?: string | null; createdAt: string }>>('/api/v1/admin/content/revisions'),
      ]);
      setPages(pagesRes);
      setMediaAssets(mediaRes);
      setHeroSlides(heroRes);
      setProducts(productsRes);
      setUsers(usersRes);
      setRevisions(revisionsRes);
      if (!selectedProductSlug && productsRes[0]) setSelectedProductSlug(productsRes[0].slug);
      if (!selectedUserId && usersRes[0]) setSelectedUserId(usersRes[0].id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось загрузить CMS';
      setCmsLoadError(message);
      toast({ title: 'CMS недоступна', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    void loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  useEffect(() => {
    if (selectedProduct) {
      void (async () => {
        try {
          const config = await apiFetch<ProductDisplayConfig>(`/api/v1/admin/content/product-display/${selectedProduct.slug}`);
          setProductConfigs((current) => ({ ...current, [selectedProduct.slug]: config }));
          setProductDraft({
            templateKey: config.templateKey || selectedProduct.variantStrategy || 'standard',
            headline: config.headline || selectedProduct.name,
            subtitle: config.subtitle || selectedProduct.category,
            badgeText: config.badgeText || '',
            ctaText: config.ctaText || '',
            ctaLink: config.ctaLink || '',
            heroMediaAssetId: config.heroMediaAssetId || '',
            galleryMediaAssetIds: JSON.stringify(config.galleryMediaAssetIds || [], null, 2),
            specs: prettyJson(config.specs),
            sections: prettyJson(config.sections),
            status: config.status,
            props: prettyJson(config.props),
          });
        } catch {
          setProductDraft({
            templateKey: selectedProduct.variantStrategy || 'standard',
            headline: selectedProduct.name,
            subtitle: selectedProduct.category,
            badgeText: '',
            ctaText: 'Создать GB-сессию',
            ctaLink: `/session/create/${selectedProduct.slug}`,
            heroMediaAssetId: '',
            galleryMediaAssetIds: prettyJson(selectedProduct.images || []),
            specs: prettyJson(selectedProduct.specs || {}),
            sections: prettyJson([{ type: 'description', title: 'Описание', body: selectedProduct.description }]),
            status: 'draft',
            props: '{}',
          });
        }
      })();
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedUser) {
      setUserDraft({
        email: selectedUser.email,
        name: selectedUser.name,
        role: selectedUser.role,
        walletBalance: selectedUser.walletBalance,
        referralCode: selectedUser.referralCode,
        phone: selectedUser.phone || '',
        fullName: selectedUser.fullName || '',
        isActive: selectedUser.isActive !== false,
        password: '',
      });
    }
  }, [selectedUser]);

  const handleApprove = (requestId: string) => {
    try {
      approveWithdrawalRequest(requestId, user);
      toast({ title: 'Заявка одобрена' });
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось одобрить';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const handleDeadlineSave = (sessionId: string) => {
    const nextValue = deadlineDraft[sessionId];
    if (!nextValue) return;
    try {
      updateSessionDeadline(sessionId, new Date(nextValue).toISOString());
      toast({ title: 'Дедлайн обновлён' });
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось обновить дедлайн';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    }
  };

  const saveMedia = async () => {
    try {
      const payload = {
        key: mediaDraft.key.trim(),
        label: mediaDraft.label.trim(),
        altText: mediaDraft.altText.trim() || null,
        kind: mediaDraft.kind,
        sourceUrl: mediaDraft.sourceUrl.trim(),
        mimeType: mediaDraft.mimeType.trim() || null,
        width: mediaDraft.width ? Number(mediaDraft.width) : null,
        height: mediaDraft.height ? Number(mediaDraft.height) : null,
        usage: mediaDraft.usage.trim() || null,
        tags: safeJson(mediaDraft.tags, []),
        metadata: safeJson(mediaDraft.metadata, {}),
        status: mediaDraft.status,
      };
      await apiFetch('/api/v1/admin/content/media', { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: 'Медиа добавлено' });
      refresh();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сохранить медиа', variant: 'destructive' });
    }
  };

  const saveHero = async () => {
    try {
      const payload = {
        title: heroDraft.title.trim(),
        subtitle: heroDraft.subtitle.trim() || null,
        description: heroDraft.description.trim() || null,
        ctaText: heroDraft.ctaText.trim() || null,
        ctaLink: heroDraft.ctaLink.trim() || null,
        mediaAssetId: heroDraft.mediaAssetId.trim() || null,
        position: Number(heroDraft.position) || 0,
        visible: heroDraft.visible,
        status: heroDraft.status,
        props: safeJson(heroDraft.props, {}),
      };
      await apiFetch('/api/v1/admin/content/hero-slides', { method: 'POST', body: JSON.stringify(payload) });
      toast({ title: 'Hero-слайд добавлен' });
      refresh();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сохранить hero', variant: 'destructive' });
    }
  };

  const saveProductConfig = async () => {
    if (!selectedProduct) return;
    try {
      const payload = {
        templateKey: productDraft.templateKey.trim() || 'standard',
        headline: productDraft.headline.trim() || null,
        subtitle: productDraft.subtitle.trim() || null,
        badgeText: productDraft.badgeText.trim() || null,
        ctaText: productDraft.ctaText.trim() || null,
        ctaLink: productDraft.ctaLink.trim() || null,
        heroMediaAssetId: productDraft.heroMediaAssetId.trim() || null,
        galleryMediaAssetIds: safeJson(productDraft.galleryMediaAssetIds, []),
        specs: safeJson(productDraft.specs, {}),
        sections: safeJson(productDraft.sections, []),
        status: productDraft.status,
        props: safeJson(productDraft.props, {}),
      };
      const config = await apiFetch<ProductDisplayConfig>(`/api/v1/admin/content/product-display/${selectedProduct.slug}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setProductConfigs((current) => ({ ...current, [selectedProduct.slug]: config }));
      toast({ title: 'Карточка товара сохранена' });
      refresh();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сохранить товар', variant: 'destructive' });
    }
  };

  const saveUser = async () => {
    try {
      const payload = {
        email: userDraft.email.trim(),
        name: userDraft.name.trim(),
        role: userDraft.role,
        walletBalance: Number(userDraft.walletBalance) || 0,
        referralCode: userDraft.referralCode.trim() || null,
        phone: userDraft.phone.trim() || null,
        fullName: userDraft.fullName.trim() || null,
        isActive: userDraft.isActive,
        password: userDraft.password.trim() || null,
      };
      if (!selectedUser) {
        await apiFetch('/api/v1/admin/content/users', { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/v1/admin/content/users/${selectedUser.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      }
      toast({ title: 'Пользователь сохранён' });
      refresh();
    } catch (error) {
      toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось сохранить пользователя', variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Admin CMS</p>
        <div className="mt-3 space-y-1">
          {[
            ['overview', LayoutDashboard, 'Обзор'],
            ['content', Blocks, 'Страницы'],
            ['media', ImagePlus, 'Медиа'],
            ['hero', LibraryBig, 'Hero'],
            ['products', ShieldCheck, 'Товары'],
            ['users', Users, 'Пользователи'],
            ['revisions', RotateCcw, 'Ревизии'],
          ].map(([key, Icon, label]) => (
            <button
              key={String(key)}
              type="button"
              onClick={() => setTab(key as TabKey)}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                tab === key ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#2A7F6E]'
              }`}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span className="text-sm font-medium">{label as string}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
          Контент уже хранится в backend. Меняй тексты, баннеры, карточки и пользователей без правок кода.
        </div>
      </aside>

      <div className="space-y-6">
        {tab === 'overview' ? (
          <>
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Панель админа</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">Контроль CMS и операций</h1>
              <p className="mt-2 text-gray-600">Одна панель для контента, медиа, карточек и пользователей.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Страницы</p><p className="mt-2 text-3xl font-bold text-gray-900">{pages.length}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Медиа</p><p className="mt-2 text-3xl font-bold text-gray-900">{mediaAssets.length}</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Пользователи</p><p className="mt-2 text-3xl font-bold text-gray-900">{users.length}</p></CardContent></Card>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeDollarSign className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Заявки на вывод</h2>
                </div>
                <div className="space-y-3">
                  {withdrawals.length > 0 ? withdrawals.map((request) => (
                    <div key={request.id} className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{request.id}</p>
                        <p className="text-sm text-gray-600">{formatRuble(request.amount)} · fee {formatRuble(request.feeAmount)} · net {formatRuble(request.netAmount)} · {request.status}</p>
                      </div>
                      <Button onClick={() => handleApprove(request.id)} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Одобрить
                      </Button>
                    </div>
                  )) : <p className="text-sm text-gray-500">Заявок на вывод нет.</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-[#2A7F6E]" />
                  <h2 className="text-lg font-semibold text-gray-900">Обновление дедлайна сессии</h2>
                </div>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="grid gap-3 rounded-2xl bg-gray-50 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                      <div>
                        <p className="font-medium text-gray-900">{session.title}</p>
                        <p className="text-sm text-gray-500">{session.id}</p>
                      </div>
                      <div>
                        <Label htmlFor={`deadline-${session.id}`}>Истекает</Label>
                        <Input id={`deadline-${session.id}`} type="datetime-local" value={deadlineDraft[session.id] || new Date(session.expiresAt).toISOString().slice(0, 16)} onChange={(event) => setDeadlineDraft((current) => ({ ...current, [session.id]: event.target.value }))} className="mt-1" />
                      </div>
                      <Button onClick={() => handleDeadlineSave(session.id)} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Сохранить</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        {tab === 'content' ? (
          <PageEditor pages={pages} mediaAssets={mediaAssets} loadError={cmsLoadError} onRefresh={refresh} />
        ) : null}

        {tab === 'media' ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Media library</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Картинки и ассеты</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card>
                <CardContent className="p-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {mediaAssets.map((asset) => (
                      <div key={asset.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <img src={asset.sourceUrl} alt={asset.altText || asset.label} className="h-40 w-full object-cover" />
                        <div className="p-3 text-sm">
                          <p className="font-medium text-gray-900">{asset.label}</p>
                          <p className="text-gray-500">{asset.key}</p>
                          <p className="text-xs text-gray-500">{asset.kind} · {asset.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Добавить медиа</h3>
                  <div><Label>Key</Label><Input value={mediaDraft.key} onChange={(e) => setMediaDraft((current) => ({ ...current, key: e.target.value }))} /></div>
                  <div><Label>Label</Label><Input value={mediaDraft.label} onChange={(e) => setMediaDraft((current) => ({ ...current, label: e.target.value }))} /></div>
                  <div><Label>URL</Label><Input value={mediaDraft.sourceUrl} onChange={(e) => setMediaDraft((current) => ({ ...current, sourceUrl: e.target.value }))} /></div>
                  <div><Label>Alt text</Label><Input value={mediaDraft.altText} onChange={(e) => setMediaDraft((current) => ({ ...current, altText: e.target.value }))} /></div>
                  <div><Label>Kind</Label><Input value={mediaDraft.kind} onChange={(e) => setMediaDraft((current) => ({ ...current, kind: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Width</Label><Input value={mediaDraft.width} onChange={(e) => setMediaDraft((current) => ({ ...current, width: e.target.value }))} /></div>
                    <div><Label>Height</Label><Input value={mediaDraft.height} onChange={(e) => setMediaDraft((current) => ({ ...current, height: e.target.value }))} /></div>
                  </div>
                  <div><Label>Usage</Label><Input value={mediaDraft.usage} onChange={(e) => setMediaDraft((current) => ({ ...current, usage: e.target.value }))} /></div>
                  <div><Label>Tags JSON</Label><Textarea value={mediaDraft.tags} onChange={(e) => setMediaDraft((current) => ({ ...current, tags: e.target.value }))} className="font-mono text-sm" rows={3} /></div>
                  <div><Label>Metadata JSON</Label><Textarea value={mediaDraft.metadata} onChange={(e) => setMediaDraft((current) => ({ ...current, metadata: e.target.value }))} className="font-mono text-sm" rows={3} /></div>
                  <Button onClick={saveMedia} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Сохранить медиа</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'hero' ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Hero blocks</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Слайды баннера</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card>
                <CardContent className="p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    {heroSlides.map((slide) => (
                      <div key={slide.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <div className="h-40 bg-gray-100">
                          {slide.image ? <img src={slide.image} alt={slide.subtitle || slide.title} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="p-3 text-sm">
                          <p className="font-medium text-gray-900">{slide.title}</p>
                          <p className="text-gray-500">{slide.subtitle}</p>
                          <p className="text-xs text-gray-500">{slide.status} · {slide.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-3 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Добавить hero</h3>
                  <div><Label>Title</Label><Input value={heroDraft.title} onChange={(e) => setHeroDraft((current) => ({ ...current, title: e.target.value }))} /></div>
                  <div><Label>Subtitle</Label><Input value={heroDraft.subtitle} onChange={(e) => setHeroDraft((current) => ({ ...current, subtitle: e.target.value }))} /></div>
                  <div><Label>Description</Label><Textarea value={heroDraft.description} onChange={(e) => setHeroDraft((current) => ({ ...current, description: e.target.value }))} rows={4} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>CTA text</Label><Input value={heroDraft.ctaText} onChange={(e) => setHeroDraft((current) => ({ ...current, ctaText: e.target.value }))} /></div>
                    <div><Label>CTA link</Label><Input value={heroDraft.ctaLink} onChange={(e) => setHeroDraft((current) => ({ ...current, ctaLink: e.target.value }))} /></div>
                  </div>
                  <div><Label>Media asset id</Label><Input value={heroDraft.mediaAssetId} onChange={(e) => setHeroDraft((current) => ({ ...current, mediaAssetId: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label>Position</Label><Input type="number" value={heroDraft.position} onChange={(e) => setHeroDraft((current) => ({ ...current, position: Number(e.target.value) }))} /></div>
                    <div><Label>Status</Label><Input value={heroDraft.status} onChange={(e) => setHeroDraft((current) => ({ ...current, status: e.target.value }))} /></div>
                  </div>
                  <div><Label>Props JSON</Label><Textarea value={heroDraft.props} onChange={(e) => setHeroDraft((current) => ({ ...current, props: e.target.value }))} className="font-mono text-sm" rows={3} /></div>
                  <Button onClick={saveHero} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Сохранить hero</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'products' ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Product card builder</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Конструктор карточки товара</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {products.map((product) => (
                      <button key={product.slug} type="button" onClick={() => setSelectedProductSlug(product.slug)} className={`w-full rounded-2xl px-3 py-3 text-left ${selectedProduct?.slug === product.slug ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'bg-gray-50 text-gray-700'}`}>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs">{product.slug}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              {selectedProduct ? (
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>Template</Label><Input value={productDraft.templateKey} onChange={(e) => setProductDraft((current) => ({ ...current, templateKey: e.target.value }))} /></div>
                      <div><Label>Status</Label><Input value={productDraft.status} onChange={(e) => setProductDraft((current) => ({ ...current, status: e.target.value }))} /></div>
                    </div>
                    <div><Label>Headline</Label><Input value={productDraft.headline} onChange={(e) => setProductDraft((current) => ({ ...current, headline: e.target.value }))} /></div>
                    <div><Label>Subtitle</Label><Input value={productDraft.subtitle} onChange={(e) => setProductDraft((current) => ({ ...current, subtitle: e.target.value }))} /></div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>Badge text</Label><Input value={productDraft.badgeText} onChange={(e) => setProductDraft((current) => ({ ...current, badgeText: e.target.value }))} /></div>
                      <div><Label>CTA text</Label><Input value={productDraft.ctaText} onChange={(e) => setProductDraft((current) => ({ ...current, ctaText: e.target.value }))} /></div>
                    </div>
                    <div><Label>CTA link</Label><Input value={productDraft.ctaLink} onChange={(e) => setProductDraft((current) => ({ ...current, ctaLink: e.target.value }))} /></div>
                    <div><Label>Hero media asset id</Label><Input value={productDraft.heroMediaAssetId} onChange={(e) => setProductDraft((current) => ({ ...current, heroMediaAssetId: e.target.value }))} /></div>
                    <div><Label>Gallery media asset ids JSON</Label><Textarea value={productDraft.galleryMediaAssetIds} onChange={(e) => setProductDraft((current) => ({ ...current, galleryMediaAssetIds: e.target.value }))} className="font-mono text-sm" rows={3} /></div>
                    <div><Label>Specs JSON</Label><Textarea value={productDraft.specs} onChange={(e) => setProductDraft((current) => ({ ...current, specs: e.target.value }))} className="font-mono text-sm" rows={4} /></div>
                    <div><Label>Sections JSON</Label><Textarea value={productDraft.sections} onChange={(e) => setProductDraft((current) => ({ ...current, sections: e.target.value }))} className="font-mono text-sm" rows={4} /></div>
                    <div><Label>Props JSON</Label><Textarea value={productDraft.props} onChange={(e) => setProductDraft((current) => ({ ...current, props: e.target.value }))} className="font-mono text-sm" rows={3} /></div>
                    <Button onClick={saveProductConfig} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Сохранить карточку</Button>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === 'users' ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Users & sellers</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">Пользователи и роли</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {users.map((item) => (
                      <button key={item.id} type="button" onClick={() => setSelectedUserId(item.id)} className={`w-full rounded-2xl px-3 py-3 text-left ${selectedUser?.id === item.id ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'bg-gray-50 text-gray-700'}`}>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs">{item.email} · {item.role} · {item.isActive === false ? 'disabled' : 'active'}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-4 p-5">
                  <h3 className="text-lg font-semibold text-gray-900">Редактирование пользователя</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div><Label>Email</Label><Input value={userDraft.email} onChange={(e) => setUserDraft((current) => ({ ...current, email: e.target.value }))} /></div>
                    <div><Label>Name</Label><Input value={userDraft.name} onChange={(e) => setUserDraft((current) => ({ ...current, name: e.target.value }))} /></div>
                    <div><Label>Role</Label><Input value={userDraft.role} onChange={(e) => setUserDraft((current) => ({ ...current, role: e.target.value }))} /></div>
                    <div><Label>Wallet balance</Label><Input type="number" value={userDraft.walletBalance} onChange={(e) => setUserDraft((current) => ({ ...current, walletBalance: Number(e.target.value) }))} /></div>
                    <div><Label>Referral code</Label><Input value={userDraft.referralCode} onChange={(e) => setUserDraft((current) => ({ ...current, referralCode: e.target.value }))} /></div>
                    <div><Label>Phone</Label><Input value={userDraft.phone} onChange={(e) => setUserDraft((current) => ({ ...current, phone: e.target.value }))} /></div>
                    <div><Label>Full name</Label><Input value={userDraft.fullName} onChange={(e) => setUserDraft((current) => ({ ...current, fullName: e.target.value }))} /></div>
                    <div><Label>Active</Label><Input value={String(userDraft.isActive)} onChange={(e) => setUserDraft((current) => ({ ...current, isActive: e.target.value === 'true' }))} /></div>
                    <div className="md:col-span-2"><Label>Password (new only)</Label><Input type="password" value={userDraft.password} onChange={(e) => setUserDraft((current) => ({ ...current, password: e.target.value }))} /></div>
                  </div>
                  <Button onClick={saveUser} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">Сохранить пользователя</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {tab === 'revisions' ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Safety workflow</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">История изменений и откат</h2>
            </div>
            <Card>
              <CardContent className="space-y-3 p-5">
                {revisions.length > 0 ? revisions.map((revision) => (
                  <div key={revision.id} className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{revision.entityType} · {revision.action}</p>
                      <p className="text-sm text-gray-600">{revision.entityId}</p>
                      <p className="text-xs text-gray-500">{revision.note || revision.createdAt}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await apiFetch(`/api/v1/admin/content/revisions/${revision.id}/rollback`, { method: 'POST' });
                          toast({ title: 'Откат выполнен' });
                          refresh();
                        } catch (error) {
                          toast({ title: 'Ошибка', description: error instanceof Error ? error.message : 'Не удалось откатить', variant: 'destructive' });
                        }
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rollback
                    </Button>
                  </div>
                )) : <p className="text-sm text-gray-500">История изменений пуста.</p>}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
