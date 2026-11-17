// "Destinos imperdibles": mosaico tipo Pinterest (columnas con alturas distintas) de fotos reales
// del catálogo, con el nombre y el municipio sobre la foto.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { useLanguage, useMessages } from '../../i18n';
import { categoryLabel } from '../../i18n/common';
import { homeMessages } from '../../i18n/home';
import { ArrowRightIcon } from '../brand/icons';
import { SectionHeading } from '../ui/SectionHeading';
import { TextLink } from '../ui/TextLink';
import { CardMedia } from '../ui/Card';

// Proporciones alternadas para el ritmo del mosaico (vertical, cuadrada, horizontal…).
const ASPECTS = ['sm:aspect-[4/5]', 'sm:aspect-[4/3]', 'sm:aspect-square', 'sm:aspect-[5/4]', 'sm:aspect-[4/5]', 'sm:aspect-square', 'sm:aspect-[4/3]', 'sm:aspect-[4/5]', 'sm:aspect-[5/4]'];

const Destination = ({ place, index, lang }: { place: Place; index: number; lang: 'es' | 'en' }) => {
  // Las fotos panorámicas de baja altura no se recortan en vertical (se verían borrosas).
  const [panoramic, setPanoramic] = useState(false);
  // En el carril de móvil todas las fotos miden lo mismo; el mosaico alterna proporciones desde `sm`.
  const aspect = `max-sm:aspect-[4/5] ${panoramic ? 'sm:aspect-[4/3]' : ASPECTS[index % ASPECTS.length]}`;
  return (
    <Link to={`/lugares/${place.slug}`} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green">
      <CardMedia
        src={place.imagenPrincipal?.url}
        name={place.nombre}
        alt={place.imagenPrincipal?.altText}
        className={`rounded-2xl transition-shadow duration-500 group-hover:shadow-[0_22px_44px_-22px_rgba(31,44,36,.5)] ${aspect}`}
        veilClassName="transition-opacity duration-500 group-hover:opacity-90"
        showName={false}
        onRatio={(ratio) => setPanoramic(ratio > 1.7)}
      >
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          {/* En móvil las columnas son angostas: sólo nombre y municipio. */}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">{categoryLabel(place.categoria, lang)}</p>
          <h3 className="font-display mt-1 line-clamp-2 text-[1.25rem] leading-snug sm:text-[1.35rem]">{place.nombre}</h3>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-white/80 sm:text-[13px]">
            {place.municipio}
            <ArrowRightIcon className="size-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
          </p>
        </div>
      </CardMedia>
    </Link>
  );
};

export const HomeDestinations = ({ places }: { places: Place[] }) => {
  const m = useMessages(homeMessages);
  const { lang } = useLanguage();
  if (!places.length) return null;

  return (
    <section className="border-t border-brand-sand" aria-labelledby="home-destinations">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-24">
        <SectionHeading
          id="home-destinations"
          eyebrow={m.railEyebrow}
          title={m.railTitle}
          text={m.railText}
          action={<TextLink to="/explorar">{m.seeAll}</TextLink>}
        />

        <ul className="snap-rail -mx-5 mt-8 flex scroll-px-5 gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:mt-12 sm:block sm:columns-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:mt-16 lg:columns-3 lg:gap-8">
          {places.map((place, index) => (
            <li key={place.id} className="w-[68%] max-w-[18rem] shrink-0 break-inside-avoid sm:mb-6 sm:w-auto sm:max-w-none lg:mb-8">
              <Destination place={place} index={index} lang={lang} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
