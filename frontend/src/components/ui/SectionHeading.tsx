// Encabezado de sección compartido por la portada, el catálogo y las fichas de detalle.
import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: ReactNode;
  /** Antetítulo pequeño en mayúsculas. Opcional: sólo cuando aporta contexto que el título no da. */
  eyebrow?: string;
  /** Texto de apoyo en columna estrecha (sólo tamaño `lg`). */
  text?: string;
  id?: string;
  /** Enlace o control alineado a la derecha en pantallas medianas y grandes. */
  action?: ReactNode;
  /** `lg`: secciones de página (portada, catálogo). `md`: bloques dentro de una ficha de detalle. */
  size?: 'lg' | 'md';
  align?: 'end' | 'start';
}

export const SectionHeading = ({ title, text, id, action, size = 'lg', align = 'end' }: SectionHeadingProps) => {
  if (size === 'md') {
    return (
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          
          <h2 id={id} className={`text-[2rem] leading-[1.08] text-brand-blue sm:text-[2.5rem]`}>{title}</h2>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
  return (
    <div className={`flex flex-col justify-between gap-6 md:flex-row ${align === 'end' ? 'md:items-end' : 'md:items-start'}`}>
      <div className="max-w-2xl">
        
        <h2 id={id} className={`section-title `}>{title}</h2>
        {text && <p className="mt-5 max-w-xl text-base leading-7 text-brand-blue/75">{text}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
