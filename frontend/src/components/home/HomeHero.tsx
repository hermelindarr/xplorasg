// Hero inmersivo: fotografía del catálogo a sangre completa (sólo fotos de alta resolución),
// velo oscuro para legibilidad y titular en blanco sobre la imagen. Rota con fundido y un
// acercamiento lento (desactivado con "reducir movimiento"). El buscador se monta encima del borde inferior.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { useMessages } from '../../i18n';
import { common } from '../../i18n/common';
import { homeMessages } from '../../i18n/home';
import { ArrowRightIcon, MapIcon } from '../brand/icons';
import { openAssistant } from './homeData';
import { Photo } from './HomeUi';

const AUTO_ADVANCE_MS = 7000;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pad = (n: number) => String(n).padStart(2, '0');

export const HomeHero = ({ slides }: { slides: Place[] }) => {
  const m = useMessages(homeMessages);
  const c = useMessages(common);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(prefersReducedMotion);

  const count = slides.length;
  const active = count ? Math.min(index, count - 1) : 0;
  const current = count ? slides[active] : null;

  // Solo se descargan la foto visible y la siguiente: el resto espera su turno (mejora la carga inicial).
  const [loadedUpTo, setLoadedUpTo] = useState(0);
  useEffect(() => {
    if (!count) return undefined;
    const timer = window.setTimeout(() => setLoadedUpTo((value) => Math.max(value, Math.min(active + 1, count - 1))), active === 0 ? 2500 : 0);
    return () => window.clearTimeout(timer);
  }, [active, count]);

  const go = useCallback((step: number) => {
    if (!count) return;
    setIndex((value) => (Math.min(value, count - 1) + step + count) % count);
  }, [count]);

  useEffect(() => {
    if (count < 2 || paused || reduced) return undefined;
    const timer = window.setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduced, go, active]);

  // "Explora. Conecta." + "Vive la Sierra Gorda." (la última frase va en cursiva).
  const sloganParts = c.slogan.split(/(?<=\.)\s+/);
  const sloganLead = sloganParts.slice(0, -1).join(' ');
  const sloganLast = sloganParts[sloganParts.length - 1];

  return (
    <section
      className="px-2.5 pt-2.5 sm:px-4 sm:pt-4"
      aria-label={m.slideshowLabel}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative isolate h-[min(86svh,52rem)] min-h-[34rem] overflow-hidden rounded-[1.75rem] bg-brand-blue sm:rounded-[2rem]">
        {/* Fotografías */}
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.id}
            aria-hidden={slideIndex !== active}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${slideIndex === active ? 'opacity-100' : 'opacity-0'}`}
          >
            <Photo
              src={slideIndex <= Math.max(loadedUpTo, active) ? slide.imagenPrincipal?.url : null}
              name={slide.nombre}
              alt={slide.imagenPrincipal?.altText || slide.nombre}
              eager={slideIndex === 0}
              imgClassName={slideIndex === active && !reduced ? 'hero-kenburns' : ''}
              nameClassName="text-4xl sm:text-5xl text-white/60"
            />
          </div>
        ))}

        {/* Velo para legibilidad (inferior e izquierdo) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1a13]/85 via-[#0f1a13]/25 to-[#0f1a13]/10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0f1a13]/55 via-transparent to-transparent" />

        {/* Controles del carrusel */}
        {count > 1 && (
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-full bg-white/15 p-1 text-sm text-white ring-1 ring-white/25 backdrop-blur-md sm:right-6 sm:top-6">
            <button type="button" onClick={() => go(-1)} aria-label={m.prevSlide} className="grid size-9 place-items-center rounded-full transition-colors duration-300 hover:bg-white/20 active:scale-95">
              <ArrowRightIcon className="size-4 rotate-180" />
            </button>
            <p className="min-w-[3.75rem] text-center font-medium tabular-nums">
              <span aria-hidden="true">{pad(active + 1)} <span className="text-white/70">/ {pad(count)}</span></span>
              <span className="sr-only">{m.slideCounter(active + 1, count)}</span>
            </p>
            <button type="button" onClick={() => go(1)} aria-label={m.nextSlide} className="grid size-9 place-items-center rounded-full transition-colors duration-300 hover:bg-white/20 active:scale-95">
              <ArrowRightIcon className="size-4" />
            </button>
          </div>
        )}

        {/* Titular */}
        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-7xl flex-col gap-8 px-6 pb-24 sm:px-10 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-32">
          <div className="max-w-2xl text-white">
            <p className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.22em] text-white/85">
              <span aria-hidden="true" className="h-px w-8 bg-white/70" />
              {m.heroEyebrow}
            </p>
            <h1 className="animate-fade-up mt-5 text-[2.6rem] leading-[1.02] drop-shadow-[0_2px_18px_rgba(0,0,0,.25)] sm:text-6xl lg:text-[clamp(3.25rem,4.8vw,4.6rem)]">
              <span className="block">{sloganLead}</span>
              <em className="block font-normal italic text-[#BFE3C8]">{sloganLast}</em>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/85 sm:text-base sm:leading-8">
              {m.heroText}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" onClick={openAssistant} className="btn min-h-12 rounded-full bg-[#E9B949] px-6 font-semibold text-brand-blue shadow-[0_10px_30px_-10px_rgba(233,185,73,.8)] transition-[transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-[#F2C760] active:translate-y-0">
                {m.planTrip}
              </button>
              <Link to="/mapa" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white/15 px-5 text-sm font-medium text-white ring-1 ring-white/35 backdrop-blur-md transition-colors duration-300 hover:bg-white/25">
                <MapIcon className="size-4" />
                {m.seeMap}
              </Link>
            </div>
            {count > 1 && (
              <div className="mt-8 flex gap-1.5" aria-hidden="true">
                {slides.map((slide, slideIndex) => (
                  <span key={slide.id} className={`h-1 rounded-full transition-all duration-500 ${slideIndex === active ? 'w-8 bg-white' : 'w-3 bg-white/45'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Pie de foto */}
          {current && (
            <Link to={`/lugares/${current.slug}`} className="group hidden max-w-xs shrink-0 text-right text-white lg:block" aria-live="polite">
              <span className="block text-xs font-medium uppercase tracking-[0.2em] text-white/70">{m.photoLabel}</span>
              <span className="font-display mt-1 block text-xl leading-snug underline-offset-4 group-hover:underline">{current.nombre}</span>
              <span className="block text-[13px] text-white/75">{current.municipio}</span>
              <span className="sr-only">{m.seePlace}</span>
            </Link>
          )}
        </div>

      </div>
    </section>
  );
};
