// Base visual de las tarjetas con fotografía (lugares, servicios y mosaico de la portada).
// Cada tarjeta decide su proporción y su contenido; aquí vive lo que comparten: el marco blanco
// con elevación al pasar el cursor, la foto con velo, la etiqueta de categoría y el municipio.
import type { ReactNode } from 'react';
import { PinIcon } from '../brand/icons';
import { Photo } from './Photo';

/** Marco de tarjeta: fondo blanco, borde fino, elevación al pasar el cursor y anillo de foco. */
export const CardFrame = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(31,44,36,.06)] ring-1 ring-brand-blue/8 transition-[transform,box-shadow] duration-500 ease-[var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(31,44,36,.45)] focus-within:ring-2 focus-within:ring-brand-green ${className}`}>
    {children}
  </article>
);

// Velo oscuro sobre la foto para que el texto blanco se lea. `strong`: texto sobre la foto;
// `soft`: sólo una línea (municipio) al pie.
const VEILS = {
  strong: 'from-brand-night/85 via-brand-night/15 to-transparent',
  soft: 'from-brand-night/70 via-transparent to-transparent',
} as const;

/** Etiqueta de categoría sobre la foto. */
export const CardBadge = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <span className={`pointer-events-none absolute left-3 top-3 truncate rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-blue ${className}`}>
    {children}
  </span>
);

/** Municipio con el pin de ubicación. */
export const CardPlace = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={`flex items-center gap-1.5 text-[12px] font-medium ${className}`}>
    <PinIcon className="size-3.5 shrink-0" />
    {children}
  </p>
);

interface CardMediaProps {
  src: string | null | undefined;
  name: string;
  alt?: string | null;
  /** Proporción y forma del bloque (p. ej. `aspect-[4/3]`). */
  className?: string;
  veil?: keyof typeof VEILS | 'none';
  veilClassName?: string;
  badge?: ReactNode;
  badgeClassName?: string;
  nameClassName?: string;
  /** Sin foto, escribe el nombre sobre el bloque. Apágalo cuando la tarjeta ya pinta el título encima. */
  showName?: boolean;
  onRatio?: (ratio: number) => void;
  /** Contenido sobre la foto (título, municipio, botones). */
  children?: ReactNode;
}

/** Fotografía de tarjeta con velo, etiqueta opcional y contenido superpuesto. */
export const CardMedia = ({
  src, name, alt, className = '', veil = 'strong', veilClassName = '', badge, badgeClassName = '', nameClassName = 'text-xl', showName = true, onRatio, children,
}: CardMediaProps) => (
  <div className={`relative overflow-hidden ${className}`}>
    <Photo src={src} name={showName ? name : null} alt={alt || name} imgClassName="img-zoom" nameClassName={nameClassName} onRatio={onRatio} />
    {veil !== 'none' && (
      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${VEILS[veil]} ${veilClassName}`} />
    )}
    {badge && <CardBadge className={badgeClassName}>{badge}</CardBadge>}
    {children}
  </div>
);
