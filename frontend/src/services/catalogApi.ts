import type {
  Category,
  Municipality,
  PaginatedResponse,
  Place,
  TourismService,
} from '../types/catalog';
import { readCatalogCache, writeCatalogCache } from './offlineCatalog';
import { getLang } from '../i18n';

import { API_URL } from '../config/apiUrl';

export class CatalogApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CatalogApiError';
    this.status = status;
  }
}

type WithOffline<T> = T & { _offline?: boolean; _storedAt?: string };

/** Agrega ?lang=en cuando el sitio está en inglés (la caché sin conexión queda separada por idioma). */
const withLang = (path: string) => {
  const lang = getLang();
  if (lang === 'es') return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
};

export const getJson = async <T>(rawPath: string, signal?: AbortSignal): Promise<WithOffline<T>> => {
  const path = withLang(rawPath);
  try {
    const response = await fetch(`${API_URL}${path}`, { signal });
    const body = (await response.json().catch(() => null)) as ({ error?: string } & T) | null;

    if (!response.ok) {
      throw new CatalogApiError(body?.error || (getLang() === 'en' ? 'The catalog could not be loaded.' : 'No fue posible consultar el catálogo.'), response.status);
    }

    await writeCatalogCache(path, body as T);
    return body as WithOffline<T>;
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error;
    }
    if (error instanceof CatalogApiError) {
      throw error;
    }

    const cached = await readCatalogCache<T>(path);
    if (cached !== null) {
      const result = cached.value as WithOffline<T>;
      result._offline = true;
      result._storedAt = cached.storedAt;
      return result;
    }
    throw error;
  }
};

const queryString = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).trim()) {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const catalogApi = {
  municipalities: (signal?: AbortSignal) =>
    getJson<{ data: Municipality[] }>('/api/catalogo/municipios', signal),

  categories: (signal?: AbortSignal) =>
    getJson<{ data: Category[] }>('/api/catalogo/categorias', signal),

  places: (
    filters: { municipio?: string; categoria?: string; q?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) =>
    getJson<PaginatedResponse<Place>>(
      `/api/catalogo/lugares${queryString(filters)}`,
      signal,
    ),

  place: (slug: string, signal?: AbortSignal) =>
    getJson<{ data: Place }>(`/api/catalogo/lugares/${encodeURIComponent(slug)}`, signal),

  services: (
    filters: { municipio?: string; categoria?: string; q?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) =>
    getJson<PaginatedResponse<TourismService>>(
      `/api/catalogo/servicios${queryString(filters)}`,
      signal,
    ),

  service: (slug: string, signal?: AbortSignal) =>
    getJson<{ data: TourismService }>(`/api/catalogo/servicios/${encodeURIComponent(slug)}`, signal),
};



const PREFETCH_KEY = 'xplora:fichasGuardadas';
const PREFETCH_EVERY_MS = 12 * 60 * 60_000;

/**
 * Guarda en el dispositivo el detalle de todos los lugares y servicios para consultarlos sin señal.
 * Se ejecuta en segundo plano, con conexión, como máximo cada 12 horas y por idioma.
 * Son pocas fichas (decenas), así que el costo de datos es bajo.
 */
export const prefetchCatalogDetails = async (): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  // Con "ahorro de datos" o en 2G no se descarga el respaldo completo: sólo queda lo que el visitante abrió.
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (connection?.saveData || connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') return;
  const stampKey = `${PREFETCH_KEY}:${getLang()}`;
  try {
    const last = Number(localStorage.getItem(stampKey) || 0);
    if (Date.now() - last < PREFETCH_EVERY_MS) return;
  } catch {
    return; // sin almacenamiento local no tiene caso guardar fichas
  }
  try {
    const [places, services] = await Promise.all([
      catalogApi.places({ limit: 100 }),
      catalogApi.services({ limit: 100 }),
    ]);
    if (places._offline || services._offline) return;
    const jobs: Array<() => Promise<unknown>> = [
      // La agenda también (mismas rutas que usa agendaApi).
      () => getJson('/api/agenda/eventos?page=1&limit=12'),
      () => getJson('/api/agenda/promociones?page=1&limit=12'),
      ...places.data.map((item) => () => catalogApi.place(item.slug)),
      ...services.data.filter((item) => item.slug).map((item) => () => catalogApi.service(item.slug as string)),
    ];
    // De tres en tres para no saturar una conexión lenta.
    for (let i = 0; i < jobs.length; i += 3) {
      await Promise.allSettled(jobs.slice(i, i + 3).map((job) => job()));
    }
    localStorage.setItem(stampKey, String(Date.now()));
  } catch {
    // Sin red o servidor dormido: se reintenta en la próxima visita.
  }
};
