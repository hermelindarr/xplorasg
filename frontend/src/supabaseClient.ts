import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublicKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

/**
 * Supabase sólo se usa si las variables están presentes; sin ellas la app funciona en modo DEV
 * (login simulado contra /api/auth).
 */
export const supabaseEnabled = Boolean(supabaseUrl && supabasePublicKey);

// La librería de Supabase pesa ~54 KB comprimida y sólo hace falta para iniciar sesión o mantener una sesión.
// Se descarga bajo demanda, una sola vez; la mayoría de los turistas nunca la necesita.
let clientPromise: Promise<SupabaseClient> | null = null;

export const getSupabase = (): Promise<SupabaseClient | null> => {
  if (!supabaseEnabled) return Promise.resolve(null);
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(supabaseUrl, supabasePublicKey));
  return clientPromise;
};

/**
 * ¿Puede haber una sesión que restaurar? Sí si Supabase guardó una en este dispositivo, o si la persona
 * llega desde un enlace de confirmación o de recuperación de contraseña. Si no, no se carga la librería.
 */
export const mightHaveSession = (): boolean => {
  try {
    if (Object.keys(localStorage).some((key) => key.startsWith('sb-') && key.endsWith('-auth-token'))) return true;
  } catch {
    // Sin almacenamiento local no hay sesión guardada.
  }
  if (typeof window === 'undefined') return false;
  const { hash, search, pathname } = window.location;
  return /access_token|refresh_token|type=recovery|error_description/.test(hash)
    || /[?&](code|token_hash)=/.test(search)
    || pathname.startsWith('/auth/')
    || pathname.startsWith('/restablecer-contrasena');
};
