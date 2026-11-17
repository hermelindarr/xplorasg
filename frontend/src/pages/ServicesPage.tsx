import { useEffect, useMemo, useState } from 'react';
import { ServiceCard } from '../components/ServiceCard';
import { agendaApi, type Promocion } from '../services/agendaApi';
import { PromoCard } from '../components/agenda/PromoCard';
import { catalogApi } from '../services/catalogApi';
import type { TourismService } from '../types/catalog';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { CloseIcon, PinIcon, SearchIcon, CommunityIcon } from '../components/brand/icons';
import { Accented } from '../components/ui/Accented';
import { PageHero } from '../components/ui/PageHero';

const messages = defineMessages({
  title: 'Servicios locales',
  titleAccent: 'locales',
  intro: 'Hospedaje, gastronomía, guías y experiencias ofrecidas por prestadores comunitarios verificados. Contacta directo a quien te recibe.',
  searchLabel: 'Buscar servicio',
  searchPlaceholder: 'Busca hospedaje, comida, guías…',
  municipality: 'Municipio',
  allMunicipalities: 'Todos los municipios',
  offline: (date: string) => `Modo sin conexión · directorio guardado el ${date}`,
  error: 'No fue posible conectar con el catálogo de servicios ni recuperar una versión guardada.',
  count: (shown: number, total: number) => `${shown} de ${total} servicios`,
  noResults: 'Sin resultados',
  emptyDirectory: 'Directorio en preparación',
  noResultsText: 'Prueba con otra palabra o municipio.',
  emptyDirectoryText: 'Los servicios aparecerán aquí cuando sus datos estén capturados y aprobados.',
  type: 'Tipo de servicio',
  allTypes: 'Todos',
  clearFilters: 'Limpiar filtros',
  promosTitle: 'Promociones vigentes',
  promosText: 'Ofertas por tiempo limitado de los prestadores.',
  hasPromo: 'Promoción',
  listHeading: 'Lista de servicios',
  directBooking: 'Sin comisiones ni intermediarios',
  filtersLabel: 'Filtrar servicios',
}, {
  title: 'Local services',
  titleAccent: 'services',
  intro: 'Lodging, food, guides and experiences offered by verified community businesses. Contact your hosts directly.',
  searchLabel: 'Search services',
  searchPlaceholder: 'Search lodging, food, guides…',
  municipality: 'Municipality',
  allMunicipalities: 'All municipalities',
  offline: (date: string) => `Offline mode · directory saved on ${date}`,
  error: 'We couldn’t reach the services catalog or load a saved copy.',
  count: (shown: number, total: number) => `${shown} of ${total} ${total === 1 ? 'service' : 'services'}`,
  noResults: 'No results',
  emptyDirectory: 'Directory coming soon',
  noResultsText: 'Try another word or municipality.',
  emptyDirectoryText: 'Services will appear here once their details have been entered and approved.',
  type: 'Service type',
  allTypes: 'All',
  clearFilters: 'Clear filters',
  promosTitle: 'Current deals',
  promosText: 'Limited-time offers from local businesses.',
  hasPromo: 'Deal',
  listHeading: 'Service list',
  directBooking: 'No fees, no middlemen',
  filtersLabel: 'Filter services',
});

