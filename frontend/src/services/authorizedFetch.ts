import { API_URL } from '../config/apiUrl';

/** Error de la API con el detalle por campo que devuelve el backend en validaciones (`campos`). */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  readonly missing: string[];

  constructor(message: string, status: number, fields: Record<string, string> = {}, missing: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.missing = missing;
  }
}

/** Mensaje legible de cualquier error (ApiError, Error o desconocido). */
export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

// fetch con el token de la sesión; lanza ApiError con el mensaje (y los campos) del backend si falla.
export const authorizedJson = async <T>(path: string, token: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa tu señal e inténtalo de nuevo.', 0);
  }
  const body = (await response.json().catch(() => null)) as ({ error?: string; campos?: Record<string, string>; faltantes?: string[] } & T) | null;
  if (!response.ok) {
    throw new ApiError(body?.error || 'No fue posible completar la solicitud.', response.status, body?.campos ?? {}, body?.faltantes ?? []);
  }
  return body as T;
};
