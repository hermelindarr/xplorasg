import { useEffect } from 'react';

const setMeta = (selector: string, content: string) => {
  document.querySelector(selector)?.setAttribute('content', content);
};

// Descripción general del sitio (index.html), para volver a ella en páginas sin descripción propia.
const DEFAULT_DESCRIPTION = typeof document === 'undefined'
  ? ''
  : document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';

/** Título de la pestaña y descripción por página (mejora SEO y al compartir enlaces). */
export const usePageTitle = (title: string | null | undefined, description?: string | null) => {
  useEffect(() => {
    if (!title) return;
    const full = `${title} | XploraSG`;
    document.title = full;
    setMeta('meta[property="og:title"]', full);
    setMeta('meta[property="og:url"]', window.location.href);
    const short = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 160);
    setMeta('meta[name="description"]', short);
    setMeta('meta[property="og:description"]', short);
  }, [title, description]);
};
