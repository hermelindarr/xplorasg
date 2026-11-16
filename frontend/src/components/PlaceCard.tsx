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
// categoría y favorito arriba, actividades como pastillas. Al pasar el cursor la tarjeta se eleva
// y la foto se acerca. Toda la tarjeta es clicable.
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
        className="aspect-[4/5] sm:aspect-[5/6]"
        badge={categoryLabel(place.categoria, lang)}
        badgeClassName="max-w-[calc(100%-4.25rem)]"
        showName={false}
      >
        <FavoriteButton placeId={place.id} size="sm" className="absolute right-3 top-3 z-10" />

        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          {closed && (
            <span className="mb-2 inline-block rounded-full bg-clay-700 px-2.5 py-1 text-xs font-medium">{m.closed}</span>
          )}
          <CardPlace className="truncate text-white/80">{place.municipio}</CardPlace>
          <h3 className="font-display mt-1 line-clamp-2 text-[1.4rem] leading-tight">
            {place.nombre}
          </h3>
          {tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={m.activities}>
              {tags.map((tag) => (
                <li key={tag} className="max-w-full truncate rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">{tag}</li>
              ))}
            </ul>
          )}
        </div>
      </CardMedia>

      <div className="flex flex-1 items-start justify-between gap-3 px-4 py-4 sm:px-5">
        {/* Dos líneas de descripción: una sola cortaba la idea a media frase. */}
        <p className="line-clamp-2 text-[13px] leading-5 text-brand-blue/75">
          {place.descripcion || m.noDescription}
        </p>
        <Link
          to={`/lugares/${place.slug}`}
          aria-label={m.viewPlace(place.nombre)}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-light text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:bg-brand-green group-hover:text-white"
        >
          <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </CardFrame>
  );
};
