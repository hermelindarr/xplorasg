// Portada · Prestadores locales: una muestra del directorio de servicios con enlace al directorio completo.
import { Link } from 'react-router-dom';
import { ServiceCard } from '../ServiceCard';
import { SectionHeading } from '../ui/SectionHeading';
import { TextLink } from '../ui/TextLink';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import type { TourismService } from '../../types/catalog';

const HOME_SERVICES = 6;
const GRID = 'mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0';

export const HomeProviders = ({ services, loading }: { services: TourismService[]; loading: boolean }) => {
  const m = useMessages(homeMessages);
  return (
    <section id="prestadores" className="scroll-mt-24 bg-brand-light" aria-labelledby="home-providers">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        {/* Sin icono en este enlace: el primer enlace con ícono de la sección es el de WhatsApp. */}
        <SectionHeading
          id="home-providers"
          eyebrow={m.providersEyebrow}
          title={m.providersTitle}
          text={m.providersText}
          action={<TextLink to="/servicios" arrow={false}>{m.allServices}</TextLink>}
        />
        {loading ? (
          <div className={GRID}>
            {[0, 1, 2].map((item) => <div key={item} className="h-96 animate-pulse rounded-xl bg-brand-sand/60" />)}
          </div>
        ) : services.length ? (
          <>
            <div className={GRID}>
              {services.slice(0, HOME_SERVICES).map((service) => <ServiceCard key={service.id} service={service} />)}
            </div>
            {services.length > HOME_SERVICES && (
              <div className="mt-12 flex justify-center">
                <Link to="/servicios" className="btn btn-primary min-h-12 px-9">{m.allServicesCount(services.length)}</Link>
              </div>
            )}
          </>
        ) : (
          <p className="mt-12 rounded-xl border border-dashed border-brand-blue/20 p-8 text-center text-sm text-brand-blue/70">
            {m.providersEmpty}
          </p>
        )}
      </div>
    </section>
  );
};
