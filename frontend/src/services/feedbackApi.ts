import { API_URL } from '../config/apiUrl';

export type UsageEvent = 'vista_lugar' | 'vista_servicio' | 'clic_whatsapp' | 'busqueda' | 'consulta_asistente' | 'ruta' | 'compartir';

/** Analítica anónima: nunca bloquea ni muestra errores al usuario. */
export const trackEvent = (tipo: UsageEvent, data: { referenciaId?: number; termino?: string } = {}): void => {
  try {
    void fetch(`${API_URL}/api/analitica`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tipo, ...data }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // sin conexión o navegador sin fetch: se ignora
  }
};

export interface SurveyAnswers {
  perfil: string;
  satisfaccion: number;
  facilidad: number;
  utilidad: number;
  recomendaria: boolean;
  minutos_otros_medios: number | null;
  minutos_xplorasg: number | null;
  modulo_favorito: string | null;
  comentario: string;
  /** Identificador aleatorio del navegador (el servidor solo guarda su resumen). */
  dispositivo?: string;
  /** La persona confirmó que no es quien respondió antes en este dispositivo. */
  otra_persona?: boolean;
}

export const submitSurvey = async (answers: SurveyAnswers, token?: string | null): Promise<void> => {
  const response = await fetch(`${API_URL}/api/encuesta`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(answers),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || 'No fue posible enviar la encuesta.');
  }
};
