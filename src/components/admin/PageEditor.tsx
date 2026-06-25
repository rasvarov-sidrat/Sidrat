import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, EyeOff, Plus, Save, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import type { CmsBlock, CmsMediaAsset, CmsPage } from '@/types';
import { useToast } from '@/components/ui/use-toast';

const PAGE_META: Record<string, { label: string; path: string }> = {
  home: { label: 'Главная', path: '/' },
  catalog: { label: 'Каталог', path: '/catalog' },
  'product-detail': { label: 'Карточка товара', path: '/catalog' },
};

const BLOCK_TYPES = [
  { value: 'feature_list', label: 'Список преимуществ' },
  { value: 'cta', label: 'Призыв к действию (кнопка)' },
  { value: 'text', label: 'Текстовый блок' },
  { value: 'promo_banner', label: 'Промо-баннер' },
  { value: 'media', label: 'Блок с картинкой' },
  { value: 'faq', label: 'FAQ' },
];

type BlockDraft = {
  blockType: string;
  position: number;
  visible: boolean;
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  mediaAssetId: string;
  status: string;
  featureItems: string;
};

function emptyBlockDraft(position: number): BlockDraft {
  return {
    blockType: 'text',
    position,
    visible: true,
    title: '',
    subtitle: '',
    body: '',
    ctaText: '',
    ctaLink: '',
    mediaAssetId: '',
    status: 'published',
    featureItems: '',
  };
}

function blockToDraft(block: CmsBlock): BlockDraft {
  const items = Array.isArray(block.props?.items) ? (block.props?.items as string[]).join('\n') : '';
  return {
    blockType: block.blockType,
    position: block.position,
    visible: block.visible,
    title: block.title || '',
    subtitle: block.subtitle || '',
    body: block.body || '',
    ctaText: block.ctaText || '',
    ctaLink: block.ctaLink || '',
    mediaAssetId: block.mediaAssetId || '',
    status: block.status,
    featureItems: items,
  };
}

function draftToPayload(draft: BlockDraft) {
  const props =
    draft.blockType === 'feature_list'
      ? { items: draft.featureItems.split('\n').map((line) => line.trim()).filter(Boolean) }
      : undefined;

  return {
    blockType: draft.blockType,
    position: draft.position,
    visible: draft.visible,
    title: draft.title.trim() || null,
    subtitle: draft.subtitle.trim() || null,
    body: draft.body.trim() || null,
    ctaText: draft.ctaText.trim() || null,
    ctaLink: draft.ctaLink.trim() || null,
    mediaAssetId: draft.mediaAssetId || null,
    status: draft.status,
    props,
  };
}

interface PageEditorProps {
  pages: CmsPage[];
  mediaAssets: CmsMediaAsset[];
  loadError: string | null;
  onRefresh: () => void;
}

