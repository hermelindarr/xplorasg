// "Destinos imperdibles": mosaico tipo Pinterest (columnas con alturas distintas) de fotos reales
// del catálogo, con el nombre y el municipio sobre la foto.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Place } from '../../types/catalog';
import { localeFor, useLanguage, useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { SectionHeading } from '../ui/SectionHeading';
import { TextLink } from '../ui/TextLink';
import { CardMedia } from '../ui/Card';
import { usePlaceElevations } from '../../services/elevationApi';

// Proporciones alternadas para el ritmo del mosaico (vertical, cuadrada, horizontal…).
const ASPECTS = ['aspect-[4/5]', 'aspect-[4/3]', 'aspect-square', 'aspect-[5/4]', 'aspect-[4/5]', 'aspect-square', 'aspect-[4/3]', 'aspect-[4/5]', 'aspect-[5/4]'];

const Destination = ({ place, index, lang, altitude }: { place: Place; index: number; lang: 'es' | 'en'; altitude?: number }) => {
  // Las fotos panorámicas de baja altura no se recortan en vertical (se verían borrosas).
  const [panoramic, setPanoramic] = useState(false);
  const aspect = panoramic ? 'aspect-[4/3]' : ASPECTS[index % ASPECTS.length];
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
        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
          <h3 className="font-display line-clamp-2 text-base leading-snug sm:mt-1 sm:text-title">{place.nombre}</h3>
          <p className="mt-0.5 text-xs text-white/80 sm:text-label">
            {place.municipio}{altitude !== undefined && <span className="max-sm:hidden">, {altitude.toLocaleString(localeFor(lang))} m</span>}
          </p>
        </div>
      </CardMedia>
    </Link>
  );
};

export const HomeDestinations = ({ places }: { places: Place[] }) => {
  const m = useMessages(homeMessages);
  const { lang } = useLanguage();
  const elevations = usePlaceElevations(places);
  if (!places.length) return null;

  return (
    <section className="border-t border-brand-sand" aria-labelledby="home-destinations">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <SectionHeading
          id="home-destinations"
          eyebrow={m.railEyebrow}
          title={m.railTitle}
          text={m.railText}
          action={<TextLink to="/explorar">{m.seeAll}</TextLink>}
        />

        <ul className="mt-12 columns-2 gap-4 sm:gap-6 lg:mt-16 lg:columns-3 lg:gap-8">
          {places.map((place, index) => (
            <li key={place.id} className={`mb-4 break-inside-avoid sm:mb-6 lg:mb-8 ${index >= 4 ? 'max-sm:hidden' : ''}`}>
              <Destination place={place} index={index} lang={lang} altitude={elevations[place.slug]} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
