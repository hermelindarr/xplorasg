import { usePageTitle } from '../hooks/usePageTitle';
import { useCallback, useEffect, useState } from 'react';
import { ContentEditor } from '../components/admin/ContentEditor';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { moderationApi } from '../services/moderationApi';
import { errorMessage } from '../services/authorizedFetch';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  adminReviewApi,
  type ReviewItem,
  type ReviewKind,
  type ReviewState,
} from '../services/adminReviewApi';
import { categoryVisual } from '../components/brand/icons';
import { AlertIcon, CheckCircleIcon, EditIcon, ExternalIcon, InboxIcon, TrashIcon } from '../components/admin/AdminIcons';
import { BackLink, EmptyState, Notice, PageHeader, StatusPill } from '../components/admin/AdminUi';
import {
  filterChipClass,
  quietAccent,
  quietButton,
  quietDanger,
  quietGhost,
  tabClass,
} from '../components/admin/classes';
import { statusOf } from '../components/admin/status';

const stateLabels: Record<ReviewState, string> = {
  borrador: 'Borrador',
  en_revision: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

const updatedFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' });

export const AdminContentPage = () => {
  usePageTitle('Todo el contenido');
  const { token } = useAuth();
  const [kind, setKind] = useState<ReviewKind>('lugar');
  const [state, setState] = useState<ReviewState | ''>('');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [rejecting, setRejecting] = useState<ReviewItem | null>(null);
  const [deleting, setDeleting] = useState<ReviewItem | null>(null);
  const [unpublishing, setUnpublishing] = useState<ReviewItem | null>(null);
  const [editing, setEditing] = useState<{ kind: ReviewKind; id: number; nombre: string } | null>(null);
  const [dialogBusy, setDialogBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await adminReviewApi.list(token, kind, state);
      setItems(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la bandeja editorial.');
    } finally {
      setLoading(false);
    }
  }, [kind, state, token]);

  // La bandeja depende de filtros remotos; el efecto inicia deliberadamente la carga.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const updateState = async (item: ReviewItem, nextState: ReviewState, reason?: string) => {
    if (!token) return;
    setSavingId(item.id);
    setError('');
    setNotice('');
    try {
      await adminReviewApi.update(token, item, nextState, reason);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible actualizar el contenido.');
    } finally {
      setSavingId(null);
    }
  };

  const ready = items.filter((item) => !item.faltantes.length).length;

  const confirmReject = async (reason: string) => {
    if (!rejecting) return;
    setDialogBusy(true);
    setDialogError('');
    try {
      if (!token) return;
      await adminReviewApi.update(token, rejecting, 'rechazado', reason);
      setRejecting(null);
      setNotice(`“${rejecting.nombre}” se rechazó.`);
      await load();
    } catch (requestError) {
      setDialogError(errorMessage(requestError, 'No fue posible rechazar.'));
    } finally {
      setDialogBusy(false);
    }
  };

  // Despublicar: vuelve a revisión y deja de verse en la vista pública (los datos se conservan).
  const confirmUnpublish = async () => {
    if (!unpublishing || !token) return;
    setDialogBusy(true);
    setDialogError('');
    try {
      await adminReviewApi.update(token, unpublishing, 'en_revision');
      setUnpublishing(null);
      setNotice(`“${unpublishing.nombre}” ya no está publicado. Quedó en revisión.`);
      await load();
    } catch (requestError) {
      setDialogError(errorMessage(requestError, 'No fue posible despublicar.'));
    } finally {
      setDialogBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || !token) return;
    setDialogBusy(true);
    setDialogError('');
    try {
      await moderationApi.remove(token, deleting.tipo, deleting.id);
      setDeleting(null);
      setNotice(`“${deleting.nombre}” se eliminó.`);
      await load();
    } catch (requestError) {
      setDialogError(errorMessage(requestError, 'No fue posible eliminar.'));
    } finally {
      setDialogBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        before={<BackLink to="/admin">Panel de administración</BackLink>}
        title="Todo el contenido"
        meta={<p className="max-w-3xl">Lugares y servicios en cualquier estado. El sistema bloquea la publicación cuando faltan coordenadas, fuente o multimedia pública autorizada. Las solicitudes nuevas de prestadores están en <Link to="/admin/moderacion" className="underline underline-offset-2">Solicitudes pendientes</Link>.</p>}
      />

      {/* Barra de herramientas: tipo como pestañas subrayadas, estado como filtros */}
      <div className="mt-10 border-b border-brand-sand">
        <div className="flex gap-8" role="group" aria-label="Tipo de contenido">
          {(['lugar', 'servicio'] as ReviewKind[]).map((value) => (
            <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={tabClass(kind === value)}>
              {value === 'lugar' ? 'Lugares' : 'Servicios'}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:px-0" role="group" aria-label="Estado">
          {([['', 'Todos'], ...Object.entries(stateLabels)] as Array<[ReviewState | '', string]>).map(([value, label]) => {
            const selected = state === value;
            const tone = value ? statusOf(value).tone : null;
            return (
              <button key={value || 'todos'} type="button" aria-pressed={selected} onClick={() => setState(value)} className={filterChipClass(selected)}>
                {tone && <span className={`size-1.5 rounded-full ${selected ? 'bg-white' : dotClass[tone]}`} aria-hidden="true" />}
                {label}
              </button>
            );
          })}
        </div>
        {!loading && !error && (
          <p className="shrink-0 text-xs text-brand-blue/70" aria-live="polite">
            {items.length} {kind === 'lugar' ? (items.length === 1 ? 'lugar' : 'lugares') : (items.length === 1 ? 'servicio' : 'servicios')}
            {items.length > 0 && <> · {ready} listos para publicar</>}
          </p>
        )}
      </div>

      {notice && <Notice tone="ok" className="mt-6">{notice}</Notice>}
      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {loading ? (
        <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-brand-sand bg-brand-sand">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse bg-white" />)}</div>
      ) : (
        <ul className="mt-6 divide-y divide-brand-sand overflow-hidden rounded-xl border border-brand-sand bg-white">
          {items.map((item) => {
            const visual = categoryVisual(item.categoria);
            const saving = savingId === item.id;
            const publicPath = item.slug ? `/${item.tipo === 'lugar' ? 'lugares' : 'servicios'}/${item.slug}` : null;
            return (
              <li key={`${item.tipo}-${item.id}`} className={`flex min-w-0 flex-col transition-opacity lg:flex-row lg:items-start ${saving ? 'opacity-60' : ''}`}>
                <div className="flex min-w-0 flex-1 items-start gap-3.5 px-5 pt-5 sm:px-6 lg:pb-5">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full bg-brand-light ${visual.tone}`}><visual.Icon className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                      <h2 className="min-w-0 font-sans text-base font-medium leading-6 tracking-normal text-brand-blue [text-wrap:pretty]">{item.nombre}</h2>
                      <StatusPill {...statusOf(item.estado, stateLabels)} />
                    </div>
                    <p className="mt-0.5 text-xs leading-5 text-brand-blue/70">
                      {item.municipio || 'Sin municipio'}, {item.categoria || 'sin categoría'}
                      {item.updatedAt && <>. Editado el {updatedFormatter.format(new Date(item.updatedAt))}</>}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-2 sm:px-6 lg:hidden" aria-hidden="true" />
                <div className="px-5 sm:px-6 lg:w-80 lg:shrink-0 lg:px-0 lg:py-5">
                  {/* Requisitos de publicación: sólo importan mientras no está publicado. */}
                  {item.estado !== 'aprobado' && (item.faltantes.length ? (
                    <p className="flex items-start gap-1.5 text-label leading-5 text-ochre-900">
                      <AlertIcon className="mt-0.5 size-3.5 shrink-0 text-ochre-600" />
                      <span>Falta para publicar: {item.faltantes.join(', ')}</span>
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-label font-medium text-brand-green">
                      <CheckCircleIcon className="size-3.5" /> Listo para publicar
                    </p>
                  ))}

                  {/* El motivo sólo tiene sentido si el contenido está rechazado o suspendido. */}
                  {item.motivoRevision && (item.estado === 'rechazado' || item.estado === 'suspendido') && (
                    <p className="mt-2 text-label leading-5 text-brand-blue/75"><span className="font-medium text-brand-blue">Motivo:</span> {item.motivoRevision}</p>
                  )}

                </div>

                <div className="flex flex-wrap items-center gap-2 px-5 py-4 sm:px-6 lg:w-[26rem] lg:shrink-0 lg:justify-end lg:py-5">
                  {/* Acciones según el estado: publicado → despublicar; no publicado → aprobar o rechazar. */}
                  {item.estado === 'aprobado' ? (
                    <button type="button" disabled={saving} onClick={() => { setDialogError(''); setUnpublishing(item); }} className={quietButton}>
                      Despublicar
                    </button>
                  ) : (
                    <>
                      <button type="button" disabled={saving || item.faltantes.length > 0} onClick={() => void updateState(item, 'aprobado')} className={quietAccent}>
                        <CheckCircleIcon className="size-4" /> Aprobar y publicar
                      </button>
                      {item.estado !== 'rechazado' && (
                        <button type="button" disabled={saving} onClick={() => { setDialogError(''); setRejecting(item); }} className={quietDanger}>
                          Rechazar
                        </button>
                      )}
                    </>
                  )}
                  <button type="button" disabled={saving} onClick={() => setEditing({ kind: item.tipo, id: item.id, nombre: item.nombre })} className={quietGhost} aria-label={`Editar ${item.nombre}`}>
                    <EditIcon className="size-4" /> Editar
                  </button>
                  <button type="button" disabled={saving} onClick={() => { setDialogError(''); setDeleting(item); }} className={`${quietGhost} text-clay-800`} aria-label={`Eliminar ${item.nombre}`}>
                    <TrashIcon className="size-4" /> Eliminar
                  </button>
                  {publicPath && item.estado === 'aprobado' && (
                    <Link to={publicPath} className="inline-flex min-h-9 items-center gap-1 text-label text-brand-blue/75 underline-offset-2 hover:text-brand-blue hover:underline pointer-coarse:min-h-11">
                      Ver ficha <ExternalIcon className="size-3.5" />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
          {!items.length && (
            <li className="p-2">
              <EmptyState icon={InboxIcon} title="No hay contenido con estos filtros" text="Prueba con otro estado o cambia entre lugares y servicios." />
            </li>
          )}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(rejecting)}
        title="¿Rechazar este contenido?"
        confirmLabel="Rechazar"
        reasonLabel="Motivo del rechazo (quedará registrado)"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={(reason) => void confirmReject(reason)}
        onCancel={() => setRejecting(null)}
      >
        <p>“{rejecting?.nombre}” dejará de estar publicado si lo estaba.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(unpublishing)}
        title="¿Despublicar este contenido?"
        confirmLabel="Despublicar"
        tone="primary"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={() => void confirmUnpublish()}
        onCancel={() => setUnpublishing(null)}
      >
        <p>“{unpublishing?.nombre}” dejará de verse en la vista pública y quedará en revisión. No se borra nada: puedes volver a publicarlo cuando quieras.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar definitivamente de la plataforma?"
        confirmLabel="Eliminar"
        busy={dialogBusy}
        error={dialogError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      >
        <p>“{deleting?.nombre}” desaparecerá de la vista pública y de los paneles. Si estaba publicado, deja de verse de inmediato.</p>
      </ConfirmDialog>
      {token && (
        <ContentEditor
          token={token}
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); setNotice(message); void load(); }}
        />
      )}
    </section>
  );
};

const dotClass: Record<string, string> = {
  green: 'bg-brand-green', teal: 'bg-brand-teal', gold: 'bg-brand-gold', red: 'bg-clay-600', amber: 'bg-ochre-500', blue: 'bg-brand-blue/50',
};
