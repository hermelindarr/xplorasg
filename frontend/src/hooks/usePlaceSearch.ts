/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
// Estado del buscador de lugares: filtros, paginación y carga desde el catálogo.
// Lo comparten la portada (resultados al buscar) y Explorar (catálogo completo).
// Las consultas son las mismas de siempre: `catalogApi.places`, `municipalities` y `categories`.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { catalogApi } from '../services/catalogApi';
import { trackEvent } from '../services/feedbackApi';
import type { Category, Municipality, Place } from '../types/catalog';

export const PLACE_PAGE_SIZE = 24;

export interface PlaceFilters {
  search?: string;
  municipality?: string;
  category?: string;
}

interface Options {
  /** Filtros con los que arranca la vista (p. ej. los que llegan en la URL). */
  initial?: PlaceFilters;
  /** Se llama después de buscar o elegir categoría, para llevar la vista a los resultados. */
  onResults?: () => void;
}

export const usePlaceSearch = ({ initial, onResults }: Options = {}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [totalPlaces, setTotalPlaces] = useState(0);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [municipality, setMunicipality] = useState(initial?.municipality ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [searchInput, setSearchInput] = useState(initial?.search ?? '');
  const [search, setSearch] = useState(initial?.search ?? '');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storedAt, setStoredAt] = useState('');
  // Categorías presentes y muestra del catálogo sin filtros (alimentan la portada y los chips).
  const [presentCategories, setPresentCategories] = useState<string[]>([]);
  const [catalogSample, setCatalogSample] = useState<Place[]>([]);

  // Opciones de los filtros (una sola vez)
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([catalogApi.municipalities(controller.signal), catalogApi.categories(controller.signal)])
      .then(([municipalityResponse, categoryResponse]) => {
        setMunicipalities(municipalityResponse.data);
        setCategories(categoryResponse.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const loadPlaces = useCallback(
    (currentPage: number, append: boolean, signal?: AbortSignal) => {
      setLoading(true);
      setError(false);
      return catalogApi
        .places(
          { municipio: municipality || undefined, categoria: category || undefined, q: search || undefined, page: currentPage, limit: PLACE_PAGE_SIZE },
          signal,
        )
        .then((response) => {
          setPlaces((previous) => (append ? [...previous, ...response.data] : response.data));
          setTotalPlaces(response.pagination.total);
          setHasMore(response.pagination.page * response.pagination.limit < response.pagination.total);
          setStoredAt(response._offline && response._storedAt ? response._storedAt : '');
          if (!municipality && !category && !search && currentPage === 1) {
            setPresentCategories([...new Set(response.data.map((place) => place.categoria))]);
            setCatalogSample(response.data);
          }
        })
        .catch((requestError) => {
          if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
          setError(true);
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    [municipality, category, search],
  );

  useEffect(() => {
    const controller = new AbortController();
    setPage(1);
    void loadPlaces(1, false, controller.signal);
    return () => controller.abort();
  }, [loadPlaces]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    void loadPlaces(nextPage, true);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = searchInput.trim();
    setSearch(term);
    if (term) trackEvent('busqueda', { termino: term });
    onResults?.();
  };

  const quickSearch = (term: string) => {
    setSearchInput(term);
    setSearch(term);
    trackEvent('busqueda', { termino: term });
    onResults?.();
  };

  /** Activa la categoría o la quita si ya estaba activa. */
  const toggleCategory = (name: string) => {
    setCategory((current) => (current === name ? '' : name));
    onResults?.();
  };

  const clearFilters = () => {
    setMunicipality('');
    setCategory('');
    setSearch('');
    setSearchInput('');
  };

  // Sólo se ofrecen las categorías que tienen lugares publicados.
  const filterCategories = useMemo(
    () => categories.filter((item) => !presentCategories.length || presentCategories.includes(item.nombre)),
    [categories, presentCategories],
  );

  return {
    places, totalPlaces, hasMore, loading, error, storedAt, loadMore,
    municipalities, categories, filterCategories, presentCategories, catalogSample,
    municipality, setMunicipality, category, setCategory, toggleCategory,
    searchInput, setSearchInput, search, submitSearch, quickSearch, clearFilters,
    filtersActive: Boolean(municipality || category || search),
  };
};

export type PlaceSearch = ReturnType<typeof usePlaceSearch>;
