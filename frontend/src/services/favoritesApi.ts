import { supabase } from '../supabaseClient';
import type { Place } from '../types/catalog';

// Usa el mismo token que AuthContext (login de desarrollo o sesión de Supabase).
// Antes sólo leía la sesión de Supabase: con esa configuración los favoritos
// se "marcaban" en pantalla pero nunca se enviaban al servidor.
const readStoredToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const stored = readStoredToken();
  if (stored) return { Authorization: `Bearer ${stored}` };
  if (!supabase) return {};
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

import { API_URL } from '../config/apiUrl';

const getApiUrl = () => API_URL;

export const getFavorites = async (): Promise<Place[]> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  
  const response = await fetch(`${getApiUrl()}/api/favoritos`, { headers });
  if (!response.ok) throw new Error('Error al obtener favoritos');
  return response.json();
};

export const addFavorite = async (lugarId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) throw new Error('Sesión no disponible para guardar favoritos');

  const response = await fetch(`${getApiUrl()}/api/favoritos/${lugarId}`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw new Error('Error al agregar favorito');
};

export const removeFavorite = async (lugarId: number): Promise<void> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) throw new Error('Sesión no disponible para quitar favoritos');

  const response = await fetch(`${getApiUrl()}/api/favoritos/${lugarId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('Error al eliminar favorito');
};

export const syncFavorites = async (lugarIds: number[]): Promise<Place[]> => {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  
  const response = await fetch(`${getApiUrl()}/api/favoritos/sync`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ lugarIds }),
  });
  if (!response.ok) throw new Error('Error al sincronizar favoritos');
  return response.json();
};
