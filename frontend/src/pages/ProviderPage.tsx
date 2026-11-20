import { usePageTitle } from '../hooks/usePageTitle';
/* eslint-disable react/set-state-in-effect -- carga de datos al montar la vista */
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  providerApi,
  type ApprovalState,
  type MyBusiness,
  type NewPromotion,
  type NewService,
  type ProviderPromotion,
  type ProviderService,
  type ServiceChanges,
} from '../services/providerApi';
import { catalogApi } from '../services/catalogApi';
import type { Category, Municipality } from '../types/catalog';
import { ApiError, errorMessage } from '../services/authorizedFetch';
import { PinIcon } from '../components/brand/icons';
import { AlertIcon, ClockIcon, ExternalIcon, MailIcon, PhoneIcon, PlusIcon, StoreIcon, TagIcon, TrashIcon } from '../components/admin/AdminIcons';
import { EmptyState, KpiTile, Notice, PageHeader, SectionHeading, StatGrid, StatusPill } from '../components/admin/AdminUi';
import { fieldLabel, panelSurface } from '../components/admin/classes';
import { statusOf } from '../components/admin/status';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// Portal del prestador. Regla de negocio: nada de lo que envía se publica solo.
// - Servicio nuevo o no publicado → "En espera de validación" (no lo ven los turistas).
// - Servicio publicado → los cambios quedan como propuesta; los turistas siguen viendo la versión aprobada.

const stateLabel: Record<ApprovalState, string> = {
  borrador: 'Borrador',
  en_revision: 'En espera de validación',
  aprobado: 'Publicado',
  rechazado: 'Rechazado',
  suspendido: 'Suspendido',
};

const StateChip = ({ state }: { state: ApprovalState }) => <StatusPill {...statusOf(state, stateLabel)} />;

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' });
const updatedFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' });
const sentFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', timeZone: 'America/Mexico_City' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

const labelClass = `block ${fieldLabel}`;

// ---------------------------------------------------------------- Validación (espejo de la del servidor)

type FieldErrors = Partial<Record<string, string>>;

const digits = (text: string) => (text.match(/\d/g) ?? []).length;

const validateService = (values: ServiceChanges & Partial<NewService>, isNew: boolean): FieldErrors => {
  const errors: FieldErrors = {};
  const descripcion = values.descripcion?.trim() ?? '';
  const contacto = values.contacto?.trim() ?? '';
  const imagen = values.imagen_url?.trim() ?? '';
  if (isNew) {
    if ((values.nombre?.trim().length ?? 0) < 3) errors.nombre = 'Escribe el nombre del servicio (mínimo 3 letras).';
    if (!values.municipio_id) errors.municipio_id = 'Elige el municipio donde está tu servicio.';
    if (!values.categoria_id) errors.categoria_id = 'Elige el tipo de servicio.';
    if (!descripcion) errors.descripcion = 'Describe tu servicio para que los turistas sepan qué ofreces.';
    if (!contacto) errors.contacto = 'Agrega un teléfono, WhatsApp o correo para que te contacten.';
  }
  if (descripcion && descripcion.length < 40) errors.descripcion = 'La descripción es muy corta: cuenta qué ofreces en al menos 40 caracteres.';
  if (contacto && digits(contacto) < 10 && !/[^\s@]+@[^\s@]+\.[^\s@]+/.test(contacto)) errors.contacto = 'Escribe un teléfono de 10 dígitos o un correo electrónico válido.';
  if (imagen && !/^https:\/\/\S+$/i.test(imagen)) errors.imagen_url = 'El enlace de la foto debe empezar con https://';
  return errors;
};

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? <span id={id} className="mt-1 block text-label text-clay-800">{message}</span> : null;

/** Aviso de que la solicitud quedó en espera de validación (la confirmación que pide el flujo). */
const PendingNotice = ({ children }: { children: ReactNode }) => (
  <div role="status" className="flex gap-3 rounded-lg border border-ochre-200 bg-ochre-50 px-4 py-3 text-ochre-900">
    <ClockIcon className="mt-0.5 size-5 shrink-0 text-ochre-600" />
    <div className="text-sm leading-6">{children}</div>
  </div>
);

// ---------------------------------------------------------------- Página

