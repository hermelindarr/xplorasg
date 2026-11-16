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

// Tarjeta de servicio, misma familia que PlaceCard: foto con etiqueta y municipio sobre la imagen, nombre en serif,
// una línea de contexto, dos de descripción, precio con filete y, al pie, "Ver detalle" y WhatsApp discreto
// (sólo si el prestador tiene teléfono real). Todas las tarjetas terminan igual, haya o no WhatsApp.
export const ServiceCard = ({ service }: { service: TourismService }) => {
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const badge = categoryLabel(service.categoria, lang) || service.tipoServicio || m.fallbackType;

  return (
    <CardFrame>
      <CardMedia
        src={service.imagenPrincipal?.url}
        name={service.nombre}
        alt={service.imagenPrincipal?.altText}
        className="aspect-[4/3]"
        veil="soft"
        badge={badge}
        badgeClassName="max-w-[calc(100%-1.5rem)]"
      >
        {service.municipio && <CardPlace className="absolute bottom-3 left-4 text-white/90">{service.municipio}</CardPlace>}
      </CardMedia>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="font-display line-clamp-2 text-[1.35rem] leading-snug text-brand-blue underline-offset-4 group-hover:underline">
          {service.nombre}
        </h3>
        {/* Una sola línea de contexto: el tipo de servicio (o, si no hay, quién lo ofrece). El prestador completo va en la ficha. */}
        {(service.tipoServicio && service.tipoServicio !== badge ? service.tipoServicio : service.prestador) && (
          <p className="mt-1 line-clamp-1 text-[13px] text-brand-blue/70">
            {service.tipoServicio && service.tipoServicio !== badge ? service.tipoServicio : service.prestador}
          </p>
        )}
        <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-brand-blue/70">{service.descripcion || m.noDescription}</p>
        {service.rangoPrecio && (
          <p className="mt-3 flex gap-3 border-t border-brand-sand pt-3 text-[13px] leading-5">
            <span className="shrink-0 pt-px text-xs font-medium text-brand-gold">{m.price}</span>
            <span className="line-clamp-2 text-brand-blue">{service.rangoPrecio}</span>
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {service.slug ? (
            <Link
              to={`/servicios/${service.slug}`}
              aria-label={m.viewDetail(service.nombre)}
              className="inline-flex min-h-9 items-center gap-2 border-b border-brand-blue/25 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] group-hover:border-brand-green group-hover:text-brand-green"
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
