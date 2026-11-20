import { authorizedJson } from './authorizedFetch';

export type ApprovalState = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'suspendido';

export interface ProviderProfile {
  id: number;
  nombre_comercial: string;
  descripcion: string | null;
  telefono: string | null;
  correo: string | null;
  estado_aprobacion: ApprovalState;
}

export interface ProviderService {
  id: number;
  prestador_id: number;
  nombre: string;
  slug: string | null;
  descripcion: string | null;
  horario: string | null;
  rango_precio: string | null;
  contacto: string | null;
  reservacion: string | null;
  tipo_servicio: string | null;
  estado_aprobacion: ApprovalState;
  motivo_revision: string | null;
  /** Cambios enviados a revisión que todavía no se publican. */
  cambios_propuestos: ServiceChanges | null;
  cambios_enviados_at: string | null;
  municipio: string;
  categoria: string | null;
  updated_at: string;
}

export interface ProviderPromotion {
  id: number;
  servicio_id: number | null;
  servicio_nombre: string | null;
  titulo: string;
  descripcion: string | null;
  condiciones: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  estado_aprobacion: ApprovalState;
  motivo_revision: string | null;
}

export interface MyBusiness {
  prestadores: ProviderProfile[];
  servicios: ProviderService[];
  promociones: ProviderPromotion[];
}

export interface ServiceChanges {
  descripcion?: string | null;
  horario?: string | null;
  rango_precio?: string | null;
  contacto?: string | null;
  reservacion?: string | null;
  /** Enlace https a una foto; se publica sólo cuando el administrador aprueba. */
  imagen_url?: string | null;
}

export interface NewService extends ServiceChanges {
  nombre: string;
  municipio_id: number;
  categoria_id: number;
  tipo_servicio?: string;
}

/** Respuesta de un envío: todo queda pendiente de revisión. */
export interface PendingResponse<T> {
  data: T & { pendiente: true };
  message: string;
}

export interface NewPromotion {
  servicio_id: number;
  titulo: string;
  descripcion: string;
  condiciones: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const providerApi = {
  myBusiness: (token: string) => authorizedJson<{ data: MyBusiness }>('/api/prestador/mi-negocio', token),
  createService: (token: string, service: NewService) =>
    authorizedJson<PendingResponse<{ id: number; nombre: string; estado_aprobacion: ApprovalState }>>('/api/prestador/servicios', token, {
      method: 'POST',
      body: JSON.stringify(service),
    }),
  updateService: (token: string, id: number, changes: ServiceChanges) =>
    authorizedJson<PendingResponse<Partial<ProviderService>>>(`/api/prestador/servicios/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),
  withdrawChanges: (token: string, id: number) =>
    authorizedJson<{ data: { id: number } }>(`/api/prestador/servicios/${id}/cambios`, token, { method: 'DELETE' }),
  createPromotion: (token: string, promotion: NewPromotion) =>
    authorizedJson<{ data: { id: number } }>('/api/prestador/promociones', token, {
      method: 'POST',
      body: JSON.stringify(promotion),
    }),
  deletePromotion: (token: string, id: number) =>
    authorizedJson<{ data: { id: number } }>(`/api/prestador/promociones/${id}`, token, { method: 'DELETE' }),
};
