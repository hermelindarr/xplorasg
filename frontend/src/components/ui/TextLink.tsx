import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../brand/icons';

const textLinkClass = 'group inline-flex items-center gap-2 border-b border-brand-blue/25 pb-1 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green';

/** Enlace de texto subrayado con flecha (estilo editorial). `arrow={false}` lo deja sólo con texto. */
export const TextLink = ({ to, children, arrow = true, className = '' }: { to: string; children: ReactNode; arrow?: boolean; className?: string }) => {
  const content = (
    <>
      {children}
      {arrow && <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
    </>
  );
  return to.startsWith('#')
    ? <a href={to} className={`${textLinkClass} ${className}`}>{content}</a>
    : <Link to={to} className={`${textLinkClass} ${className}`}>{content}</Link>;
};
