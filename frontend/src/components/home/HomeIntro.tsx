// Por qué XploraSG: una declaración en serif y cuatro razones con el mismo lenguaje de "Lo que nos mueve"
// (filete superior, número en itálica, icono de línea). Sin fichas ni círculos de color: la jerarquía la dan
// la tipografía y el espacio. La razón del asistente abre Chatboot.
import type { ComponentType } from 'react';
import { useMessages } from '../../i18n';
import { homeMessages } from '../../i18n/home';
import { ArrowRightIcon, ShieldIcon, WifiOffIcon } from '../brand/icons';
import { PhoneIcon } from '../ui/LineIcons';
import { openAssistant } from './homeData';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

const ChatIcon = ({ className = 'size-5', strokeWidth = 1.4 }: { className?: string; strokeWidth?: number }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 19.5 5.6 16A7.5 7.5 0 1 1 8.4 18.6Z" />
    <path d="M9 11.5h6M9 8.5h4" />
  </svg>
);

export const HomeIntro = () => {
  const m = useMessages(homeMessages);
  const items: Array<{ key: string; title: string; text: string; Icon: IconType; action?: { label: string; run: () => void } }> = [
    { key: 'verified', title: m.verifiedTitle, text: m.verifiedText, Icon: ShieldIcon },
    { key: 'offline', title: m.offlineTitle, text: m.offlineText, Icon: WifiOffIcon },
    { key: 'contact', title: m.whatsappTitle, text: m.whatsappText, Icon: PhoneIcon },
    { key: 'assistant', title: m.assistantTitle, text: m.assistantText, Icon: ChatIcon, action: { label: m.assistantAction, run: openAssistant } },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28" aria-labelledby="home-simple">
      <p className="eyebrow">{m.simpleEyebrow}</p>
      <h2 id="home-simple" className="font-display mt-6 max-w-4xl text-[1.75rem] leading-[1.25] text-brand-blue sm:text-[2.1rem] lg:text-[2.6rem] lg:leading-[1.15]">
        {m.introLead} <em className="italic text-brand-green">{m.introEmphasis}</em>
      </h2>

      <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {items.map(({ key, title, text, Icon, action }, index) => (
          <li key={key} className="reveal flex flex-col border-t border-brand-blue/70 pt-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm italic text-brand-gold" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <Icon className="size-5 text-brand-green" strokeWidth={1.4} />
            </div>
            <h3 className="font-display mt-5 text-xl leading-snug text-brand-blue">{title}</h3>
            <p className="mt-2 text-[15px] leading-7 text-brand-blue/75">{text}</p>
            {action && (
              <button type="button" onClick={action.run} className="mt-3 inline-flex min-h-8 items-center gap-2 self-start border-b border-brand-blue/25 text-sm font-medium text-brand-blue transition-colors duration-300 hover:border-brand-green hover:text-brand-green">
                {action.label}
                <ArrowRightIcon className="size-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
