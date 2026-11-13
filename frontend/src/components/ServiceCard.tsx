import { Link } from 'react-router-dom';
import type { TourismService } from '../types/catalog';
import { WhatsAppButton } from './WhatsAppButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { ArrowRightIcon, PinIcon } from './brand/icons';
import { Photo } from './home/HomeUi';

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
    <article className="reveal group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(31,44,36,.06)] ring-1 ring-brand-blue/8 transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_22px_44px_-22px_rgba(31,44,36,.45)] focus-within:ring-2 focus-within:ring-brand-green">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Photo
          src={service.imagenPrincipal?.url}
          name={service.nombre}
          alt={service.imagenPrincipal?.altText || service.nombre}
          imgClassName="img-zoom"
          nameClassName="text-xl"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1a13]/70 via-transparent to-transparent" />
        <span className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue backdrop-blur">{badge}</span>
        {service.municipio && (
          <p className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[12px] font-medium text-white/90">
            <PinIcon className="size-3.5" />
            {service.municipio}
          </p>
        )}
      </div>

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
    </article>
  );
};
