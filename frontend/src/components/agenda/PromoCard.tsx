// Promoción de un prestador. Se usa en la Agenda, en el directorio de Servicios y en la ficha del
// servicio. La vigencia va arriba y destacada: una promoción nunca debe leerse como información
// permanente. Las promociones de demostración se marcan como "Ejemplo" y no enlazan a canje.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Promocion } from '../../services/agendaApi';
import { defineMessages, useLanguage, useMessages } from '../../i18n';
import { ArrowRightIcon, CalendarIcon } from '../brand/icons';

const messages = defineMessages({
  promotion: 'Promoción',
  sample: 'Ejemplo',
  sampleNote: 'Promoción de ejemplo del prototipo: no es una oferta real y no se puede canjear.',
  offeredBy: (name: string) => `Ofrece: ${name}`,
  validUntil: (date: string) => `Válida hasta el ${date}`,
  endsToday: 'Termina hoy',
  daysLeft: (n: number) => (n === 1 ? 'Queda 1 día' : `Quedan ${n} días`),
  viewService: 'Ver prestador',
  conditions: 'Condiciones',
}, {
  promotion: 'Deal',
  sample: 'Sample',
  sampleNote: 'Sample deal from the prototype: it is not a real offer and cannot be redeemed.',
  offeredBy: (name: string) => `Offered by: ${name}`,
  validUntil: (date: string) => `Valid until ${date}`,
  endsToday: 'Ends today',
  daysLeft: (n: number) => (n === 1 ? '1 day left' : `${n} days left`),
  viewService: 'View business',
  conditions: 'Conditions',
});

const DAY = 86_400_000;

/** Días completos que le quedan a una promoción (0 = termina hoy). */
const promoDaysLeft = (fechaFin: string, now: number) => Math.max(0, Math.floor((new Date(fechaFin).getTime() - now) / DAY));

export const PromoCard = ({ promocion, compact = false }: { promocion: Promocion; compact?: boolean }) => {
  const m = useMessages(messages);
  const { locale } = useLanguage();
  const end = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' }).format(new Date(promocion.fecha_fin));
  const [now] = useState(() => Date.now());
  const left = promoDaysLeft(promocion.fecha_fin, now);
  const soon = left <= 14;

  return (
    <article className="relative flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-brand-blue/8 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
          promocion.es_ejemplo ? 'border border-brand-blue/20 text-brand-blue/70' : 'bg-brand-gold text-white'
        }`}>
          {promocion.es_ejemplo ? m.sample : m.promotion}
        </p>
        <p className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${soon ? 'text-clay-700' : 'text-brand-blue/75'}`}>
          <CalendarIcon className="size-3.5 shrink-0" />
          {m.validUntil(end)}{soon ? ` · ${left === 0 ? m.endsToday : m.daysLeft(left)}` : ''}
        </p>
      </div>

      <h3 className="font-display mt-3 text-xl leading-tight text-brand-blue sm:text-[1.4rem]">{promocion.titulo}</h3>
      {promocion.servicio_nombre ? (
        <p className="mt-1 text-sm text-brand-blue/70">
          {promocion.servicio_nombre}{promocion.prestador_nombre && !promocion.es_ejemplo && promocion.prestador_nombre !== promocion.servicio_nombre ? ` · ${promocion.prestador_nombre}` : ''}
        </p>
      ) : (!promocion.es_ejemplo && promocion.prestador_nombre) && (
        <p className="mt-1 text-sm text-brand-blue/70">{m.offeredBy(promocion.prestador_nombre)}</p>
      )}

      {promocion.descripcion && (
        <p className={`mt-3 text-sm leading-6 text-brand-blue/75 ${compact ? 'line-clamp-3' : ''}`}>{promocion.descripcion}</p>
      )}
      {promocion.es_ejemplo && (
        <p role="note" className="mt-3 rounded-lg bg-brand-sand/40 px-3 py-2 text-[13px] leading-5 text-brand-blue/80">{m.sampleNote}</p>
      )}
      {promocion.condiciones && !promocion.es_ejemplo && (
        <p className={`mt-3 text-xs leading-5 text-brand-blue/70 ${compact ? 'line-clamp-2' : ''}`}>
          <span className="font-medium">{m.conditions}: </span>
          {promocion.condiciones}
        </p>
      )}

      {promocion.servicio_slug && (
        <div className="mt-auto pt-4">
          <Link
            to={`/servicios/${promocion.servicio_slug}`}
            aria-label={`${m.viewService}: ${promocion.servicio_nombre ?? promocion.titulo}`}
            className="group inline-flex min-h-9 items-center gap-1.5 border-b border-brand-blue/25 text-[13px] font-medium text-brand-blue transition-colors duration-300 after:absolute after:inset-0 after:content-[''] hover:border-brand-green hover:text-brand-green"
          >
            {m.viewService}
            <ArrowRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </article>
  );
};
