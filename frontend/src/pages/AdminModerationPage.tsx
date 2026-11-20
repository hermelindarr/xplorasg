// Bandeja de moderación ("/admin/moderacion"): todo lo que espera validación antes de verse en la vista pública.
// Acciones por solicitud: Aprobar y publicar · Editar directamente · Rechazar (con motivo) · Eliminar.
import { usePageTitle } from '../hooks/usePageTitle';
import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, errorMessage } from '../services/authorizedFetch';
import { FIELD_LABELS, moderationApi, type ModerationItem, type ModerationKind } from '../services/moderationApi';
import { AlertIcon, CheckCircleIcon, ExternalIcon, InboxIcon } from '../components/admin/AdminIcons';
import { BackLink, EmptyState, Notice, PageHeader } from '../components/admin/AdminUi';
import { tabClass } from '../components/admin/classes';
import { ContentEditor } from '../components/admin/ContentEditor';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

type Filter = 'todas' | 'nuevo' | 'cambios' | 'promocion' | 'lugar';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'todas', label: 'Todas' },
  { value: 'nuevo', label: 'Servicios nuevos' },
  { value: 'cambios', label: 'Cambios a servicios' },
  { value: 'promocion', label: 'Promociones' },
  { value: 'lugar', label: 'Lugares' },
];

const matches = (item: ModerationItem, filter: Filter) => {
  if (filter === 'todas') return true;
  if (filter === 'nuevo') return item.tipo === 'servicio' && item.solicitud === 'nuevo';
  if (filter === 'cambios') return item.solicitud === 'cambios';
  return item.tipo === filter;
};

const requestLabel = (item: ModerationItem) => {
  if (item.tipo === 'promocion') return 'Promoción';
  if (item.tipo === 'lugar') return 'Lugar';
  return item.solicitud === 'cambios' ? 'Cambios a servicio publicado' : 'Servicio nuevo';
};

const relative = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' });
const sentAgo = (iso: string) => {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (Math.abs(days) < 1) {
    const hours = Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
    return relative.format(hours, 'hour');
  }
  return relative.format(days, 'day');
};
const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });

const keyOf = (item: ModerationItem) => `${item.tipo}-${item.id}`;

type Pending = { action: 'reject' | 'delete'; item: ModerationItem } | null;

