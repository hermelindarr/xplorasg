import { Link } from 'react-router-dom';
import type { TourismService } from '../types/catalog';
import { WhatsAppButton } from './WhatsAppButton';
import { defineMessages, useLanguage, useMessages } from '../i18n';
import { categoryLabel } from '../i18n/common';
import { Photo } from './ui/Photo';
import { informativePrice } from '../utils/text';

const messages = defineMessages({
  fallbackType: 'Servicio turístico',
  noDescription: 'Información en preparación.',
}, {
  fallbackType: 'Tourism service',
  noDescription: 'Information coming soon.',
});

// Tarjeta de servicio, misma familia que PlaceCard: foto limpia arriba, texto debajo.
// El tipo y el municipio orientan; el nombre lleva a la ficha (enlace estirado sobre la tarjeta);
// WhatsApp queda al pie, sólo si el prestador tiene teléfono real.
export const ServiceCard = ({ service }: { service: TourismService }) => {
  const { lang } = useLanguage();
  const m = useMessages(messages);
  const kind = categoryLabel(service.categoria, lang) || service.tipoServicio || m.fallbackType;
  const price = informativePrice(service.rangoPrecio);

  const title = service.slug ? (
    <Link
      to={`/servicios/${service.slug}`}
      className="underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] group-hover:underline focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-brand-green"
    >
      {service.nombre}
    </Link>
  ) : service.nombre;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-sand">
        <Photo src={service.imagenPrincipal?.url} name={service.nombre} alt={service.imagenPrincipal?.altText || service.nombre} imgClassName="img-zoom" nameClassName="text-2xl" />
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-baseline justify-between gap-4 text-label text-brand-blue/70">
          <p className="truncate">{kind}</p>
          {service.municipio && <p className="shrink-0">{service.municipio}</p>}
        </div>
        <h3 className="font-display mt-1 line-clamp-2 text-title leading-tight text-brand-blue">{title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-blue/75">{service.descripcion || m.noDescription}</p>
        {price && <p className="mt-2 text-sm font-medium text-brand-blue">{price}</p>}
        <div className="mt-auto pt-4">
          <WhatsAppButton serviceName={service.nombre} serviceId={service.id} contacto={service.contacto} size="sm" className="relative z-10" />
        </div>
      </div>
    </article>
  );
};
