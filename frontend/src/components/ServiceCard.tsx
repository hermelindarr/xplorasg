import { Link } from 'react-router-dom';
import type { TourismService } from '../types/catalog';
import { WhatsAppButton } from './WhatsAppButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon } from './brand/icons';
import { CardFrame, CardMedia, CardPlace } from './ui/Card';

const messages = defineMessages({
  fallbackType: 'Servicio turístico',
  noDescription: 'Información en preparación.',
  price: 'Precio',
  details: 'Ver detalle',
  viewDetail: (name: string) => `Ver detalle: ${name}`,
}, {
  fallbackType: 'Tourism service',
  noDescription: 'Information coming soon.',
  price: 'Price',
  details: 'View details',
  viewDetail: (name: string) => `View details: ${name}`,
});

// Tarjeta de servicio, misma familia que PlaceCard: foto con etiqueta y municipio, nombre en serif,
// una línea de contexto, descripción, precio y, al pie, "Ver detalle" y WhatsApp discreto
// (sólo si el prestador tiene teléfono real).
// `compact`: en móvil se vuelve una fila (foto a la izquierda, datos a la derecha) para que un
// directorio largo se recorra rápido; desde `sm` es la tarjeta completa. Sin `compact` siempre es
// tarjeta completa (carriles de la portada).
export const ServiceCard = ({ service, compact = false, promoLabel }: { service: TourismService; compact?: boolean; /** Texto de la etiqueta cuando el servicio tiene una promoción real vigente. */ promoLabel?: string }) => {
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const badge = categoryLabel(service.categoria, lang) || service.tipoServicio || m.fallbackType;
  const context = service.tipoServicio && service.tipoServicio !== badge ? service.tipoServicio : service.prestador;
  // Clases que sólo aplican a la fila compacta de móvil.
  const row = (classes: string) => (compact ? classes : '');

  return (
    <CardFrame className={row('max-sm:flex-row')}>
      <CardMedia
        src={service.imagenPrincipal?.url}
        name={service.nombre}
        alt={service.imagenPrincipal?.altText}
        className={`aspect-[4/3] ${row('max-sm:aspect-auto max-sm:w-[6.75rem] max-sm:shrink-0')}`}
        veil="soft"
        veilClassName={row('max-sm:hidden')}
        badge={badge}
        badgeClassName={`max-w-[calc(100%-1.5rem)] ${row('max-sm:hidden')}`}
        showName={!compact}
      >
        {service.municipio && <CardPlace className={`absolute bottom-3 left-4 text-white/90 ${row('max-sm:hidden')}`}>{service.municipio}</CardPlace>}
      </CardMedia>

      <div className={`flex min-w-0 flex-1 flex-col px-5 pb-5 pt-4 ${row('max-sm:px-3.5 max-sm:pb-3 max-sm:pt-3')}`}>
        {compact && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-gold sm:hidden">
            {badge}{service.municipio ? ` · ${service.municipio}` : ''}
          </p>
        )}
        {promoLabel && (
          <p className={`mb-2 self-start rounded-full bg-brand-gold px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white ${row('max-sm:order-first max-sm:mb-1.5')}`}>{promoLabel}</p>
        )}
        <h3 className={`font-display line-clamp-2 text-[1.35rem] leading-snug text-brand-blue underline-offset-4 group-hover:underline ${row('max-sm:mt-0.5 max-sm:text-[1.05rem] max-sm:leading-tight')}`}>
          {service.nombre}
        </h3>
        {/* Una sola línea de contexto: el tipo de servicio (o, si no hay, quién lo ofrece). El prestador completo va en la ficha. */}
        {context && <p className="mt-1 line-clamp-1 text-[13px] text-brand-blue/70">{context}</p>}
        <p className={`mt-2.5 line-clamp-2 text-sm leading-6 text-brand-blue/70 ${row('max-sm:hidden')}`}>{service.descripcion || m.noDescription}</p>
        {service.rangoPrecio && (
          <p className={`mt-3 flex gap-3 border-t border-brand-sand pt-3 text-[13px] leading-5 ${row('max-sm:mt-1.5 max-sm:gap-2 max-sm:border-0 max-sm:pt-0')}`}>
            <span className="shrink-0 pt-px text-xs font-medium text-brand-gold">{m.price}</span>
            <span className={`line-clamp-2 text-brand-blue ${row('max-sm:line-clamp-1')}`}>{service.rangoPrecio}</span>
          </p>
        )}
        <div className={`mt-auto flex items-center justify-between gap-3 pt-5 ${row('max-sm:pt-2')}`}>
          {service.slug ? (
            <Link
              to={`/servicios/${service.slug}`}
              aria-label={m.viewDetail(service.nombre)}
              className="inline-flex min-h-9 items-center gap-2 whitespace-nowrap border-b border-brand-blue/25 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
            >
              {m.details}
              <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          ) : <span />}
          <WhatsAppButton serviceName={service.nombre} serviceId={service.id} contacto={service.contacto} size="sm" className="relative z-10" />
        </div>
      </div>
    </CardFrame>
  );
};
