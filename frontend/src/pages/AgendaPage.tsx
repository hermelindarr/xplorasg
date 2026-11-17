/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { agendaApi } from '../services/agendaApi';
import type { Evento, Promocion } from '../services/agendaApi';
import { usePageTitle } from '../hooks/usePageTitle';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { ArrowRightIcon, CalendarIcon, PinIcon } from '../components/brand/icons';
import { PromoCard } from '../components/agenda/PromoCard';
import { PageHero } from '../components/ui/PageHero';
import { Accented } from '../components/ui/Accented';
import { Photo } from '../components/ui/Photo';

type Tab = 'eventos' | 'promociones';

const agendaMessages = defineMessages({
  pageTitle: 'Agenda cultural',
  loadError: 'No pudimos cargar la agenda. Revisa tu conexión e inténtalo de nuevo.',
  title: 'Agenda Sierra Gorda',
  titleAccent: 'Sierra Gorda',
  intro: 'Fiestas patronales, huapango y tradiciones de las misiones, además de promociones de prestadores locales.',
  tabsLabel: 'Secciones de la agenda',
  eventsTab: 'Eventos culturales',
  promotionsTab: 'Promociones',
  offline: 'Sin conexión: mostrando la última agenda guardada.',
  loading: 'Cargando agenda…',
  errorTitle: 'Algo salió mal',
  noEvents: 'No hay eventos próximos',
  noPromotions: 'No hay promociones activas',
  emptyMessage: 'Vuelve más tarde para descubrir nuevas experiencias en la Sierra Gorda.',
  exploreCatalog: 'Explorar el catálogo',
  schedule: (value: string) => `Horario: ${value}`,
  tentative: 'Por confirmar',
  tentativeDate: (value: string) => `Fecha tentativa: ${value} (por confirmar)`,
  viewPlace: 'Ver lugar',
  upcoming: (n: number) => `${n} ${n === 1 ? 'evento próximo' : 'eventos próximos'}`,
  nextEvent: 'Próximo evento',
  inDays: (n: number) => (n <= 0 ? 'En curso' : n === 1 ? 'Mañana' : `En ${n} días`),
  promosServicesHint: 'Las promociones también aparecen en el directorio de servicios.',
  viewServices: 'Ver servicios',
}, {
  pageTitle: 'Cultural events',
  loadError: 'We couldn’t load the events. Check your connection and try again.',
  title: 'Sierra Gorda events',
  titleAccent: 'Sierra Gorda',
  intro: 'Patron saint festivals, huapango music and mission traditions, plus deals from local businesses.',
  tabsLabel: 'Events sections',
  eventsTab: 'Cultural events',
  promotionsTab: 'Deals',
  offline: 'Offline: showing the last saved events.',
  loading: 'Loading events…',
  errorTitle: 'Something went wrong',
  noEvents: 'No upcoming events',
  noPromotions: 'No active deals',
  emptyMessage: 'Check back later to discover new experiences in the Sierra Gorda.',
  exploreCatalog: 'Explore the catalog',
  schedule: (value: string) => `Hours: ${value}`,
  tentative: 'TBC',
  tentativeDate: (value: string) => `Tentative date: ${value} (to be confirmed)`,
  viewPlace: 'View place',
  upcoming: (n: number) => `${n} upcoming ${n === 1 ? 'event' : 'events'}`,
  nextEvent: 'Next event',
  inDays: (n: number) => (n <= 0 ? 'Happening now' : n === 1 ? 'Tomorrow' : `In ${n} days`),
  promosServicesHint: 'Deals also appear in the services directory.',
  viewServices: 'View services',
});

const formatters = (locale: string) => ({
  day: new Intl.DateTimeFormat(locale, { day: 'numeric', timeZone: 'America/Mexico_City' }),
  month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'America/Mexico_City' }),
  weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'America/Mexico_City' }),
  long: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }),
  monthYear: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }),
  year: new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'America/Mexico_City' }),
});

const useFormatters = () => {
  const { locale } = useLanguage();
  return useMemo(() => formatters(locale), [locale]);
};

const formatRange = (longFormatter: Intl.DateTimeFormat, start: string, end: string) => {
  const a = longFormatter.format(new Date(start));
  const b = longFormatter.format(new Date(end));
  return a === b ? a : `${a} – ${b}`;
};

const ClockIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
  </svg>
);

const clean = (value: string) => value.replace('.', '');

