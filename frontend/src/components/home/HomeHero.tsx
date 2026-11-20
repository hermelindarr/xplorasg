// Portada: "la sierra en corte".
// Lo que define a la Sierra Gorda es el desnivel: del semidesierto de Peñamiller (≈1,200 m) a los bosques de
// Pinal de Amoles (≈2,700 m) y de bajada a los valles de las misiones (≈500 m). El hero lo muestra con datos reales:
// el corte del terreno (sierraTerrain.ts) y cada lugar del catálogo como un punto en su longitud y altitud.
// Tocar o enfocar un punto muestra el lugar a la derecha (abajo en móvil).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { localeFor, useLanguage, useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { MapIcon } from '../brand/icons';
import { openAssistant } from './homeData';
import { Photo } from '../ui/Photo';
import { SIERRA_TERRAIN, TERRAIN_TOWNS } from './sierraTerrain';
import { usePlaceElevations } from '../../services/elevationApi';
import { scrollBehavior } from '../../utils/motion';

// Geometría del dibujo (unidades del viewBox).
const W = 1000;
const H = 340;
const TOP = 24;
const BASE = H - 34; // línea de 0 m
const MAX_ALT = 3000;
const LON_MIN = -99.83;
const LON_MAX = -99.02;
const CONTOURS = [1000, 2000];
// Radio de captura alrededor de cada punto, en píxeles de pantalla: un toque o el cursor eligen el lugar más cercano
// dentro de este radio. Así el área útil supera los 44 px aunque el punto dibujado mida 10 px.
const PICK_RADIUS_PX = 36;

const x = (lon: number) => ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
const y = (alt: number) => BASE - (alt / MAX_ALT) * (BASE - TOP);

/** Curva suave (Catmull-Rom → Bézier) por los puntos del terreno, cerrada contra la base. */
const terrainPath = (() => {
  const pts = SIERRA_TERRAIN.map(([lon, alt]) => [x(lon), y(alt)] as const);
  let d = `M0 ${BASE} L0 ${pts[0][1].toFixed(1)} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${W} ${last[1].toFixed(1)} L${W} ${BASE} Z`;
})();

interface Point {
  place: Place;
  alt: number;
  cx: number;
  cy: number;
}

