// Lista de lugares del catálogo: chips de categoría, contador, avisos (sin conexión, error),
// esqueletos de carga, cuadrícula de tarjetas, "Cargar más" y estado vacío.
import { PlaceCard } from '../PlaceCard';
import { CloseIcon } from '../brand/icons';
import { useLanguage, useMessages } from '../../i18n';
import { catalogMessages } from '../../i18n/catalog';
import { categoryLabel, common } from '../../i18n/common';
import type { PlaceSearch } from '../../hooks/usePlaceSearch';
import { openAssistant } from '../home/homeData';

const chipClass = (active: boolean) => `inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
  active ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-blue/15 bg-transparent text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
}`;

const GRID = 'mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-w-0';

export const PlaceResults = ({ catalog }: { catalog: PlaceSearch }) => {
  const m = useMessages(catalogMessages);
  const c = useMessages(common);
  const { lang, locale } = useLanguage();
  const {
    places, totalPlaces, hasMore, loading, error, storedAt, loadMore, filterCategories,
    municipality, setMunicipality, category, setCategory, search, clearFilters, filtersActive,
  } = catalog;
  const offlineDate = storedAt ? new Date(storedAt).toLocaleString(locale) : '';

  return (
    <>
      <div className="mt-10 flex flex-col gap-4 border-y border-brand-sand py-4 lg:flex-row lg:items-center">
        <div role="group" aria-label={m.category} className="snap-rail -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
          <button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={chipClass(!category)}>
            {m.allCategories}
          </button>
          {filterCategories.map((item) => {
            const active = category === item.nombre;
            return (
              <button key={item.id} type="button" aria-pressed={active} onClick={() => setCategory(active ? '' : item.nombre)} className={chipClass(active)}>
                {categoryLabel(item.nombre, lang)}
              </button>
            );
          })}
          {municipality && (
            <button type="button" onClick={() => setMunicipality('')} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-brand-green/40 bg-brand-green/5 px-4 py-2 text-sm text-brand-green transition-colors duration-300 hover:bg-brand-green/10">
              {municipality}
              <CloseIcon className="size-3.5 opacity-70" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 lg:ml-auto">
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">
              <CloseIcon className="size-3.5" />
              {m.clearFilters}
            </button>
          )}
          <p className="whitespace-nowrap text-sm text-brand-blue/70" aria-live="polite">
            {loading ? c.loading : m.results(totalPlaces, search)}
          </p>
        </div>
      </div>

      {offlineDate && (
        <p role="status" className="mt-6 inline-flex rounded-full border border-ochre-300 bg-ochre-50 px-4 py-2 text-sm font-medium text-ochre-900">
          {m.offline(offlineDate)}
        </p>
      )}
      {error && <div role="alert" className="mt-8 rounded-xl border border-clay-200 bg-clay-50 p-4 text-sm font-medium text-clay-800">{m.loadError}</div>}

      {loading && !places.length ? (
        <div className={GRID}>
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-[26rem] animate-pulse rounded-xl bg-brand-sand/50" />)}
        </div>
      ) : places.length ? (
        <>
          <div className={GRID}>
            {places.map((place) => <PlaceCard key={place.id} place={place} />)}
          </div>
          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button type="button" onClick={loadMore} disabled={loading} className="btn btn-secondary min-h-12 px-9">
                {loading ? c.loading : m.loadMore}
              </button>
            </div>
          )}
        </>
      ) : (
        !error && (
          <div className="mt-10 rounded-xl bg-brand-light px-6 py-16 text-center">
            <h3 className="font-display text-2xl text-brand-blue">{m.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-brand-blue/70">{m.emptyText}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="btn btn-primary">{m.clearFilters}</button>
              )}
              <button type="button" onClick={openAssistant} className="btn btn-secondary">{m.askAssistant}</button>
            </div>
          </div>
        )
      )}
    </>
  );
};
