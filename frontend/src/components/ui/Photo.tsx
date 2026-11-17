// Fotografía del catálogo que llena su contenedor. La usan tarjetas, mosaico, carriles y portadas.
import { useState } from 'react';

/**
 * Fotografía del catálogo que llena su contenedor (object-cover).
 * Sin foto, o si no carga, queda un bloque crema con el nombre del lugar en serif: nunca un dibujo.
 */
export const Photo = ({
  src, alt = '', className = '', imgClassName = '', position, eager = false, onRatio,
}: {
  src: string | null | undefined;
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
  const showImage = Boolean(src) && !failed;
  return (
    <div className={`absolute inset-0 overflow-hidden bg-brand-sand ${className}`}>
      {showImage ? (
        <img
          src={src ?? ''}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailed(true)}
          onLoad={onRatio ? (event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth && naturalHeight) onRatio(naturalWidth / naturalHeight);
          } : undefined}
          style={position ? { objectPosition: position } : undefined}
          className={`absolute inset-0 size-full object-cover ${imgClassName}`}
        />
      ) : (
        // Sin foto no se dibuja texto sobre el degradado: el fondo queda limpio hasta tener la imagen real.
        <span aria-hidden="true" className="absolute inset-0 bg-brand-sand/50" />
      )}
    </div>
  );
};
