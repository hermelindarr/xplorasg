// Portada · Prestadores locales: una muestra del directorio de servicios con enlace al directorio completo.
import { Link } from 'react-router-dom';
import { ServiceCard } from '../ServiceCard';
import { SectionHeading } from '../ui/SectionHeading';
import { TextLink } from '../ui/TextLink';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import type { TourismService } from '../../types/catalog';

const HOME_SERVICES = 6;
// Móvil: carril horizontal. Tableta: rejilla de 2 (cuatro tarjetas). Escritorio: rejilla de 3 (tres tarjetas).
const GRID = 'snap-rail -mx-5 mt-8 flex scroll-px-5 gap-4 overflow-x-auto px-5 pb-3 md:mx-0 md:mt-12 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3';
const ITEM = 'w-[78%] max-w-[20rem] shrink-0 md:w-auto md:max-w-none md:min-w-0';

export const HomeProviders = ({ services, loading }: { services: TourismService[]; loading: boolean }) => {
  const m = useMessages(homeMessages);
  return (
    <section id="prestadores" className="scroll-mt-24 bg-brand-light" aria-labelledby="home-providers">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-24">
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
            {[0, 1, 2].map((item) => <div key={item} className={`h-96 animate-pulse rounded-2xl bg-brand-sand/60 ${ITEM}`} />)}
          </div>
        ) : services.length ? (
          <>
            <ul className={GRID}>
              {services.slice(0, HOME_SERVICES).map((service, index) => (
                <li key={service.id} className={`${ITEM} ${index >= 4 ? 'md:hidden' : index === 3 ? 'lg:hidden' : ''}`}>
                  <ServiceCard service={service} />
                </li>
              ))}
            </ul>
            {services.length > HOME_SERVICES && (
              <div className="mt-8 flex justify-center md:mt-12">
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
