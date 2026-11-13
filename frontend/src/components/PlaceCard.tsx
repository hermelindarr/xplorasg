import { Link } from 'react-router-dom';
import type { Place } from '../types/catalog';
import { activityTags, isClosedNotice } from '../utils/text';
import { FavoriteButton } from './FavoriteButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon, PinIcon } from './brand/icons';
import { Photo } from './home/HomeUi';

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
    <article className="reveal group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(31,44,36,.06)] ring-1 ring-brand-blue/8 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(31,44,36,.45)] focus-within:ring-2 focus-within:ring-brand-green">
      <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/6]">
        <Photo
          src={place.imagenPrincipal?.url}
          name={place.nombre}
          alt={place.imagenPrincipal?.altText || place.nombre}
          imgClassName="img-zoom"
          nameClassName="text-xl"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1a13]/85 via-[#0f1a13]/15 to-transparent" />
        <span className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-4.25rem)] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue backdrop-blur">
          {categoryLabel(place.categoria, lang)}
        </span>
        <FavoriteButton placeId={place.id} size="sm" className="absolute right-3 top-3 z-10" />

        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          {closed && (
            <span className="mb-2 inline-block rounded-full bg-clay-700 px-2.5 py-1 text-xs font-medium">{m.closed}</span>
          )}
          <p className="flex items-center gap-1.5 truncate text-[12px] font-medium text-white/80">
            <PinIcon className="size-3.5 shrink-0" />
            {place.municipio}
          </p>
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
      </div>

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
    </article>
  );
};
