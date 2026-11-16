// Fotografía del catálogo que llena su contenedor. La usan tarjetas, mosaico, carriles y portadas.
import { useState } from 'react';

/**
 * Fotografía del catálogo que llena su contenedor (object-cover).
 * Sin foto, o si no carga, queda un bloque crema con el nombre del lugar en serif: nunca un dibujo.
 */
export const Photo = ({
  src, name, alt = '', className = '', imgClassName = '', position, eager = false, nameClassName = 'text-2xl', onRatio,
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
        name && (
          <span aria-hidden="true" className={`font-display absolute inset-x-0 bottom-0 p-5 font-normal italic leading-tight text-brand-blue/70 sm:p-6 ${nameClassName}`}>
            {name}
          </span>
        )
      )}
    </div>
  );
};
