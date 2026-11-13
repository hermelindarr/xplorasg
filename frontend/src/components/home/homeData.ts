// Utilidades de datos del inicio: elegir fotografías reales del catálogo (vienen de la API)
// para el hero, el mosaico de destinos, los temas y el cierre. Nunca se usan fotos externas.
import type { Place, TourismService } from '../../types/catalog';

type WithPhoto = { slug: string | null; imagenPrincipal?: { url: string | null } | null };

export const hasPhoto = (item: WithPhoto | null | undefined): boolean => Boolean(item?.imagenPrincipal?.url);
export const photoOf = (item: WithPhoto | null | undefined): string | null => item?.imagenPrincipal?.url ?? null;

export const isMission = (place: Place) => /misi[oó]n/i.test(place.nombre);
export const isNature = (place: Place) => /natura/i.test(place.categoria);

/** Curaduría editorial: orden preferido de las fotos más limpias del catálogo (el resto conserva su orden). */
// Sólo fotos de 2000 px o más de ancho: el hero ocupa toda la pantalla y una foto pequeña se ve estirada.
const HERO_PREFERENCE = ['las-adjuntas', 'mirador-de-cristal', 'tancama', 'cuatro-palos', 'presa-jalpan'];
const MOSAIC_PREFERENCE = [
  'cuatro-palos', 'mision-de-tancoyol', 'cascadas-maravilla', 'neblinas', 'canon-del-paraiso', 'tancama',
  'mirador-de-cristal', 'vestigios-prehistoricos', 'balneario-el-oasis', 'ranas',
];

/** Ordena por una lista de slugs preferidos y deja el resto en su orden original. */
const byPreference = <T extends WithPhoto>(items: T[], preferred: string[]) => {
  const rank = (item: T) => {
    const index = preferred.indexOf(item.slug ?? '');
    return index === -1 ? preferred.length : index;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
};

/**
 * Diapositivas del hero: hasta 5 lugares con foto, priorizando las de alta resolución.
 * Sin fotos (p. ej. datos de prueba) devuelve el primer lugar para mostrar su nombre en serif.
 */
export const pickHeroSlides = (places: Place[], max = 5): Place[] => {
  const withPhoto = places.filter(hasPhoto);
  if (!withPhoto.length) return places.slice(0, 1);
  const sharp = byPreference(withPhoto.filter((place) => HERO_PREFERENCE.includes(place.slug ?? '')), HERO_PREFERENCE);
  // Si el catálogo no trae esas fotos, se completa con el resto en su orden original.
  const rest = withPhoto.filter((place) => !sharp.includes(place));
  return [...sharp, ...rest].slice(0, max);
};

/** Lugares para el mosaico de destinos: prioriza fotos que no aparecen en el hero. */
/**
 * Fotos del catálogo que no deben destacarse hasta reemplazarlas por fotos propias:
 * marca de agua de bancos de imágenes (Tilaco, Concá) o collage con texto y gráficos.
 */
export const NOT_FEATURABLE = ['mision-de-tilaco', 'mision-de-san-miguel-conca', 'pollos-brandon-comedores-de-landa', 'sierra-gorda-ecotours-operadora-de-grupo-ecologico-sierra-gorda'];
const WATERMARKED = NOT_FEATURABLE;

export const pickMosaic = (places: Place[], exclude: Place[], max = 9): Place[] => {
  const withPhoto = places.filter((place) => hasPhoto(place) && !WATERMARKED.includes(place.slug ?? ''));
  if (withPhoto.length < 4) return places.slice(0, max);
  const excluded = new Set(exclude.map((place) => place.id));
  const fresh = byPreference(withPhoto.filter((place) => !excluded.has(place.id)), MOSAIC_PREFERENCE);
  const rest = withPhoto.filter((place) => excluded.has(place.id));
  return [...fresh, ...rest].slice(0, max);
};

/** Primer elemento con foto que cumpla el filtro, evitando los ya usados. */
export const firstWithPhoto = <T extends WithPhoto>(items: T[], test: (item: T) => boolean, used: Set<string>, preferred: string[] = []): T | null => {
  const found = byPreference(items, preferred).find((item) => hasPhoto(item) && !NOT_FEATURABLE.includes(item.slug ?? '') && test(item) && !used.has(photoOf(item) ?? ''));
  if (found) used.add(photoOf(found) ?? '');
  return found ?? null;
};

export const serviceIn = (pattern: RegExp) => (service: TourismService) => pattern.test(`${service.categoria ?? ''} ${service.tipoServicio ?? ''}`);

export const openAssistant = () => window.dispatchEvent(new CustomEvent('xplora:open-assistant'));