export const AgendaPage = () => {
  const m = useMessages(agendaMessages);
  usePageTitle(m.pageTitle, m.intro);
  const format = useFormatters();
  const [tab, setTab] = useState<Tab>('eventos');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    const request = tab === 'eventos'
      ? agendaApi.eventos(1, controller.signal).then((res) => {
        setEventos(res.data);
        setOffline(Boolean(res._offline));
      })
      : agendaApi.promociones(1, controller.signal).then((res) => { setPromociones(res.data); setOffline(Boolean(res._offline)); });

    request
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError(m.loadError);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [tab, m.loadError]);

  const tabs: Array<{ value: Tab; label: string }> = [
    { value: 'eventos', label: m.eventsTab },
    { value: 'promociones', label: m.promotionsTab },
  ];

  const isEmpty = tab === 'eventos' ? eventos.length === 0 : promociones.length === 0;
  // Los eventos llegan en orden cronológico: el primero se destaca y el resto se agrupa por mes.
  const [featured, ...rest] = eventos;
  const groups = useMemo(() => {
    const map = new Map<string, Evento[]>();
    for (const evento of rest) {
      const key = format.monthYear.format(new Date(evento.fecha_inicio));
      map.set(key, [...(map.get(key) ?? []), evento]);
    }
    return [...map.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `rest` se deriva de `eventos`
  }, [eventos, format]);

  return (
    <>
    <PageHero
      compact
      title={<Accented text={m.title} accent={m.titleAccent} />}
      subtitle={m.intro}
    />
    <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8 lg:pb-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-brand-sand">
        <div role="tablist" aria-label={m.tabsLabel} className="flex gap-8">
          {tabs.map(({ value, label }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(value)}
                className={`relative -mb-px inline-flex min-h-12 items-center whitespace-nowrap border-b py-3 text-[15px] transition-colors duration-300 ${
                  active ? 'border-brand-blue font-medium text-brand-blue' : 'border-transparent text-brand-blue/70 hover:text-brand-blue'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {!loading && tab === 'eventos' && eventos.length > 0 && (
          <p className="pb-3.5 text-sm text-brand-blue/70">{m.upcoming(eventos.length)}</p>
        )}
      </div>

      {offline && !loading && (
        <p role="status" className="mt-8 flex items-center gap-2 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-sm font-medium text-ochre-900">
          <i className="size-2 shrink-0 rounded-full bg-ochre-600" aria-hidden="true" />
          {m.offline}
        </p>
      )}

      <div className="mt-4">
        {loading ? (
          <div aria-live="polite">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 border-b border-brand-sand py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-6">
                <div className="h-14 animate-pulse rounded-lg bg-brand-sand/60" />
                <div className="space-y-3">
                  <div className="h-6 w-2/3 animate-pulse rounded-full bg-brand-sand/60" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-brand-sand/50" />
                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-brand-sand/40" />
                </div>
              </div>
            ))}
            <span className="sr-only">{m.loading}</span>
          </div>
        ) : error ? (
          <EmptyState title={m.errorTitle} message={error} />
        ) : isEmpty ? (
          <EmptyState title={tab === 'eventos' ? m.noEvents : m.noPromotions} message={m.emptyMessage} />
        ) : tab === 'eventos' ? (
          <div>
            {/* h2 oculto para que los h3 de cada evento sigan el orden de encabezados. */}
            <h2 className="sr-only">{m.eventsTab}</h2>
            {featured && <FeaturedEvent evento={featured} />}
            {groups.map(([month, items]) => (
              <section key={month} className="mt-8 lg:mt-10" aria-label={month}>
                <h3 className="label-quiet border-b border-brand-sand pb-2 first-letter:uppercase">{month}</h3>
                <ul>
                  {items.map((e) => <li key={e.id}><EventRow evento={e} /></li>)}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <>
            <h2 className="sr-only">{m.promotionsTab}</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {promociones.map((p) => (
                <div key={p.id} className="min-w-0">
                  <PromoCard promocion={p} />
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-brand-blue/70">
              {m.promosServicesHint}{' '}
              <Link to="/servicios" className="font-medium text-brand-blue underline decoration-brand-blue/25 underline-offset-4 hover:text-brand-green">{m.viewServices}</Link>
            </p>
          </>
        )}
      </div>
    </section>
    </>
  );
};

const EmptyState = ({ title, message }: { title: string; message: string }) => {
  const m = useMessages(agendaMessages);
  return (
    <div className="mt-8 rounded-2xl bg-brand-light px-6 py-12 text-center sm:py-16">
      <h2 className="text-2xl leading-tight text-brand-blue sm:text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-brand-blue/70">{message}</p>
      <Link to="/explorar" className="btn btn-primary mt-7 min-h-12 px-7">
        {m.exploreCatalog}
      </Link>
    </div>
  );
};

// Si la ficha dice que la fecha no está confirmada, no se muestra un día exacto.
const isTentative = (evento: Evento) => /por confirmar|sin confirmar|to be confirmed|\btbc\b/i.test(`${evento.horario ?? ''} ${evento.descripcion ?? ''}`);

/** Bloque de fecha: día grande y mes, o mes y año si la fecha es tentativa. */
const DateBlock = ({ evento, large = false }: { evento: Evento; large?: boolean }) => {
  const format = useFormatters();
  const start = new Date(evento.fecha_inicio);
  const big = large ? 'text-5xl sm:text-6xl' : 'text-[2rem] sm:text-4xl';
  return (
    <p className="flex flex-col">
      {isTentative(evento) ? (
        <>
          <span className={`font-display mt-0.5 leading-none capitalize text-brand-blue ${large ? 'text-4xl' : 'text-2xl sm:text-3xl'}`}>{clean(format.month.format(start))}</span>
          <span className="mt-1.5 text-xs font-medium tracking-[0.14em] text-brand-blue/70">{format.year.format(start)}</span>
        </>
      ) : (
        <>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-gold">{clean(format.weekday.format(start))}</span>
          <span className={`font-display mt-0.5 leading-none tabular-nums text-brand-blue ${big}`}>{format.day.format(start)}</span>
          <span className="mt-1.5 text-xs font-medium uppercase tracking-[0.16em] text-brand-blue/70">{clean(format.month.format(start))}</span>
        </>
      )}
    </p>
  );
};

/** Fecha, lugar y horario en líneas con icono. */
const EventMeta = ({ evento }: { evento: Evento }) => {
  const m = useMessages(agendaMessages);
  const format = useFormatters();
  const start = new Date(evento.fecha_inicio);
  return (
    <ul className="grid gap-1 text-[13px] text-brand-blue/75 sm:text-sm">
      <li className="flex items-start gap-2">
        <CalendarIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
        <span>{isTentative(evento) ? m.tentativeDate(format.monthYear.format(start)) : formatRange(format.long, evento.fecha_inicio, evento.fecha_fin)}</span>
      </li>
      {(evento.lugar_nombre || evento.municipio) && (
        <li className="flex items-start gap-2">
          <PinIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
          <span>{[evento.lugar_nombre, evento.municipio].filter(Boolean).join(' · ')}</span>
        </li>
      )}
      {evento.horario && (
        <li className="flex items-start gap-2">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-teal" />
          <span>{m.schedule(evento.horario)}</span>
        </li>
      )}
    </ul>
  );
};

const PlaceLink = ({ evento }: { evento: Evento }) => {
  const m = useMessages(agendaMessages);
  if (!evento.lugar_slug) return null;
  return (
    <Link
      to={`/lugares/${evento.lugar_slug}`}
      aria-label={`${m.viewPlace}: ${evento.lugar_nombre ?? evento.titulo}`}
      className="mt-3 inline-flex min-h-9 items-center gap-2 border-b border-brand-blue/25 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
    >
      {m.viewPlace}
      <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
};

/** El evento más cercano: tarjeta con foto del lugar, cuenta regresiva y descripción completa. */
const FeaturedEvent = ({ evento }: { evento: Evento }) => {
  const m = useMessages(agendaMessages);
  const [now] = useState(() => Date.now());
  const days = Math.ceil((new Date(evento.fecha_inicio).getTime() - now) / 86_400_000);
  return (
    <article className="group relative mt-6 grid overflow-hidden rounded-2xl bg-white ring-1 ring-brand-blue/8 md:grid-cols-2">
      <div className={`relative aspect-[16/9] md:aspect-auto md:min-h-[18rem] ${evento.lugar_imagen ? '' : 'max-md:hidden'}`}>
        <Photo src={evento.lugar_imagen} name={evento.lugar_nombre ?? evento.titulo} alt={evento.lugar_nombre ?? ''} imgClassName="img-zoom" nameClassName="text-xl" />
      </div>
      <div className="flex flex-col p-5 sm:p-7 lg:p-9">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
          {m.nextEvent}
          {!isTentative(evento) && <span className="rounded-full bg-brand-green/10 px-2.5 py-1 tracking-[0.08em] text-brand-green">{m.inDays(days)}</span>}
        </p>
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5">
          <DateBlock evento={evento} large />
          <h3 className="font-display text-2xl leading-tight text-brand-blue sm:text-[1.9rem]">{evento.titulo}</h3>
        </div>
        <div className="mt-5"><EventMeta evento={evento} /></div>
        {evento.descripcion && <p className="mt-4 text-sm leading-6 text-brand-blue/75 sm:text-[15px] sm:leading-7">{evento.descripcion}</p>}
        <div className="mt-auto"><PlaceLink evento={evento} /></div>
      </div>
    </article>
  );
};

/** Fila compacta: fecha, datos y miniatura del lugar. */
const EventRow = ({ evento }: { evento: Evento }) => (
  <article className="group relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 border-b border-brand-sand py-5 sm:grid-cols-[4.5rem_minmax(0,1fr)_8.5rem] sm:gap-x-6 sm:py-6 lg:grid-cols-[5rem_minmax(0,1fr)_11rem]">
    <DateBlock evento={evento} />
    <div className="min-w-0">
      <h4 className="font-display text-xl leading-tight text-brand-blue underline-offset-4 sm:text-2xl lg:group-hover:underline">{evento.titulo}</h4>
      <div className="mt-2.5"><EventMeta evento={evento} /></div>
      {evento.descripcion && <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm leading-6 text-brand-blue/75">{evento.descripcion}</p>}
      <PlaceLink evento={evento} />
    </div>
    {evento.lugar_imagen && (
      <div className="relative aspect-[4/3] self-start overflow-hidden rounded-xl max-sm:hidden">
        <Photo src={evento.lugar_imagen} alt={evento.lugar_nombre ?? ''} imgClassName="img-zoom" />
      </div>
    )}
  </article>
);