export const AdminModerationPage = () => {
  usePageTitle('Solicitudes pendientes');
  const { token } = useAuth();
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('todas');
  const [open, setOpen] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string; missing?: string[]; item?: ModerationItem } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [editing, setEditing] = useState<{ kind: 'servicio' | 'lugar'; id: number; nombre: string } | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const response = await moderationApi.queue(token);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(errorMessage(requestError, 'No fue posible cargar las solicitudes.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  // oxlint-disable-next-line react/set-state-in-effect -- carga inicial de la bandeja
  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(({ value }) => [value, items.filter((item) => matches(item, value)).length])) as Record<Filter, number>, [items]);
  const visible = items.filter((item) => matches(item, filter));

  const approve = async (item: ModerationItem) => {
    if (!token) return;
    setBusyKey(keyOf(item));
    setNotice(null);
    try {
      await moderationApi.approve(token, item.tipo, item.id);
      setNotice({ tone: 'ok', text: item.solicitud === 'cambios' ? `Se publicaron los cambios de “${item.nombre}”.` : `“${item.nombre}” quedó publicado y ya lo ven los turistas.` });
      setOpen(null);
      await load();
    } catch (requestError) {
      const missing = requestError instanceof ApiError ? requestError.missing : [];
      setNotice({ tone: 'error', text: errorMessage(requestError, 'No fue posible aprobar.'), missing, item });
    } finally {
      setBusyKey(null);
    }
  };

  const confirmPending = async (reason: string) => {
    if (!token || !pending) return;
    setDialogBusy(true);
    setDialogError('');
    const { action, item } = pending;
    try {
      if (action === 'reject') await moderationApi.reject(token, item.tipo, item.id, reason);
      else await moderationApi.remove(token, item.tipo, item.id);
      setPending(null);
      setOpen(null);
      setNotice({
        tone: 'ok',
        text: action === 'delete'
          ? `“${item.nombre}” se eliminó.`
          : item.solicitud === 'cambios'
            ? `Se descartaron los cambios de “${item.nombre}”. La ficha publicada no cambió.`
            : `“${item.nombre}” se rechazó. El prestador verá el motivo.`,
      });
      await load();
    } catch (requestError) {
      setDialogError(errorMessage(requestError, 'No fue posible completar la acción.'));
    } finally {
      setDialogBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        before={<BackLink to="/admin">Panel de administración</BackLink>}
        title="Solicitudes pendientes"
        meta={<p className="max-w-3xl">Nada de lo que envían los prestadores se publica solo. Revisa cada solicitud y decide: aprobar y publicar, editar, rechazar con motivo o eliminar.</p>}
      />

      <div className="mt-10 border-b border-brand-sand">
        <div className="-mx-5 flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:gap-8 sm:px-0" role="group" aria-label="Tipo de solicitud">
          {FILTERS.map(({ value, label }) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${tabClass(filter === value)} shrink-0`}>
              {label} <span className="ml-1 tabular-nums text-brand-blue/60">{counts[value] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="mt-6">
          <Notice tone={notice.tone}>
            {notice.text}
            {notice.missing && notice.missing.length > 0 && (
              <>
                {' '}Falta: {notice.missing.join(', ')}.
                {notice.item && notice.item.tipo !== 'promocion' && (
                  <button type="button" onClick={() => setEditing({ kind: notice.item!.tipo as 'servicio' | 'lugar', id: notice.item!.id, nombre: notice.item!.nombre })} className="ml-2 font-medium underline underline-offset-2">
                    Editar ficha
                  </button>
                )}
              </>
            )}
          </Notice>
        </div>
      )}
      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {loading ? (
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-brand-sand bg-brand-sand" aria-busy="true">
          {[0, 1, 2, 3].map((row) => <div key={row} className="h-16 animate-pulse bg-white" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={InboxIcon} title="No hay solicitudes pendientes" text={filter === 'todas' ? 'Cuando un prestador envíe un servicio, un cambio o una promoción, aparecerá aquí.' : 'Prueba con otro filtro.'} />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-brand-sand bg-white">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Solicitudes pendientes de validación, de la más antigua a la más reciente</caption>
            <thead className="hidden border-b border-brand-sand text-label text-brand-blue/70 md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Solicitud</th>
                <th scope="col" className="px-5 py-3 font-medium">Prestador</th>
                <th scope="col" className="px-5 py-3 font-medium">Municipio</th>
                <th scope="col" className="px-5 py-3 font-medium">Enviada</th>
                <th scope="col" className="px-5 py-3 font-medium">Para publicar</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-sand">
              {visible.map((item) => {
                const key = keyOf(item);
                const expanded = open === key;
                const busy = busyKey === key;
                const detailId = `detalle-${key}`;
                return (
                  <Fragment key={key}>
                    <tr className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-5 py-4 md:table-row md:px-0 md:py-0 ${expanded ? 'bg-brand-paper/70' : ''}`}>
                      <td className="md:px-5 md:py-4">
                        <p className="font-medium text-brand-blue">{item.nombre}</p>
                        <p className="text-label text-brand-blue/70">{requestLabel(item)}{item.categoria ? `, ${item.categoria}` : ''}</p>
                      </td>
                      <td className="col-start-1 text-label text-brand-blue/80 md:px-5 md:py-4 md:text-sm">{item.prestador ?? '—'}</td>
                      <td className="col-start-1 text-label text-brand-blue/80 md:px-5 md:py-4 md:text-sm">{item.municipio ?? '—'}</td>
                      <td className="col-start-1 text-label text-brand-blue/70 md:px-5 md:py-4 md:text-sm" title={dateFormatter.format(new Date(item.enviadoAt))}>{sentAgo(item.enviadoAt)}</td>
                      <td className="col-start-1 mt-1 md:mt-0 md:px-5 md:py-4">
                        {item.faltantes.length ? (
                          <span className="inline-flex items-start gap-1.5 text-label text-ochre-900"><AlertIcon className="mt-0.5 size-3.5 shrink-0 text-ochre-600" />Falta {item.faltantes.join(', ')}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-label text-brand-green"><CheckCircleIcon className="size-3.5" />Lista</span>
                        )}
                      </td>
                      <td className="col-start-2 row-span-5 row-start-1 self-center text-right md:px-5 md:py-4">
                        <button type="button" aria-expanded={expanded} aria-controls={detailId} onClick={() => setOpen(expanded ? null : key)} className="btn btn-secondary">
                          {expanded ? 'Cerrar' : 'Revisar'}
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr id={detailId} className="block bg-brand-paper/70 md:table-row">
                        <td colSpan={6} className="block px-5 pb-6 md:table-cell">
                          <RequestDetail item={item} />
                          <div className="mt-5 flex flex-wrap items-center gap-2">
                            <button type="button" disabled={busy} onClick={() => void approve(item)} className="btn btn-accent">
                              <CheckCircleIcon className="size-4" /> {busy ? 'Publicando…' : item.solicitud === 'cambios' ? 'Aprobar y publicar cambios' : 'Aprobar y publicar'}
                            </button>
                            {item.tipo !== 'promocion' && (
                              <button type="button" disabled={busy} onClick={() => setEditing({ kind: item.tipo as 'servicio' | 'lugar', id: item.id, nombre: item.nombre })} className="btn btn-secondary">
                                Editar
                              </button>
                            )}
                            <button type="button" disabled={busy} onClick={() => { setDialogError(''); setPending({ action: 'reject', item }); }} className="btn border border-clay-200 bg-white text-clay-800 hover:border-clay-500">
                              Rechazar
                            </button>
                            <button type="button" disabled={busy} onClick={() => { setDialogError(''); setPending({ action: 'delete', item }); }} className="btn btn-ghost text-clay-800">
                              Eliminar
                            </button>
                            {item.slug && item.estado === 'aprobado' && item.tipo !== 'promocion' && (
                              <Link to={`/${item.tipo === 'lugar' ? 'lugares' : 'servicios'}/${item.slug}`} className="ml-auto inline-flex min-h-11 items-center gap-1 text-label text-brand-blue/75 underline-offset-2 hover:text-brand-blue hover:underline">
                                Ver ficha publicada <ExternalIcon className="size-3.5" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pending?.action === 'reject'}
        title={pending?.item.solicitud === 'cambios' ? '¿Rechazar los cambios?' : '¿Rechazar la solicitud?'}
        confirmLabel="Rechazar"
        reasonLabel="Motivo (lo verá el prestador para corregir)"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={(reason) => void confirmPending(reason)}
        onCancel={() => setPending(null)}
      >
        <p>
          {pending?.item.solicitud === 'cambios'
            ? <>Se descartan los cambios propuestos para “{pending?.item.nombre}”. La ficha publicada sigue igual.</>
            : <>“{pending?.item.nombre}” no se publicará. El prestador verá el motivo y podrá corregir y volver a enviarlo.</>}
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={pending?.action === 'delete'}
        title="¿Eliminar definitivamente de la plataforma?"
        confirmLabel="Eliminar"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={() => void confirmPending('')}
        onCancel={() => setPending(null)}
      >
        <p>“{pending?.item.nombre}” desaparecerá de la vista pública, de esta bandeja y del panel del prestador. Si estaba publicado, deja de verse de inmediato.</p>
      </ConfirmDialog>

      {token && (
        <ContentEditor
          token={token}
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); setNotice({ tone: 'ok', text: message }); void load(); }}
        />
      )}
    </section>
  );
};

