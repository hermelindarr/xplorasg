import { Link } from 'react-router-dom';
import type { Place } from '../types/catalog';
import { isClosedNotice } from '../utils/text';
import { FavoriteButton } from './FavoriteButton';
import { defineMessages, localeFor, useLanguage, useMessages } from '../i18n';
import { Photo } from './ui/Photo';

const messages = defineMessages({
  closed: 'Cerrado temporalmente',
  noDescription: 'La información verificada de este lugar estará disponible próximamente.',
  altitude: (m: string) => `${m} m de altitud`,
}, {
  closed: 'Temporarily closed',
  noDescription: 'Verified information about this place will be available soon.',
  altitude: (m: string) => `${m} m above sea level`,
});

// Tarjeta de lugar: la foto limpia arriba (sin velo ni etiquetas encima) y el texto debajo.
// El dato que distingue a cada lugar en la Sierra Gorda es la altitud: decide el clima, la ropa y el camino,
// por eso va junto al municipio. La categoría no se repite aquí: ya está en los filtros de la lista.
// Toda la tarjeta es clicable (el enlace del nombre se estira sobre ella).
export const PlaceCard = ({ place, altitude }: { place: Place; altitude?: number; showActivities?: boolean }) => {
  const closed = isClosedNotice(place.horarios);
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const alt = typeof place.altitud === 'number' ? place.altitud : altitude;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-sand">
        <Photo
          src={place.imagenPrincipal?.url}
          name={place.nombre}
          alt={place.imagenPrincipal?.altText || place.nombre}
          imgClassName="img-zoom"
          nameClassName="text-2xl"
        />
        {closed && (
          <span className="absolute left-3 top-3 rounded-full bg-clay-700 px-2.5 py-1 text-xs font-medium text-white">{m.closed}</span>
        )}
        <FavoriteButton placeId={place.id} size="sm" className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <p className="truncate text-label text-brand-blue/70">{place.municipio}</p>
          {alt !== undefined && (
            <p className="shrink-0 text-label tabular-nums text-brand-blue/70" title={m.altitude(alt.toLocaleString(localeFor(lang)))}>
              {alt.toLocaleString(localeFor(lang))} m
            </p>
          )}
        </div>
        <h3 className="font-display mt-1 text-title leading-tight text-brand-blue">
          <Link
            to={`/lugares/${place.slug}`}
            className="underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:underline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-brand-green"
          >
            {place.nombre}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-blue/75">
          {place.descripcion || m.noDescription}
        </p>
      </div>
    </article>
  );
};
