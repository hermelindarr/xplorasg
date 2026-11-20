// Fotografía del catálogo que llena su contenedor. La usan tarjetas, mosaico, carriles y portadas.
import { useState } from 'react';
import { CARD_SIZES, photoSrcSet } from '../../utils/responsiveImage';

/**
 * Fotografía del catálogo que llena su contenedor (object-cover).
 * Sin foto, o si no carga, queda un bloque crema con el nombre del lugar en serif: nunca un dibujo.
 */
export const Photo = ({
  src, alt = '', className = '', imgClassName = '', position, eager = false, onRatio, sizes = CARD_SIZES,
}: {
  src: string | null | undefined;
  /** Ancho con que se muestra la foto (atributo `sizes`); por defecto, el de una tarjeta de la rejilla. */
  sizes?: string;
  name?: string | null;
  alt?: string;
  className?: string;
  imgClassName?: string;
  position?: string;
  eager?: boolean;
  nameClassName?: string;
  /** Proporción natural (ancho / alto) de la foto al cargar. */
  onRatio?: (ratio: number) => void;
}) => {
  const [failed, setFailed] = useState(false);
  // Fundido suave al terminar de cargar (evita que la foto "salte" sobre el bloque beige).
  // Se guarda la URL cargada: si cambia `src`, la nueva vuelve a empezar oculta.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && !failed;
  const loaded = loadedSrc === src;
  // Fotos que ya estaban en caché pueden completar antes de que React enganche onLoad.
  const markIfComplete = (img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0 && src && loadedSrc !== src) setLoadedSrc(src);
  };
  return (
    <div className={`absolute inset-0 overflow-hidden bg-brand-sand ${className}`}>
      {showImage ? (
        <img
          src={src ?? ''}
          srcSet={photoSrcSet(src)}
          sizes={photoSrcSet(src) ? sizes : undefined}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          ref={markIfComplete}
          onError={() => setFailed(true)}
          onLoad={(event) => {
            setLoadedSrc(src ?? null);
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (onRatio && naturalWidth && naturalHeight) onRatio(naturalWidth / naturalHeight);
          }}
          style={position ? { objectPosition: position } : undefined}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        />
      ) : (
        // Sin foto no se escribe texto sobre el degradado; el bloque queda limpio hasta tener la imagen real.
        <span aria-hidden="true" className="absolute inset-0 bg-brand-sand/50" />
      )}
    </div>
  );
};