// Filas compactas en móvil; rejilla de 2 en tableta y de 3 en escritorio.
const GRID = 'mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3';

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const ServicesPage = () => {
  const m = useMessages(messages);
  const { lang, locale } = useLanguage();
  usePageTitle(m.title, m.intro);
  const [services, setServices] = useState<TourismService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [storedAt, setStoredAt] = useState('');
  const [query, setQuery] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [type, setType] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    catalogApi
      .services({ limit: 50 }, controller.signal)
      .then((response) => {
        setServices(response.data);
        setStoredAt(response._offline && response._storedAt ? response._storedAt : '');
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Promociones vigentes: son un complemento, así que si fallan la página sigue igual.
  const [promos, setPromos] = useState<Promocion[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    agendaApi.promociones(1, controller.signal).then((response) => setPromos(response.data)).catch(() => undefined);
    return () => controller.abort();
  }, []);
  // Servicios con una promoción real vigente (las de demostración no marcan ningún servicio).
  const promoSlugs = useMemo(
    () => new Set(promos.filter((promo) => !promo.es_ejemplo && promo.servicio_slug).map((promo) => promo.servicio_slug as string)),
    [promos],
  );

  const offlineDate = storedAt ? new Date(storedAt).toLocaleString(locale) : '';

  const municipalities = useMemo(
    () => [...new Set(services.map((service) => service.municipio).filter((value): value is string => Boolean(value)))].sort(),
    [services],
  );

  const types = useMemo(
    () => [...new Set(services.map((service) => service.categoria).filter((value): value is string => Boolean(value)))].sort(),
    [services],
  );

  const visible = useMemo(() => {
    const term = normalize(query.trim());
    return services.filter((service) =>
      (!municipality || service.municipio === municipality) &&
      (!type || service.categoria === type) &&
      (!term || normalize(`${service.nombre} ${service.tipoServicio ?? ''} ${service.categoria ?? ''} ${service.descripcion ?? ''} ${service.prestador}`).includes(term)));
  }, [services, query, municipality, type]);

  const filtersActive = Boolean(query || municipality || type);
  const clearFilters = () => {
    setQuery('');
    setMunicipality('');
    setType('');
  };

  // Mismos chips que el catálogo de lugares.
  const tabClass = (active: boolean) => `inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
    active ? 'border-brand-blue bg-brand-blue text-white' : 'border-brand-blue/15 bg-transparent text-brand-blue/75 hover:border-brand-blue/40 hover:text-brand-blue'
  }`;

  return (
    <>
      <PageHero
        compact
        title={<Accented text={m.title} accent={m.titleAccent} />}
        subtitle={m.intro}
        aside={(
          <p className="inline-flex items-center gap-2 text-sm text-brand-blue/70">
            <CommunityIcon className="size-4 text-brand-green" /> {m.directBooking}
          </p>
        )}
      />

      <section className="mx-auto max-w-7xl px-5 pb-16 pt-2 lg:px-8 lg:pb-24">
        <div role="region" aria-label={m.filtersLabel}>
          <div className="grid grid-cols-1 gap-3 sm:flex sm:items-center">
            <label className="sr-only" htmlFor="service-search">{m.searchLabel}</label>
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-brand-blue/40" />
              <input
                id="service-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={m.searchPlaceholder}
                maxLength={80}
                className="field pl-11"
              />
            </div>
            <label className="sr-only" htmlFor="service-municipality">{m.municipality}</label>
            <div className="relative sm:w-60">
              <PinIcon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-brand-teal" />
              <select
                id="service-municipality"
                value={municipality}
                onChange={(event) => setMunicipality(event.target.value)}
                className="field appearance-none truncate pl-11 pr-10"
              >
                <option value="">{m.allMunicipalities}</option>
                {municipalities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-brand-blue/70" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="m7 10 5 5 5-5" /></svg>
            </div>
            <div className="flex items-center justify-between gap-4 sm:ml-auto sm:justify-end">
              {!loading && visible.length > 0 ? (
                <p className="whitespace-nowrap text-sm text-brand-blue/70" aria-live="polite">{m.count(visible.length, services.length)}</p>
              ) : <span />}
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-brand-blue/75 underline decoration-brand-blue/20 underline-offset-4 transition-colors duration-300 hover:text-brand-blue">
                  <CloseIcon className="size-3.5" />
                  {m.clearFilters}
                </button>
              )}
            </div>
          </div>

          {types.length > 1 && (
            <div role="group" aria-label={m.type} className="snap-rail -mx-5 mt-4 flex scroll-px-5 gap-2 overflow-x-auto border-y border-brand-sand px-5 py-3 sm:mx-0 sm:flex-wrap sm:scroll-px-0 sm:px-0">
              <button type="button" aria-pressed={!type} onClick={() => setType('')} className={tabClass(!type)}>
                {m.allTypes}
              </button>
              {types.map((item) => {
                const active = type === item;
                return (
                  <button key={item} type="button" aria-pressed={active} onClick={() => setType(active ? '' : item)} className={tabClass(active)}>
                    {categoryLabel(item, lang)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {offlineDate && (
          <p role="status" className="mt-8 inline-flex rounded-full border border-ochre-300 bg-ochre-50 px-4 py-2 text-sm font-medium text-ochre-900">
            {m.offline(offlineDate)}
          </p>
        )}
        {error && <div role="alert" className="mt-8 rounded-2xl border border-clay-200 bg-clay-50 p-4 text-sm font-medium text-clay-800">{m.error}</div>}

        {promos.length > 0 && !filtersActive && (
          <section className="mt-8" aria-labelledby="services-promos">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="services-promos" className="font-display text-2xl text-brand-blue sm:text-[1.75rem]">{m.promosTitle}</h2>
              <p className="text-sm text-brand-blue/70">{m.promosText}</p>
            </div>
            <ul tabIndex={0} aria-labelledby="services-promos" className="snap-rail -mx-5 mt-4 flex scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
              {promos.map((promo) => (
                <li key={promo.id} className="w-[84%] max-w-[22rem] shrink-0 md:w-auto md:max-w-none md:min-w-0">
                  <PromoCard promocion={promo} compact />
                </li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <div className={GRID}>
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-brand-sand/60 sm:h-96" />)}
          </div>
        ) : visible.length ? (
          <>
          {/* Título oculto: las tarjetas usan h3 y necesitan un h2 que las agrupe (orden de encabezados). */}
          <h2 className="sr-only">{m.listHeading}</h2>
          <div className={GRID}>
            {visible.map((service) => (
              <div key={service.id} className="min-w-0">
                <ServiceCard service={service} compact promoLabel={service.slug && promoSlugs.has(service.slug) ? m.hasPromo : undefined} />
              </div>
            ))}
          </div>
          </>
        ) : (
          !error && (
            <div className="mt-8 rounded-2xl bg-brand-light px-6 py-12 text-center sm:py-16">
              <h2 className="text-2xl leading-tight text-brand-blue sm:text-3xl">{services.length ? m.noResults : m.emptyDirectory}</h2>
              <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-brand-blue/70">
                {services.length ? m.noResultsText : m.emptyDirectoryText}
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="btn btn-primary mt-7 min-h-12 px-7">{m.clearFilters}</button>
              )}
            </div>
          )
        )}
      </section>
    </>
  );
};
