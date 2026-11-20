// Reglas del flujo de moderación (sin acceso a base de datos, para poder probarlas aisladas).
//
// Prestador  → envía un servicio nuevo o cambios a uno existente. Nada se publica solo.
// Administrador → aprueba y publica, edita directamente, rechaza (con motivo) o elimina.

/** Campos que un prestador puede proponer para su servicio. */
export const PROVIDER_FIELDS = ['descripcion', 'horario', 'rango_precio', 'contacto', 'reservacion', 'imagen_url'] as const;
export type ProviderField = typeof PROVIDER_FIELDS[number];
export type ServiceProposal = Partial<Record<ProviderField, string | null>>;

/** Columnas reales de public.servicios que una propuesta puede modificar (imagen_url va a multimedia). */
export const PROPOSAL_COLUMNS = ['descripcion', 'horario', 'rango_precio', 'contacto', 'reservacion'] as const;

/** Campos que el administrador puede editar directamente. */
export const ADMIN_SERVICE_FIELDS = [
  'nombre', 'descripcion', 'horario', 'rango_precio', 'contacto', 'reservacion',
  'tipo_servicio', 'ubicacion', 'fuente_verificacion',
] as const;
export const ADMIN_PLACE_FIELDS = [
  'nombre', 'descripcion', 'horarios', 'costo', 'direccion', 'info_acceso', 'actividades',
  'servicios_disponibles', 'accesibilidad', 'recomendaciones', 'contacto', 'fuente_verificacion',
] as const;

const LIMITS: Record<string, number> = {
  nombre: 120,
  descripcion: 4000,
  horario: 500,
  horarios: 500,
  rango_precio: 500,
  costo: 500,
  contacto: 500,
  reservacion: 1000,
  tipo_servicio: 200,
  ubicacion: 500,
  direccion: 500,
  info_acceso: 2000,
  actividades: 2000,
  servicios_disponibles: 2000,
  accesibilidad: 2000,
  recomendaciones: 2000,
  fuente_verificacion: 1000,
  imagen_url: 1000,
};

export interface ValidationResult<T> {
  values: T;
  errors: Record<string, string>;
}

/** Texto limpio: undefined = no se envió (no se toca); null = se vació a propósito. */
export const cleanField = (value: unknown, max: number): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/\r\n/g, '\n').trim().slice(0, max);
  return text || null;
};

const digitCount = (text: string) => (text.match(/\d/g) ?? []).length;

/** Teléfono de México utilizable (10 dígitos o más) o correo electrónico. */
export const isUsableContact = (text: string): boolean =>
  digitCount(text) >= 10 || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text);

/**
 * Enlace de foto aceptado: https, sin credenciales y con extensión de imagen
 * (o de un servicio de imágenes conocido). La foto no se descarga aquí: el
 * administrador la ve antes de aprobar.
 */
export const isAcceptableImageUrl = (text: string): boolean => {
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const knownHost = /(^|\.)((upload|thumb)\.wikimedia\.org|supabase\.co|googleusercontent\.com|imgur\.com)$/i.test(url.hostname);
  return knownHost || /\.(jpe?g|png|webp|avif)$/i.test(url.pathname);
};

/**
 * Valida los campos que manda un prestador.
 * `isNew`: al crear, nombre, municipio, categoría, descripción y contacto son obligatorios.
 */
