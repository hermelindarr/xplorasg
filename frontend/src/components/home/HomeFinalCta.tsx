// Cierre editorial: fotografía del catálogo + pregunta en serif, con el asistente y la encuesta.
import { Link } from 'react-router-dom';
import { MacawAvatar } from '../brand/Macaw';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { openAssistant } from './homeData';
import { Photo } from '../ui/Photo';

export const HomeFinalCta = ({ photo, name }: { photo: string | null; name?: string | null }) => {
  const m = useMessages(homeMessages);
  return (
    <section aria-labelledby="home-final">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-4 pt-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:pb-12 lg:pt-24">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl md:aspect-[4/3] lg:col-span-6 lg:aspect-[5/4]">
          <Photo src={photo} name={name} nameClassName="text-3xl" />
        </div>
        <div className="lg:col-span-6 lg:max-w-lg">
          <p className="eyebrow">{m.finalEyebrow}</p>
          <h2 id="home-final" className="section-title mt-5">{m.finalTitle}</h2>
          <p className="mt-5 text-[15px] leading-7 text-brand-blue/75 sm:text-base sm:leading-8">{m.finalText}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button type="button" onClick={openAssistant} className="btn btn-primary min-h-12 pl-2 pr-6">
              <MacawAvatar className="size-9" />
              {m.finalAsk}
            </button>
            <Link to="/encuesta" className="btn btn-secondary min-h-12 px-6">
              {m.finalSurvey}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