export const ProviderPage = () => {
  usePageTitle('Mi negocio');
  const { token, user } = useAuth();
  const [business, setBusiness] = useState<MyBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState('');
  const [toDelete, setToDelete] = useState<ProviderPromotion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setError('');
    try {
      const response = await providerApi.myBusiness(token);
      setBusiness(response.data);
    } catch (requestError) {
      setError(errorMessage(requestError, 'No fue posible cargar tu negocio.'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <section className="mx-auto min-h-[100svh] max-w-6xl px-5 py-12 lg:px-8" aria-busy="true">
        <p className="sr-only">Cargando tu negocio…</p>
        <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-brand-sand/70" />
        <div className="mt-10 h-24 animate-pulse rounded-xl border border-brand-sand bg-white" />
        <div className="mt-8 h-72 animate-pulse rounded-xl border border-brand-sand bg-white" />
      </section>
    );
  }

  const prestadores = Array.isArray(business?.prestadores) ? business.prestadores : [];
  const servicios = Array.isArray(business?.servicios) ? business.servicios : [];
  const promociones = Array.isArray(business?.promociones) ? business.promociones : [];
  const hasBusiness = prestadores.length > 0;
  const profile = prestadores[0];
  const activePromos = promociones.filter((promotion) => promotion.estado_aprobacion === 'aprobado' && new Date(promotion.fecha_fin).getTime() >= now).length;
  const publishedServices = servicios.filter((service) => service.estado_aprobacion === 'aprobado').length;
  const pending = servicios.filter((service) => service.estado_aprobacion === 'en_revision' || service.cambios_propuestos).length
    + promociones.filter((promotion) => promotion.estado_aprobacion === 'en_revision').length;

  const confirmDelete = async () => {
    if (!toDelete || !token) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await providerApi.deletePromotion(token, toDelete.id);
      setToDelete(null);
      await load();
    } catch (requestError) {
      setDeleteError(errorMessage(requestError, 'No fue posible eliminarla.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 lg:px-8">
      <PageHeader
        title={hasBusiness ? prestadores.map((p) => p.nombre_comercial).join(', ') : 'Mi negocio'}
        meta={
          <>
            {hasBusiness && <div className="mb-3"><StatusPill {...statusOf(profile.estado_aprobacion, stateLabel)} /></div>}
            <p className="max-w-2xl">
              Hola, {user?.nombre?.split(' ')[0] || 'prestador'}. Aquí registras tus servicios y mantienes al día lo que ven los turistas.
              Todo lo que envíes lo revisa el equipo de XploraSG antes de publicarse.
            </p>
            {hasBusiness && (profile.telefono || profile.correo) && (
              <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-label text-brand-blue/70">
                {profile.telefono && <span className="inline-flex items-center gap-1.5"><PhoneIcon className="size-3.5 text-brand-teal" />{profile.telefono}</span>}
                {profile.correo && <span className="inline-flex min-w-0 items-center gap-1.5 break-all"><MailIcon className="size-3.5 shrink-0 text-brand-teal" />{profile.correo}</span>}
              </p>
            )}
          </>
        }
      />
      {hasBusiness && (
        <StatGrid className="mt-10 grid-cols-2 sm:grid-cols-4">
          <KpiTile size="sm" label="Servicios" value={servicios.length} />
          <KpiTile size="sm" label="Publicados" value={publishedServices} />
          <KpiTile size="sm" label="Promociones activas" value={activePromos} />
          <KpiTile size="sm" label="En espera de validación" value={pending} noteTone={pending ? 'warn' : 'muted'} note={pending ? 'El equipo los revisa' : undefined} />
        </StatGrid>
      )}

      {error && <Notice tone="error" className="mt-6">{error}</Notice>}

      {!hasBusiness && !error && (
        <div className="mt-8">
          <EmptyState
            icon={StoreIcon}
            title="Tu cuenta todavía no está vinculada a un negocio"
            text={<>Pide al equipo de XploraSG que vincule tu correo ({user?.email}) con tu negocio desde el panel de administración.</>}
          />
        </div>
      )}

      {hasBusiness && business && token && (
        <>
          <section aria-labelledby="servicios-title" className="mt-14 border-t border-brand-sand pt-12">
            <SectionHeading
              id="servicios-title"
              title="Mis servicios"
              description="Los turistas ven la versión publicada. Lo que cambies aquí se envía a revisión y se publica cuando el equipo lo valida."
              action={!creating && (
                <button type="button" onClick={() => { setCreating(true); setCreated(''); }} className="btn btn-primary">
                  <PlusIcon className="size-4" /> Registrar un servicio
                </button>
              )}
            />
          </section>

          {created && <div className="mt-6"><PendingNotice>{created}</PendingNotice></div>}

          {creating && (
            <div className="mt-8">
              <NewServiceForm
                token={token}
                onCancel={() => setCreating(false)}
                onCreated={async (message) => { setCreating(false); setCreated(message); await load(); }}
              />
            </div>
          )}

          <div className="mt-8 grid gap-5">
            {servicios.map((service) => (
              <ServiceEditor key={`${service.id}-${service.cambios_enviados_at ?? ''}-${service.updated_at}`} service={service} token={token} onSaved={load} />
            ))}
            {!servicios.length && !creating && (
              <EmptyState icon={StoreIcon} title="Aún no tienes servicios registrados" text="Registra el primero: el equipo lo revisa y lo publica." />
            )}
          </div>

          <section aria-labelledby="promociones-title" className="mt-14 border-t border-brand-sand pt-12">
            <SectionHeading id="promociones-title" title="Mis promociones" description="Cada promoción se revisa antes de aparecer en la Agenda." />
          </section>
          <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
            <PromotionForm services={servicios} token={token} onCreated={load} />
            <ul className={`${promociones.length ? `${panelSurface} divide-y divide-brand-sand overflow-hidden` : ''} grid content-start`}>
              {promociones.map((promotion) => (
                <li key={promotion.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
                    <h3 className="min-w-0 text-base font-medium leading-6 text-brand-blue">{promotion.titulo}</h3>
                    <StateChip state={promotion.estado_aprobacion} />
                  </div>
                  <p className="mt-0.5 text-xs text-brand-blue/70">
                    {promotion.servicio_nombre ?? 'General'}, del {dateFormatter.format(new Date(promotion.fecha_inicio))} al {dateFormatter.format(new Date(promotion.fecha_fin))}
                  </p>
                  {promotion.descripcion && <p className="mt-2 text-sm leading-6 text-brand-blue/75">{promotion.descripcion}</p>}
                  {promotion.estado_aprobacion === 'rechazado' && promotion.motivo_revision && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg border border-clay-200 bg-clay-50 px-3.5 py-2.5 text-sm text-clay-900"><AlertIcon className="mt-0.5 size-4 shrink-0 text-clay-600" /><span><b className="font-medium">Motivo:</b> {promotion.motivo_revision}</span></p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDeleteError(''); setToDelete(promotion); }}
                    className="btn -ml-3 mt-2 min-h-8 px-3 py-1 !text-xs text-clay-700 hover:bg-clay-50 pointer-coarse:min-h-11"
                  >
                    <TrashIcon className="size-3.5" /> Eliminar
                  </button>
                </li>
              ))}
              {!promociones.length && (
                <li><EmptyState icon={TagIcon} title="Todavía no has enviado promociones" text="Crea una con el formulario: el equipo la revisa y aparece en la Agenda." /></li>
              )}
            </ul>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="¿Eliminar esta promoción?"
        confirmLabel="Eliminar promoción"
        busy={deleting}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      >
        <p>“{toDelete?.titulo}” dejará de aparecer en tu panel y en la Agenda. Esta acción no se puede deshacer desde aquí.</p>
      </ConfirmDialog>
    </section>
  );
};

// ---------------------------------------------------------------- Campos compartidos

const editableFields: Array<{ key: keyof ServiceChanges; label: string; rows: number; hint?: string }> = [
  { key: 'descripcion', label: 'Descripción', rows: 4, hint: '¿Qué ofreces y qué lo hace especial? Mínimo 40 caracteres.' },
  { key: 'horario', label: 'Horario', rows: 2 },
  { key: 'rango_precio', label: 'Precios', rows: 3, hint: 'Con cifras: “Desde $900 por noche”. Evita “consultar precios”.' },
  { key: 'contacto', label: 'Contacto (teléfono / WhatsApp)', rows: 2, hint: 'El botón “Reservar” usa el primer teléfono de 10 dígitos que escribas.' },
  { key: 'reservacion', label: 'Cómo reservar', rows: 3 },
];

const PhotoField = ({ value, onChange, error, id }: { value: string; onChange: (value: string) => void; error?: string; id: string }) => {
  const [broken, setBroken] = useState(false);
  const url = value.trim();
  const showPreview = /^https:\/\/\S+$/i.test(url) && !broken;
  return (
    <div className="md:col-span-2">
      <label htmlFor={id} className={labelClass}>Foto (enlace)</label>
      <div className="mt-1.5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-start">
        <div>
          <input
            id={id}
            type="url"
            inputMode="url"
            value={value}
            onChange={(event) => { setBroken(false); onChange(event.target.value); }}
            placeholder="https://…/mi-foto.jpg"
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-hint ${id}-error`}
            className="field"
          />
          <span id={`${id}-hint`} className="mt-1 block text-xs leading-4 text-brand-blue/70">Una foto real de tu servicio (.jpg, .png o .webp). Se publica cuando el equipo la aprueba.</span>
          <FieldError id={`${id}-error`} message={error ?? (broken ? 'No pudimos abrir esa foto. Revisa el enlace.' : undefined)} />
        </div>
        {showPreview && (
          <img src={url} alt="Vista previa de la foto" onError={() => setBroken(true)} className="aspect-[4/3] w-full rounded-lg bg-brand-sand object-cover" />
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- Registrar servicio

const NewServiceForm = ({ token, onCancel, onCreated }: { token: string; onCancel: () => void; onCreated: (message: string) => Promise<void> }) => {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({ nombre: '', municipio_id: 0, categoria_id: 0, tipo_servicio: '', descripcion: '', horario: '', rango_precio: '', contacto: '', reservacion: '', imagen_url: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([catalogApi.municipalities(controller.signal), catalogApi.categories(controller.signal)])
      .then(([m, c]) => { setMunicipalities(m.data); setCategories(c.data); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: NewService = {
      ...form,
      imagen_url: form.imagen_url.trim() || undefined,
      tipo_servicio: form.tipo_servicio.trim() || undefined,
    };
    const found = validateService(payload, true);
    setErrors(found);
    setMessage('');
    if (Object.keys(found).length) return;
    setSending(true);
    try {
      const response = await providerApi.createService(token, payload);
      await onCreated(`Recibimos “${response.data.nombre}”. ${response.message}`);
    } catch (requestError) {
      if (requestError instanceof ApiError) setErrors(requestError.fields);
      setMessage(errorMessage(requestError, 'No fue posible enviar tu servicio.'));
    } finally {
      setSending(false);
    }
  };

  const textField = (key: 'nombre' | 'tipo_servicio', label: string, placeholder: string, required = false) => (
    <label>
      <span className={labelClass}>{label}{required && <span className="text-brand-gold" aria-hidden="true"> *</span>}</span>
      <input
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        placeholder={placeholder}
        maxLength={120}
        required={required}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={`new-${key}-error`}
        className="field mt-1.5"
      />
      <FieldError id={`new-${key}-error`} message={errors[key]} />
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className={`${panelSurface} overflow-hidden`} aria-labelledby="nuevo-servicio-title">
      <div className="border-b border-brand-sand px-5 py-4 sm:px-6">
        <h3 id="nuevo-servicio-title" className="font-display text-xl font-normal text-brand-blue">Registrar un servicio</h3>
        <p className="mt-0.5 text-xs text-brand-blue/70">Queda en espera de validación; los turistas no lo ven hasta que el equipo lo aprueba.</p>
      </div>
      <div className="grid gap-x-5 gap-y-4 px-5 py-5 sm:px-6 md:grid-cols-2">
        {textField('nombre', 'Nombre del servicio', 'Ej. Cabañas El Río', true)}
        {textField('tipo_servicio', 'Tipo (opcional)', 'Ej. Cabañas con cocina')}
        <label>
          <span className={labelClass}>Municipio<span className="text-brand-gold" aria-hidden="true"> *</span></span>
          <select value={form.municipio_id} onChange={(event) => set('municipio_id', Number(event.target.value))} aria-invalid={Boolean(errors.municipio_id)} aria-describedby="new-municipio-error" className="field mt-1.5">
            <option value={0}>Elige un municipio…</option>
            {municipalities.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
          <FieldError id="new-municipio-error" message={errors.municipio_id} />
        </label>
        <label>
          <span className={labelClass}>Categoría<span className="text-brand-gold" aria-hidden="true"> *</span></span>
          <select value={form.categoria_id} onChange={(event) => set('categoria_id', Number(event.target.value))} aria-invalid={Boolean(errors.categoria_id)} aria-describedby="new-categoria-error" className="field mt-1.5">
            <option value={0}>Elige una categoría…</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
          <FieldError id="new-categoria-error" message={errors.categoria_id} />
        </label>
        {editableFields.map(({ key, label, rows, hint }) => (
          <label key={key} className={key === 'descripcion' ? 'md:col-span-2' : ''}>
            <span className={labelClass}>{label}{(key === 'descripcion' || key === 'contacto') && <span className="text-brand-gold" aria-hidden="true"> *</span>}</span>
            <textarea
              rows={rows}
              value={form[key as keyof typeof form] as string}
              onChange={(event) => set(key as keyof typeof form, event.target.value)}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={`new-${key}-hint new-${key}-error`}
              className="field mt-1.5 resize-y"
            />
            {hint && <span id={`new-${key}-hint`} className="mt-1 block text-xs leading-4 text-brand-blue/70">{hint}</span>}
            <FieldError id={`new-${key}-error`} message={errors[key]} />
          </label>
        ))}
        <PhotoField id="new-imagen" value={form.imagen_url} onChange={(value) => set('imagen_url', value)} error={errors.imagen_url} />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-brand-sand bg-brand-paper/60 px-5 py-3.5 sm:px-6">
        <button type="submit" disabled={sending} className="btn btn-primary">{sending ? 'Enviando…' : 'Enviar a revisión'}</button>
        <button type="button" onClick={onCancel} disabled={sending} className="btn btn-ghost">Cancelar</button>
        {message && <Notice tone="error" className="py-2">{message}</Notice>}
      </div>
    </form>
  );
};

// ---------------------------------------------------------------- Editar servicio existente

const ServiceEditor = ({ service, token, onSaved }: { service: ProviderService; token: string; onSaved: () => Promise<void> }) => {
  const proposal = service.cambios_propuestos ?? {};
  const initial = (key: keyof ServiceChanges) => (key in proposal ? proposal[key] : key === 'imagen_url' ? '' : service[key as keyof ProviderService]) ?? '';
  const [draft, setDraft] = useState<ServiceChanges>(() => Object.fromEntries([...editableFields.map(({ key }) => key), 'imagen_url'].map((key) => [key, initial(key as keyof ServiceChanges)])));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const published = service.estado_aprobacion === 'aprobado';
  const hasProposal = published && Object.keys(proposal).length > 0;
  const suspended = service.estado_aprobacion === 'suspendido';
  const dirty = [...editableFields.map(({ key }) => key), 'imagen_url' as const].some((key) => (draft[key] ?? '') !== initial(key));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const changes = Object.fromEntries(Object.entries(draft).filter(([key, value]) => (value ?? '') !== initial(key as keyof ServiceChanges))) as ServiceChanges;
    const found = validateService(changes, false);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await providerApi.updateService(token, service.id, changes);
      setMessage({ tone: 'ok', text: response.message });
      await onSaved();
    } catch (requestError) {
      if (requestError instanceof ApiError) setErrors(requestError.fields);
      setMessage({ tone: 'error', text: errorMessage(requestError, 'No fue posible enviar los cambios.') });
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    setWithdrawing(true);
    setWithdrawError('');
    try {
      await providerApi.withdrawChanges(token, service.id);
      setConfirmWithdraw(false);
      await onSaved();
    } catch (requestError) {
      setWithdrawError(errorMessage(requestError, 'No fue posible retirar los cambios.'));
    } finally {
      setWithdrawing(false);
    }
  };

  const sentAt = service.cambios_enviados_at ? sentFormatter.format(new Date(service.cambios_enviados_at)) : null;

  return (
    <form onSubmit={submit} noValidate className={`${panelSurface} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-sand px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h3 className="font-display truncate text-xl font-normal text-brand-blue">{service.nombre}</h3>
          <p className="flex flex-wrap gap-x-3 text-xs text-brand-blue/70">
            {service.municipio && <span className="inline-flex items-center gap-1"><PinIcon className="size-3.5" />{service.municipio}</span>}
            {service.updated_at && <span>Actualizado el {updatedFormatter.format(new Date(service.updated_at))}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StateChip state={service.estado_aprobacion} />
          {service.slug && published && (
            <Link to={`/servicios/${service.slug}`} className="inline-flex min-h-8 items-center gap-1 text-xs text-brand-blue/70 underline-offset-2 hover:text-brand-blue hover:underline pointer-coarse:min-h-11">
              Ver como turista <ExternalIcon className="size-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-3 px-5 pt-5 sm:px-6">
        {service.estado_aprobacion === 'en_revision' && (
          <PendingNotice>
            <b className="font-medium">En espera de validación{sentAt ? ` desde el ${sentAt}` : ''}.</b> Los turistas todavía no lo ven. Puedes seguir corrigiéndolo; cada envío vuelve a la bandeja del equipo.
          </PendingNotice>
        )}
        {hasProposal && (
          <PendingNotice>
            <b className="font-medium">Tienes cambios en espera de validación{sentAt ? ` (enviados el ${sentAt})` : ''}.</b> Los turistas siguen viendo la versión publicada hasta que el equipo los apruebe.
            <button type="button" onClick={() => { setWithdrawError(''); setConfirmWithdraw(true); }} className="ml-1 font-medium underline underline-offset-2 hover:no-underline">Retirar cambios</button>
          </PendingNotice>
        )}
        {service.motivo_revision && (service.estado_aprobacion === 'rechazado' || (published && !hasProposal)) && (
          <p className="flex items-start gap-2 rounded-lg border border-clay-200 bg-clay-50 px-3.5 py-2.5 text-sm text-clay-900">
            <AlertIcon className="mt-0.5 size-4 shrink-0 text-clay-600" />
            <span><b className="font-medium">{published ? 'Tus últimos cambios no se aprobaron.' : 'No se aprobó.'}</b> Motivo: {service.motivo_revision}</span>
          </p>
        )}
        {suspended && <Notice tone="error">Este servicio está suspendido. Escribe al equipo de XploraSG para reactivarlo.</Notice>}
      </div>

      <fieldset disabled={suspended} className="grid gap-x-5 gap-y-4 px-5 py-5 sm:px-6 md:grid-cols-2">
        <legend className="sr-only">Información de {service.nombre}</legend>
        {editableFields.map(({ key, label, rows, hint }) => (
          <label key={key} className={key === 'descripcion' ? 'md:col-span-2' : ''}>
            <span className={labelClass}>{label}{hasProposal && key in proposal && <span className="ml-2 font-normal text-ochre-800">(cambio pendiente)</span>}</span>
            <textarea
              rows={rows}
              value={draft[key] ?? ''}
              onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
              aria-invalid={Boolean(errors[key])}
              aria-describedby={`${service.id}-${key}-hint ${service.id}-${key}-error`}
              className="field mt-1.5 resize-y"
            />
            {hint && <span id={`${service.id}-${key}-hint`} className="mt-1 block text-xs leading-4 text-brand-blue/70">{hint}</span>}
            <FieldError id={`${service.id}-${key}-error`} message={errors[key]} />
          </label>
        ))}
        <PhotoField id={`${service.id}-imagen`} value={draft.imagen_url ?? ''} onChange={(value) => setDraft((current) => ({ ...current, imagen_url: value }))} error={errors.imagen_url} />
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-brand-sand bg-brand-paper/60 px-5 py-3.5 sm:px-6">
        <button type="submit" disabled={!dirty || saving || suspended} className="btn btn-primary">
          {saving ? 'Enviando…' : 'Enviar a revisión'}
        </button>
        {dirty && !saving && !message && <span className="inline-flex items-center gap-1.5 text-xs text-brand-blue/70"><span className="size-1.5 rounded-full bg-brand-gold" aria-hidden="true" />Tienes cambios sin enviar.</span>}
        {message && (message.tone === 'ok' ? <PendingNotice>{message.text}</PendingNotice> : <Notice tone="error" className="py-2">{message.text}</Notice>)}
      </div>

      <ConfirmDialog
        open={confirmWithdraw}
        title="¿Retirar los cambios pendientes?"
        confirmLabel="Retirar cambios"
        busy={withdrawing}
        error={withdrawError}
        onConfirm={() => void withdraw()}
        onCancel={() => setConfirmWithdraw(false)}
      >
        <p>Se descartan los cambios que enviaste para “{service.nombre}”. La versión publicada no cambia.</p>
      </ConfirmDialog>
    </form>
  );
};

// ---------------------------------------------------------------- Promoción

const PromotionForm = ({ services, token, onCreated }: { services: ProviderService[]; token: string; onCreated: () => Promise<void> }) => {
  const empty = (): NewPromotion => ({
    servicio_id: services[0]?.id ?? 0,
    titulo: '',
    descripcion: '',
    condiciones: '',
    fecha_inicio: today(),
    fecha_fin: '',
  });
  const [form, setForm] = useState<NewPromotion>(empty);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  if (!services.length) return null;

  const update = <K extends keyof NewPromotion>(key: K, value: NewPromotion[K]) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      setMessage({ tone: 'error', text: 'La fecha de fin no puede ser anterior a la de inicio.' });
      return;
    }
    setSending(true);
    setMessage(null);
    try {
      await providerApi.createPromotion(token, form);
      setForm(empty());
      setMessage({ tone: 'ok', text: 'Tu promoción quedó en espera de validación. Aparecerá en la Agenda cuando el equipo la apruebe.' });
      await onCreated();
    } catch (requestError) {
      setMessage({ tone: 'error', text: errorMessage(requestError, 'No fue posible enviarla.') });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${panelSurface} h-fit lg:sticky lg:top-24`}>
      <div className="border-b border-brand-sand px-5 py-4 sm:px-6">
        <h3 className="font-display text-xl font-normal text-brand-blue">Nueva promoción</h3>
        <p className="mt-0.5 text-xs text-brand-blue/70">Se publica después de la revisión.</p>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:px-6">
        <label>
          <span className={labelClass}>Servicio</span>
          <select value={form.servicio_id} onChange={(event) => update('servicio_id', Number(event.target.value))} className="field mt-1.5">
            {services.map((service) => <option key={service.id} value={service.id}>{service.nombre}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>Título</span>
          <input required minLength={3} maxLength={255} value={form.titulo} onChange={(event) => update('titulo', event.target.value)} placeholder="Ej. 2x1 en cabañas entre semana" className="field mt-1.5" />
        </label>
        <label>
          <span className={labelClass}>Descripción</span>
          <textarea rows={3} value={form.descripcion} onChange={(event) => update('descripcion', event.target.value)} className="field mt-1.5 resize-y" />
        </label>
        <label>
          <span className={labelClass}>Condiciones</span>
          <input value={form.condiciones} onChange={(event) => update('condiciones', event.target.value)} placeholder="Ej. Válido de lunes a jueves" className="field mt-1.5" />
        </label>
        <div className="grid gap-3 min-[380px]:grid-cols-2">
          <label>
            <span className={labelClass}>Desde</span>
            <input required type="date" min={today()} value={form.fecha_inicio} onChange={(event) => update('fecha_inicio', event.target.value)} className="field mt-1.5 min-w-0" />
          </label>
          <label>
            <span className={labelClass}>Hasta</span>
            <input required type="date" min={form.fecha_inicio || today()} value={form.fecha_fin} onChange={(event) => update('fecha_fin', event.target.value)} className="field mt-1.5" />
          </label>
        </div>
      </div>
      <div className="grid gap-3 border-t border-brand-sand bg-brand-paper/60 px-5 py-4 sm:px-6">
        <button type="submit" disabled={sending} className="btn btn-primary w-full">
          {sending ? 'Enviando…' : 'Enviar a revisión'}
        </button>
        {message && (message.tone === 'ok' ? <PendingNotice>{message.text}</PendingNotice> : <Notice tone="error">{message.text}</Notice>)}
      </div>
    </form>
  );
};