export const validateProviderService = (
  body: Record<string, unknown> | undefined,
  { isNew }: { isNew: boolean },
): ValidationResult<ServiceProposal & { nombre?: string | null; municipio_id?: number; categoria_id?: number; tipo_servicio?: string | null }> => {
  const source = body ?? {};
  const errors: Record<string, string> = {};
  const values: ServiceProposal & { nombre?: string | null; municipio_id?: number; categoria_id?: number; tipo_servicio?: string | null } = {};

  for (const field of PROVIDER_FIELDS) {
    const value = cleanField(source[field], LIMITS[field]);
    if (value !== undefined) values[field] = value;
  }

  if (isNew) {
    const nombre = cleanField(source.nombre, LIMITS.nombre);
    if (!nombre || nombre.length < 3) errors.nombre = 'Escribe el nombre del servicio (mínimo 3 letras).';
    else values.nombre = nombre;

    const tipo = cleanField(source.tipo_servicio, LIMITS.tipo_servicio);
    if (tipo) values.tipo_servicio = tipo;

    const municipio = Number.parseInt(String(source.municipio_id ?? ''), 10);
    if (!Number.isInteger(municipio) || municipio <= 0) errors.municipio_id = 'Elige el municipio donde está tu servicio.';
    else values.municipio_id = municipio;

    const categoria = Number.parseInt(String(source.categoria_id ?? ''), 10);
    if (!Number.isInteger(categoria) || categoria <= 0) errors.categoria_id = 'Elige el tipo de servicio.';
    else values.categoria_id = categoria;

    if (!values.descripcion) errors.descripcion = 'Describe tu servicio para que los turistas sepan qué ofreces.';
    if (!values.contacto) errors.contacto = 'Agrega un teléfono, WhatsApp o correo para que te contacten.';
  }

  if (values.descripcion && values.descripcion.length < 40) {
    errors.descripcion = 'La descripción es muy corta: cuenta qué ofreces en al menos 40 caracteres.';
  }
  if (values.contacto && !isUsableContact(values.contacto)) {
    errors.contacto = 'Escribe un teléfono de 10 dígitos o un correo electrónico válido.';
  }
  if (values.imagen_url && !isAcceptableImageUrl(values.imagen_url)) {
    errors.imagen_url = 'El enlace de la foto debe empezar con https:// y terminar en .jpg, .png o .webp.';
  }

  return { values, errors };
};

/**
 * Une una propuesta nueva con la que ya estaba pendiente y descarta lo que no cambia
 * respecto a la versión publicada. Devuelve null si no queda nada por revisar.
 */
export const mergeProposal = (
  pending: ServiceProposal | null | undefined,
  incoming: ServiceProposal,
  live: Partial<Record<ProviderField, string | null>>,
): ServiceProposal | null => {
  const merged: ServiceProposal = { ...(pending ?? {}) };
  for (const field of PROVIDER_FIELDS) {
    if (!(field in incoming)) continue;
    const next = incoming[field] ?? null;
    const current = field === 'imagen_url' ? null : (live[field] ?? null);
    if (next === current) delete merged[field];
    else merged[field] = next;
  }
  return Object.keys(merged).length ? merged : null;
};

/** Divide una propuesta en columnas de la tabla servicios y la foto (que va a multimedia). */
export const splitProposal = (proposal: ServiceProposal | null | undefined) => {
  const columns: Partial<Record<typeof PROPOSAL_COLUMNS[number], string | null>> = {};
  for (const column of PROPOSAL_COLUMNS) {
    if (proposal && column in proposal) columns[column] = proposal[column] ?? null;
  }
  const imageUrl = proposal?.imagen_url ?? null;
  return { columns, imageUrl };
};

/** Toma sólo los campos permitidos de una edición del administrador. */
export const pickAdminFields = (
  body: Record<string, unknown> | undefined,
  allowed: readonly string[],
): ValidationResult<Record<string, string | null>> => {
  const values: Record<string, string | null> = {};
  const errors: Record<string, string> = {};
  for (const field of allowed) {
    const value = cleanField(body?.[field], LIMITS[field] ?? 2000);
    if (value !== undefined) values[field] = value;
  }
  if ('nombre' in values && (!values.nombre || values.nombre.length < 3)) errors.nombre = 'El nombre debe tener al menos 3 caracteres.';
  return { values, errors };
};

/** Slug legible a partir del nombre (sin acentos, minúsculas, guiones). */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'servicio';

/** Etiquetas legibles para el reporte y la bandeja. */
export const FIELD_LABELS: Record<string, string> = {
  nombre: 'Nombre',
  descripcion: 'Descripción',
  horario: 'Horario',
  horarios: 'Horarios',
  rango_precio: 'Precios',
  costo: 'Costo',
  contacto: 'Contacto',
  reservacion: 'Cómo reservar',
  imagen_url: 'Foto',
  tipo_servicio: 'Tipo de servicio',
  ubicacion: 'Ubicación',
  fuente_verificacion: 'Fuente de verificación',
};
