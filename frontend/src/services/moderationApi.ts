import { authorizedJson } from './authorizedFetch';

export type ModerationKind = 'servicio' | 'lugar' | 'promocion';

export interface ModerationChange {
  campo: string;
  actual: string | null;
  propuesto: string | null;
}

export interface ModerationItem {
  tipo: ModerationKind;
  /** nuevo: aún no publicado. cambios: servicio publicado con cambios propuestos por el prestador. */
  solicitud: 'nuevo' | 'cambios';
  id: number;
  nombre: string;
  slug: string | null;
  estado: string;
  prestador: string | null;
  municipio: string | null;
  categoria: string | null;
  enviadoAt: string;
  motivoRevision: string | null;
  faltantes: string[];
  cambios: ModerationChange[];
  detalle?: { descripcion: string | null; condiciones: string | null; fechaInicio: string; fechaFin: string };
}

export type EditableContent = Record<string, string | null> & { id: number; slug: string | null; estado_aprobacion: string };

export interface ReportData {
  generadoEn: string;
  actividad: Record<string, number>;
  prestadores: Array<Record<string, string | number | null>>;
  lugares: Array<Record<string, string | number | boolean | null>>;
  servicios: Array<Record<string, string | number | boolean | null>>;
  municipios: Array<Record<string, string | number>>;
}

export const moderationApi = {
  queue: (token: string) => authorizedJson<{ data: ModerationItem[] }>('/api/admin/moderacion', token),
  approve: (token: string, kind: ModerationKind, id: number) =>
    authorizedJson<{ data: { id: number; slug?: string | null } }>(`/api/admin/moderacion/${kind}/${id}/aprobar`, token, { method: 'POST' }),
  reject: (token: string, kind: ModerationKind, id: number, motivo: string) =>
    authorizedJson<{ data: { id: number } }>(`/api/admin/moderacion/${kind}/${id}/rechazar`, token, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
  content: (token: string, kind: 'servicio' | 'lugar', id: number) =>
    authorizedJson<{ data: EditableContent }>(`/api/admin/contenido/${kind}/${id}`, token),
  update: (token: string, kind: 'servicio' | 'lugar', id: number, changes: Record<string, string | null>) =>
    authorizedJson<{ data: { id: number } }>(`/api/admin/contenido/${kind}/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  remove: (token: string, kind: ModerationKind, id: number) =>
    authorizedJson<{ data: { id: number } }>(`/api/admin/contenido/${kind}/${id}`, token, { method: 'DELETE' }),
  report: (token: string) => authorizedJson<{ data: ReportData }>('/api/admin/reportes', token),
};

/** Nombre legible de cada campo (igual que en el servidor). */
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
  direccion: 'Dirección',
  info_acceso: 'Cómo llegar',
  actividades: 'Actividades',
  servicios_disponibles: 'Servicios disponibles',
  accesibilidad: 'Accesibilidad',
  recomendaciones: 'Recomendaciones',
  fuente_verificacion: 'Fuente de verificación',
};

export const EDITABLE_FIELDS: Record<'servicio' | 'lugar', string[]> = {
  servicio: ['nombre', 'tipo_servicio', 'descripcion', 'horario', 'rango_precio', 'contacto', 'reservacion', 'ubicacion', 'fuente_verificacion'],
  lugar: ['nombre', 'descripcion', 'horarios', 'costo', 'direccion', 'info_acceso', 'actividades', 'servicios_disponibles', 'accesibilidad', 'recomendaciones', 'contacto', 'fuente_verificacion'],
};

/** Campos de texto largo (textarea). */
export const LONG_FIELDS = new Set(['descripcion', 'info_acceso', 'actividades', 'servicios_disponibles', 'accesibilidad', 'recomendaciones', 'reservacion', 'rango_precio', 'fuente_verificacion']);