export default function PageEditor({ pages, mediaAssets, loadError, onRefresh }: PageEditorProps) {
  const { toast } = useToast();
  const [selectedPageId, setSelectedPageId] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageSeoTitle, setPageSeoTitle] = useState('');
  const [pageSeoDescription, setPageSeoDescription] = useState('');
  const [pageStatus, setPageStatus] = useState('draft');
  const [blockDrafts, setBlockDrafts] = useState<Record<string, BlockDraft>>({});
  const [newBlockType, setNewBlockType] = useState('text');
  const [savingBlockId, setSavingBlockId] = useState<string | null>(null);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === selectedPageId) || pages[0] || null,
    [pages, selectedPageId],
  );

  useEffect(() => {
    if (selectedPage) {
      setSelectedPageId(selectedPage.id);
      setPageTitle(selectedPage.title);
      setPageSeoTitle(selectedPage.seoTitle || '');
      setPageSeoDescription(selectedPage.seoDescription || '');
      setPageStatus(selectedPage.status);
      const drafts: Record<string, BlockDraft> = {};
      for (const block of selectedPage.blocks) {
        drafts[block.id] = blockToDraft(block);
      }
      setBlockDrafts(drafts);
    }
  }, [selectedPage]);

  const pageMeta = selectedPage ? PAGE_META[selectedPage.slug] : null;

  const updateBlockDraft = (blockId: string, patch: Partial<BlockDraft>, source?: CmsBlock) => {
    setBlockDrafts((current) => {
      const base = current[blockId] || (source ? blockToDraft(source) : emptyBlockDraft(1));
      return { ...current, [blockId]: { ...base, ...patch } };
    });
  };

  const savePageMeta = async () => {
    if (!selectedPage) return;
    try {
      await apiFetch(`/api/v1/admin/content/pages/${selectedPage.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          slug: selectedPage.slug,
          title: pageTitle.trim(),
          templateKey: selectedPage.templateKey,
          seoTitle: pageSeoTitle.trim() || null,
          seoDescription: pageSeoDescription.trim() || null,
          status: pageStatus,
          settings: selectedPage.settings || {},
        }),
      });
      toast({ title: 'Настройки страницы сохранены' });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить страницу',
        variant: 'destructive',
      });
    }
  };

  const publishPage = async () => {
    if (!selectedPage) return;
    try {
      await apiFetch(`/api/v1/admin/content/pages/${selectedPage.id}/publish`, { method: 'POST' });
      toast({ title: 'Страница опубликована' });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось опубликовать',
        variant: 'destructive',
      });
    }
  };

  const saveBlock = async (blockId: string) => {
    if (!selectedPage) return;
    const draft = blockDrafts[blockId];
    if (!draft) return;
    setSavingBlockId(blockId);
    try {
      if (blockId.startsWith('new-')) {
        await apiFetch(`/api/v1/admin/content/pages/${selectedPage.id}/blocks`, {
          method: 'POST',
          body: JSON.stringify(draftToPayload(draft)),
        });
      } else {
        await apiFetch(`/api/v1/admin/content/blocks/${blockId}`, {
          method: 'PATCH',
          body: JSON.stringify(draftToPayload(draft)),
        });
      }
      toast({ title: 'Блок сохранён' });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сохранить блок',
        variant: 'destructive',
      });
    } finally {
      setSavingBlockId(null);
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (blockId.startsWith('new-')) {
      setBlockDrafts((current) => {
        const next = { ...current };
        delete next[blockId];
        return next;
      });
      return;
    }
    try {
      await apiFetch(`/api/v1/admin/content/blocks/${blockId}`, { method: 'DELETE' });
      toast({ title: 'Блок удалён' });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось удалить блок',
        variant: 'destructive',
      });
    }
  };

  const addBlock = () => {
    if (!selectedPage) return;
    const nextPosition = (selectedPage.blocks.length || 0) + Object.keys(blockDrafts).filter((id) => id.startsWith('new-')).length + 1;
    const id = `new-${Date.now()}`;
    setBlockDrafts((current) => ({
      ...current,
      [id]: { ...emptyBlockDraft(nextPosition), blockType: newBlockType },
    }));
  };

  if (loadError) {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-bold text-gray-900">Страницы не загрузились</h2>
          <p className="text-sm text-gray-600">{loadError}</p>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Что проверить:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Backend запущен на порту 8006</li>
              <li>Вы вошли как admin (admin@example.com)</li>
              <li>После обновления кода backend перезапущен</li>
            </ol>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-gray-700">
              cd backend{'\n'}py -3 -m uvicorn app.main:app --reload --port 8006
            </pre>
          </div>
          <Button onClick={onRefresh} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
            Повторить загрузку
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!selectedPage) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          Страниц пока нет. Перезапустите backend — demo-страницы создаются автоматически при старте.
        </CardContent>
      </Card>
    );
  }

  const sortedBlocks = [
    ...selectedPage.blocks,
    ...Object.entries(blockDrafts)
      .filter(([id]) => id.startsWith('new-'))
      .map(([id, draft]) => ({
        id,
        blockType: draft.blockType,
        position: draft.position,
        visible: draft.visible,
        title: draft.title,
        subtitle: draft.subtitle,
        body: draft.body,
        ctaText: draft.ctaText,
        ctaLink: draft.ctaLink,
        mediaAssetId: draft.mediaAssetId,
        status: draft.status,
        pageId: selectedPage.id,
        props: null,
        templateKey: null,
        createdAt: '',
        updatedAt: '',
      })),
  ].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[#2A7F6E]">Редактор страниц</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{pageMeta?.label || selectedPage.title}</h2>
          <p className="mt-1 text-sm text-gray-500">
            /{selectedPage.slug} · {pageStatus === 'published' ? 'опубликовано' : 'черновик'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pageMeta ? (
            <Button asChild variant="outline">
              <a href={pageMeta.path} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Открыть на сайте
              </a>
            </Button>
          ) : null}
          <Button variant="outline" onClick={publishPage}>
            <Upload className="mr-2 h-4 w-4" />
            Опубликовать
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-3">
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Страницы сайта</p>
            <div className="mt-2 space-y-1">
              {pages.map((page) => {
                const meta = PAGE_META[page.slug];
                const active = page.id === selectedPage.id;
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPageId(page.id)}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                      active ? 'bg-[#2A7F6E]/10 text-[#2A7F6E]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium">{meta?.label || page.title}</p>
                    <p className="text-xs opacity-70">/{page.slug}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="text-lg font-semibold text-gray-900">Основные настройки</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label>Название страницы</Label>
                  <Input value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} placeholder="Главная" />
                </div>
                <div>
                  <Label>Статус</Label>
                  <Select value={pageStatus} onValueChange={setPageStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="published">Опубликовано</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <details className="rounded-2xl bg-gray-50 p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700">SEO (необязательно)</summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <Label>SEO заголовок</Label>
                    <Input value={pageSeoTitle} onChange={(e) => setPageSeoTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>SEO описание</Label>
                    <Textarea value={pageSeoDescription} onChange={(e) => setPageSeoDescription(e.target.value)} rows={3} />
                  </div>
                </div>
              </details>
              <Button onClick={savePageMeta} className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]">
                <Save className="mr-2 h-4 w-4" />
                Сохранить настройки
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Блоки на странице</h3>
              <p className="text-sm text-gray-500">Редактируйте тексты и кнопки прямо здесь — без JSON.</p>
            </div>
            <div className="flex gap-2">
              <Select value={newBlockType} onValueChange={setNewBlockType}>
                <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={addBlock}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить блок
              </Button>
            </div>
          </div>

          {sortedBlocks.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-gray-500">
                На этой странице пока нет блоков. Нажмите «Добавить блок».
              </CardContent>
            </Card>
          ) : null}

          {sortedBlocks.map((block) => {
            const cmsBlock = block as CmsBlock;
            const draft = blockDrafts[block.id] || blockToDraft(cmsBlock);
            const typeLabel = BLOCK_TYPES.find((item) => item.value === draft.blockType)?.label || draft.blockType;

            return (
              <Card key={block.id} className={draft.visible ? '' : 'opacity-60'}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2A7F6E]">{typeLabel}</p>
                      <p className="text-sm text-gray-500">Блок #{draft.position}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateBlockDraft(block.id, { visible: !draft.visible }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                      >
                        {draft.visible ? <Eye className="mr-1 h-4 w-4" /> : <EyeOff className="mr-1 h-4 w-4" />}
                        {draft.visible ? 'Виден' : 'Скрыт'}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => void deleteBlock(block.id)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Удалить
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#2A7F6E] text-white hover:bg-[#236b5d]"
                        disabled={savingBlockId === block.id}
                        onClick={() => void saveBlock(block.id)}
                      >
                        <Save className="mr-1 h-4 w-4" />
                        {savingBlockId === block.id ? 'Сохранение…' : 'Сохранить блок'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Заголовок</Label>
                      <Input
                        value={draft.title}
                        onChange={(e) => updateBlockDraft(block.id, { title: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                        placeholder="Например: Покупайте вместе"
                      />
                    </div>
                    <div>
                      <Label>Подзаголовок</Label>
                      <Input
                        value={draft.subtitle}
                        onChange={(e) => updateBlockDraft(block.id, { subtitle: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                        placeholder="Короткая строка над заголовком"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Текст блока</Label>
                    <Textarea
                      value={draft.body}
                      onChange={(e) => updateBlockDraft(block.id, { body: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                      rows={4}
                      placeholder="Основной текст, который увидят пользователи"
                    />
                  </div>

                  {(draft.blockType === 'cta' || draft.blockType === 'promo_banner') && (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Текст кнопки</Label>
                        <Input
                          value={draft.ctaText}
                          onChange={(e) => updateBlockDraft(block.id, { ctaText: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                          placeholder="Подать заявку продавца"
                        />
                      </div>
                      <div>
                        <Label>Ссылка кнопки</Label>
                        <Input
                          value={draft.ctaLink}
                          onChange={(e) => updateBlockDraft(block.id, { ctaLink: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                          placeholder="/seller-application"
                        />
                      </div>
                    </div>
                  )}

                  {draft.blockType === 'feature_list' && (
                    <div>
                      <Label>Пункты списка (каждый с новой строки)</Label>
                      <Textarea
                        value={draft.featureItems}
                        onChange={(e) => updateBlockDraft(block.id, { featureItems: e.target.value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                        rows={4}
                        placeholder={'Групповые покупки 2.0\nПошаговая скидка\nWallet-логика'}
                      />
                    </div>
                  )}

                  {draft.blockType === 'media' && (
                    <div>
                      <Label>Картинка из медиатеки</Label>
                      <Select
                        value={draft.mediaAssetId || 'none'}
                        onValueChange={(value) => updateBlockDraft(block.id, { mediaAssetId: value === 'none' ? '' : value }, cmsBlock.id.startsWith('new-') ? undefined : cmsBlock)}
                      >
                        <SelectTrigger><SelectValue placeholder="Выберите картинку" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без картинки</SelectItem>
                          {mediaAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>{asset.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Предпросмотр</p>
                    {draft.subtitle ? <p className="mt-2 text-sm text-[#2A7F6E]">{draft.subtitle}</p> : null}
                    {draft.title ? <p className="mt-1 text-lg font-semibold text-gray-900">{draft.title}</p> : null}
                    {draft.body ? <p className="mt-2 text-sm text-gray-600">{draft.body}</p> : null}
                    {draft.blockType === 'feature_list' && draft.featureItems ? (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {draft.featureItems.split('\n').filter(Boolean).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    {draft.ctaText ? (
                      <span className="mt-3 inline-block rounded-full bg-[#2A7F6E] px-4 py-2 text-sm text-white">{draft.ctaText}</span>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
