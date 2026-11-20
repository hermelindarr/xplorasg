// Tamaños responsivos para las fotos del catálogo.
// Hoy todas vienen de miniaturas de Wikimedia (…/thumb/…/960px-Archivo.jpg), que sólo sirve anchos estándar:
// 330 px (~24 KB), 500 px (~53 KB) y 960 px (~134 KB); otros anchos responden 400.
const WIKIMEDIA_THUMB = /^(https:\/\/(?:thumb|upload)\.wikimedia\.org\/.+\/thumb\/.+\/)(\d+)px-([^/]+)$/;
const WIKIMEDIA_WIDTHS = [330, 500, 960];

/** `srcset` para una foto conocida, o `undefined` si la URL no admite otros tamaños. */
export const photoSrcSet = (src: string | null | undefined): string | undefined => {
  const match = src ? WIKIMEDIA_THUMB.exec(src) : null;
  if (!match) return undefined;
  const [, base, , file] = match;
  return WIKIMEDIA_WIDTHS.map((w) => `${base}${w}px-${file} ${w}w`).join(', ');
};

/**
 * `sizes` de las tarjetas (rejilla de 1 → 2 → 3 → 4 columnas).
 * En teléfonos se declara 250 px a propósito: con pantalla 2× el navegador elige la versión de 500 px
 * (2.5 veces más ligera que la de 960) para una foto de tarjeta; en la sierra la señal es débil y los datos cuentan.
 */
export const CARD_SIZES = '(max-width: 639px) 250px, (max-width: 1023px) 45vw, (max-width: 1279px) 30vw, 22vw';

/** Fotos a todo lo ancho (cabecera de ficha): se respeta la calidad completa. */
export const FULL_WIDTH_SIZES = '(min-width: 1280px) 1200px, 100vw';