export const HomeHero = ({ places }: { places: Place[] }) => {
  const m = useMessages(homeMessages);
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const elevations = usePlaceElevations(places);
  const fmt = (n: number) => n.toLocaleString(localeFor(lang));

  const points = useMemo<Point[]>(() => places
    .map((place) => {
      const alt = elevations[place.slug];
      const lon = Number(place.longitud);
      if (alt === undefined || !Number.isFinite(lon)) return null;
      return { place, alt, cx: x(lon), cy: y(alt) };
    })
    .filter((p): p is Point => p !== null)
    .sort((a, b) => a.cx - b.cx), [places, elevations]);

  // Por defecto, el punto más alto con foto: es el dato que más sorprende.
  const highest = useMemo(
    () => [...points].sort((a, b) => b.alt - a.alt).find((p) => p.place.imagenPrincipal?.url) ?? points[0] ?? null,
    [points],
  );
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active = points.find((p) => p.place.slug === activeSlug) ?? highest;

  // Rango del titular: con los lugares cuando ya hay altitudes; si no, con el corte del terreno.
  const alts = points.length ? points.map((p) => p.alt) : SIERRA_TERRAIN.map(([, alt]) => alt);
  const low = Math.floor(Math.min(...alts) / 100) * 100;
  const high = Math.floor(Math.max(...alts) / 100) * 100;

  const onPointKey = (event: KeyboardEvent, point: Point) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activeSlug === point.place.slug) navigate(`/lugares/${point.place.slug}`);
      else setActiveSlug(point.place.slug);
    }
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  // De dónde vino la última selección: la lista se desplaza sola cuando se eligió en el perfil, y el perfil cuando se eligió en la lista.
  const selectedFrom = useRef<'profile' | 'rail' | null>(null);
  const [nearPoint, setNearPoint] = useState(false);

  /** Lugar más cercano al puntero, medido en píxeles de pantalla, o null si ninguno está dentro del radio. */
  const nearestAt = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const sx = rect.width / W;
    const sy = rect.height / H;
    let best: Point | null = null;
    let bestDist = PICK_RADIUS_PX;
    for (const point of points) {
      const dist = Math.hypot(rect.left + point.cx * sx - clientX, rect.top + point.cy * sy - clientY);
      if (dist < bestDist) {
        best = point;
        bestDist = dist;
      }
    }
    return best;
  };

  const select = (point: Point, from: 'profile' | 'rail') => {
    selectedFrom.current = from;
    setActiveSlug(point.place.slug);
  };

  const onProfileClick = (event: MouseEvent<SVGSVGElement>) => {
    const point = nearestAt(event.clientX, event.clientY);
    if (!point) return;
    // Segundo toque sobre el lugar ya elegido: abre su ficha.
    if (point === active) navigate(`/lugares/${point.place.slug}`);
    else select(point, 'profile');
  };

  const onProfilePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'mouse') return;
    const point = nearestAt(event.clientX, event.clientY);
    setNearPoint(Boolean(point));
    if (point && point !== active) select(point, 'profile');
  };

  // Mantiene sincronizados el perfil (que en móvil se desliza) y la lista de lugares.
  useEffect(() => {
    if (!active) return;
    if (selectedFrom.current === 'profile') {
      const rail = railRef.current;
      const chip = rail?.querySelector<HTMLElement>(`[data-slug="${active.place.slug}"]`);
      if (rail && chip) rail.scrollTo({ left: chip.offsetLeft - rail.clientWidth / 2 + chip.offsetWidth / 2, behavior: scrollBehavior() });
    } else if (selectedFrom.current === 'rail') {
      const scroller = scrollerRef.current;
      const svg = svgRef.current;
      if (scroller && svg) scroller.scrollTo({ left: active.cx * (svg.clientWidth / W) - scroller.clientWidth / 2, behavior: scrollBehavior() });
    }
  }, [active]);

  const labelRight = active ? active.cx < W * 0.72 : true;

  return (
    <section className="px-2.5 pt-2.5 sm:px-4 sm:pt-4" aria-labelledby="home-hero-title">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-brand-blue text-brand-light sm:rounded-[2rem]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pt-10 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:px-12 lg:pt-16">
          <div className="lg:col-span-7">
            <p className="text-sm text-brand-light/70">{m.heroKicker}</p>
            <h1 id="home-hero-title" className="animate-fade-up mt-4 text-[2.6rem] leading-[1.02] text-brand-paper sm:text-6xl lg:text-[4.25rem]">
              {m.heroTitle(fmt(low), fmt(high))}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-brand-light/80 sm:leading-8">{m.heroLead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={openAssistant} className="btn min-h-12 rounded-full bg-brand-paper px-6 text-brand-blue transition-colors duration-300 hover:bg-white">
                {m.planTrip}
              </button>
              <Link to="/mapa" className="inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-medium text-brand-paper ring-1 ring-brand-light/40 transition-colors duration-300 hover:bg-white/10 hover:ring-brand-light">
                <MapIcon className="size-4" />
                {m.seeMap}
              </Link>
            </div>
          </div>

          {/* Lugar seleccionado en el perfil */}
          <div className="lg:col-span-5 lg:pt-2" aria-live="polite">
            {active ? (
              <Link to={`/lugares/${active.place.slug}`} className="group block">
                <span className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-brand-green">
                  <Photo
                    src={active.place.imagenPrincipal?.url}
                    name={active.place.nombre}
                    alt={active.place.imagenPrincipal?.altText || active.place.nombre}
                    eager
                    // Tarjeta de 5/12 columnas en escritorio; en teléfono basta la versión de 500 px (es la imagen LCP).
                    sizes="(min-width: 1024px) 34vw, 250px"
                    imgClassName="img-zoom"
                    nameClassName="text-3xl text-brand-light/70"
                  />
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="min-w-0">
                    <span className="font-display block text-2xl leading-tight text-brand-paper underline-offset-4 group-hover:underline">{active.place.nombre}</span>
                    <span className="mt-1 block text-sm text-brand-light/70">{active.place.municipio}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="font-display block text-3xl leading-none text-brand-paper tabular-nums">{fmt(active.alt)}</span>
                    <span className="mt-1 block text-xs text-brand-light/60">{m.metersAbove}</span>
                  </span>
                </span>
              </Link>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-brand-green/40" />
            )}
          </div>
        </div>

        {/* Perfil: en móvil se desliza horizontalmente para que los puntos sigan siendo tocables. */}
        <figure className="mt-10 lg:mt-6">
          <div ref={scrollerRef} className="overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
            <svg
              ref={svgRef}
              onClick={onProfileClick}
              onPointerMove={onProfilePointerMove}
              onPointerLeave={() => setNearPoint(false)}
              viewBox={`0 0 ${W} ${H}`}
              className={`block w-full min-w-[46rem] lg:min-w-0 ${nearPoint ? 'cursor-pointer' : ''}`}
              role="group"
              aria-label={m.profileLabel}
            >
              <path d={terrainPath} className="terrain-reveal" fill="var(--color-brand-green)" />
              <path d={terrainPath} className="terrain-reveal" fill="none" stroke="var(--color-brand-teal)" strokeWidth="1.5" />

              {/* Curvas de nivel */}
              {CONTOURS.map((alt) => (
                <g key={alt} aria-hidden="true">
                  <line x1="0" x2={W} y1={y(alt)} y2={y(alt)} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="2 6" />
                  <text x="24" y={y(alt) - 7} fill="currentColor" fillOpacity="0.55" fontSize="12">{fmt(alt)} m</text>
                </g>
              ))}

              {/* Cabeceras municipales, dentro del terreno */}
              {TERRAIN_TOWNS.map((town) => (
                <text key={town.name} x={x(town.lon)} y={BASE + 22} textAnchor="middle" fill="currentColor" fillOpacity="0.6" fontSize="12" aria-hidden="true">
                  {town.name}
                </text>
              ))}

              {/* Línea guía del punto activo */}
              {active && (
                <g aria-hidden="true">
                  <line x1={active.cx} x2={active.cx} y1={active.cy} y2={BASE} stroke="var(--color-brand-gold)" strokeWidth="1" strokeDasharray="3 4" />
                  <text
                    x={active.cx + (labelRight ? 14 : -14)}
                    y={active.cy - 12}
                    textAnchor={labelRight ? 'start' : 'end'}
                    fill="var(--color-brand-paper)"
                    fontSize="14"
                    fontWeight="500"
                  >
                    {active.place.nombre.length > 34 ? `${active.place.nombre.slice(0, 32)}…` : active.place.nombre}
                  </text>
                </g>
              )}

              {points.map((point) => {
                const isActive = point === active;
                return (
                  <g
                    key={point.place.slug}
                    role="button"
                    tabIndex={0}
                    aria-label={m.pointLabel(point.place.nombre, point.place.municipio, fmt(point.alt))}
                    aria-pressed={isActive}
                    className="outline-none [&:focus-visible>circle]:stroke-brand-paper"
                    // Sólo el foco de teclado selecciona: el foco que llega con un toque haría que ese mismo toque
                    // contara como "segundo toque" y abriera la ficha de inmediato.
                    onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) select(point, 'profile'); }}
                    onKeyDown={(event) => onPointKey(event, point)}
                  >
                    {/* El toque y el cursor se resuelven en el <svg> (lugar más cercano); aquí sólo se dibuja. */}
                    <circle
                      cx={point.cx}
                      cy={point.cy}
                      r={isActive ? 8 : 5}
                      fill={isActive ? 'var(--color-brand-gold)' : 'var(--color-brand-paper)'}
                      stroke={isActive ? 'var(--color-brand-paper)' : 'var(--color-brand-blue)'}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      style={{ transition: 'r 200ms ease-out' }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* En móvil: la misma selección como lista de botones de 44 px, de oeste a este. Es el control
              equivalente para los puntos que quedan muy juntos en el perfil. */}
          {points.length > 0 && (
            <div ref={railRef} role="group" aria-label={m.placesRail} className="snap-rail mt-4 flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] sm:px-10 lg:hidden">
              {points.map((point) => {
                const isActive = point === active;
                return (
                  <button
                    key={point.place.slug}
                    type="button"
                    data-slug={point.place.slug}
                    aria-pressed={isActive}
                    onClick={() => select(point, 'rail')}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-300 ${
                      isActive ? 'border-brand-paper bg-brand-paper text-brand-blue' : 'border-brand-light/25 text-brand-light/85 hover:border-brand-light/60'
                    }`}
                  >
                    <span className="max-w-[13rem] truncate">{point.place.nombre}</span>
                    <span className={`tabular-nums ${isActive ? 'text-brand-blue/70' : 'text-brand-light/60'}`}>{fmt(point.alt)} m</span>
                  </button>
                );
              })}
            </div>
          )}
          <figcaption className="mx-auto max-w-7xl px-6 pb-24 pt-4 text-label leading-5 text-brand-light/60 sm:px-10 lg:px-12 lg:pb-32">
            <span className="block font-medium text-brand-light/80 lg:hidden">{m.swipeHint}</span>
            {m.profileCaption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
};