const RequestDetail = ({ item }: { item: ModerationItem }) => {
  if (item.tipo === 'promocion' && item.detalle) {
    return (
      <dl className="grid gap-x-8 gap-y-3 pt-1 sm:grid-cols-2">
        <Detail label="Servicio">{item.categoria ?? 'General'}</Detail>
        <Detail label="Vigencia">del {dateFormatter.format(new Date(item.detalle.fechaInicio))} al {dateFormatter.format(new Date(item.detalle.fechaFin))}</Detail>
        {item.detalle.descripcion && <Detail label="Descripción" wide>{item.detalle.descripcion}</Detail>}
        {item.detalle.condiciones && <Detail label="Condiciones" wide>{item.detalle.condiciones}</Detail>}
      </dl>
    );
  }
  if (item.cambios.length) {
    return (
      <div className="pt-1">
        <p className="text-label text-brand-blue/70">{item.solicitud === 'cambios' ? 'Lo publicado contra lo que propone el prestador:' : 'Datos enviados que se aplicarán al publicar:'}</p>
        <table className="mt-3 w-full border-collapse text-left text-sm">
          <thead className="text-label text-brand-blue/70">
            <tr className="border-b border-brand-sand">
              <th scope="col" className="w-36 py-2 pr-4 font-medium">Campo</th>
              {item.solicitud === 'cambios' && <th scope="col" className="py-2 pr-4 font-medium">Publicado</th>}
              <th scope="col" className="py-2 font-medium">Propuesto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-sand align-top">
            {item.cambios.map((change) => (
              <tr key={change.campo}>
                <th scope="row" className="py-2.5 pr-4 font-medium text-brand-blue">{FIELD_LABELS[change.campo] ?? change.campo}</th>
                {item.solicitud === 'cambios' && <td className="whitespace-pre-line py-2.5 pr-4 text-brand-blue/60 line-through decoration-brand-blue/30">{change.actual || '—'}</td>}
                <td className="whitespace-pre-line py-2.5 text-brand-blue">
                  {change.campo === 'imagen_url' && change.propuesto
                    ? <a href={change.propuesto} target="_blank" rel="noopener noreferrer" className="block max-w-xs"><img src={change.propuesto} alt={`Foto propuesta para ${item.nombre}`} className="aspect-[4/3] w-full rounded-lg bg-brand-sand object-cover" /></a>
                    : (change.propuesto || <span className="text-brand-blue/60">(vacío)</span>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <p className="pt-1 text-sm leading-6 text-brand-blue/75">
      {item.tipo === 'lugar'
        ? 'Lugar del catálogo pendiente de publicar. Usa “Editar” para revisar todos sus datos.'
        : 'Servicio nuevo enviado por el prestador. Usa “Editar” para revisar o completar sus datos antes de publicarlo.'}
      {item.motivoRevision && <> Último motivo: {item.motivoRevision}</>}
    </p>
  );
};

const Detail = ({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) => (
  <div className={wide ? 'sm:col-span-2' : ''}>
    <dt className="text-label text-brand-blue/70">{label}</dt>
    <dd className="mt-0.5 whitespace-pre-line text-sm text-brand-blue">{children}</dd>
  </div>
);

export type { ModerationKind };
