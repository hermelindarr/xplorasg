import { Link } from 'react-router-dom';
import type { Place } from '../types/catalog';
import { activityTags, isClosedNotice } from '../utils/text';
import { FavoriteButton } from './FavoriteButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon } from './brand/icons';
import { CardFrame, CardMedia, CardPlace } from './ui/Card';

const messages = defineMessages({
  closed: 'Cerrado temporalmente',
  noDescription: 'La información verificada de este lugar estará disponible próximamente.',
  activities: 'Actividades',
  seePlace: 'Ver lugar',
  viewPlace: (name: string) => `Ver lugar: ${name}`,
}, {
  closed: 'Temporarily closed',
  noDescription: 'Verified information about this place will be available soon.',
  activities: 'Activities',
  seePlace: 'View place',
  viewPlace: (name: string) => `View place: ${name}`,
});

// Tarjeta inmersiva: la fotografía manda. Nombre y municipio en blanco sobre un velo inferior,
// categoría y favorito arriba. Toda la tarjeta es clicable (el enlace es el nombre).
// En móvil es compacta (rejilla de dos columnas): foto, municipio, nombre y una línea de actividades recortada.
// Desde `sm` muestra la tarjeta completa con descripción.
export const PlaceCard = ({ place, showActivities = true }: { place: Place; showActivities?: boolean }) => {
  const tags = showActivities ? activityTags(place.actividades).slice(0, 2) : [];
  const closed = isClosedNotice(place.horarios);
  const { lang } = useLanguage();
  const m = useMessages(messages);

  return (
    <CardFrame>
      <CardMedia
        src={place.imagenPrincipal?.url}
        name={place.nombre}
        alt={place.imagenPrincipal?.altText}
        className="aspect-[3/4] sm:aspect-[5/6]"
        badge={categoryLabel(place.categoria, lang)}
        badgeClassName="max-w-[calc(100%-4.25rem)] max-sm:left-2 max-sm:top-2 max-sm:px-2 max-sm:text-[10px] max-sm:tracking-[0.08em]"
        showName={false}
      >
        <FavoriteButton placeId={place.id} size="sm" className="absolute right-2 top-2 z-10 sm:right-3 sm:top-3" />

        <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
          {closed && (
            <span className="mb-2 inline-block rounded-full bg-clay-700 px-2.5 py-1 text-xs font-medium">{m.closed}</span>
          )}
          <CardPlace className="truncate text-white/80">{place.municipio}</CardPlace>
          <h3 className="font-display mt-1 line-clamp-2 text-[1.05rem] leading-tight sm:text-[1.4rem]">
            <Link to={`/lugares/${place.slug}`} aria-label={m.viewPlace(place.nombre)} className="outline-none after:absolute after:inset-0 after:content-['']">
              {place.nombre}
            </Link>
          </h3>
          {tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5 max-sm:mt-2 max-sm:flex-nowrap max-sm:overflow-hidden" aria-label={m.activities}>
              {tags.map((tag) => (
                <li key={tag} className="max-w-full truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </CardMedia>

      <div className="flex flex-1 items-start justify-between gap-3 px-5 py-4 max-sm:hidden">
        {/* Dos líneas de descripción: una sola cortaba la idea a media frase. */}
        <p className="line-clamp-2 text-[13px] leading-5 text-brand-blue/75">
          {place.descripcion || m.noDescription}
        </p>
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-brand-blue transition-colors duration-300 group-hover:bg-brand-green group-hover:text-white">
          <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </CardFrame>
  );
};
