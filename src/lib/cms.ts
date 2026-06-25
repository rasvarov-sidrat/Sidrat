import { apiFetch } from '@/lib/api';
import type { CmsHeroSlide, CmsPage, ProductDisplayConfig } from '@/types';

export async function fetchHeroSlides() {
  return apiFetch<CmsHeroSlide[]>('/api/v1/content/hero-slides');
}

export async function fetchCmsPage(slug: string) {
  return apiFetch<CmsPage>(`/api/v1/content/pages/${slug}`);
}

export async function fetchProductDisplay(slug: string) {
  return apiFetch<ProductDisplayConfig>(`/api/v1/content/product-display/${slug}`);
}
