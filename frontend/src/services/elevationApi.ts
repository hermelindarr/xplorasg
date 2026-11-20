// Altitud del terreno de cada lugar (m.s.n.m.).
// Prioridad: el dato de la ficha (`altitud`) → caché local → API (/api/viaje/altitudes, modelo de Open-Meteo).
// La altitud no cambia, así que se guarda en el dispositivo y el perfil funciona sin señal en visitas posteriores.
import { useEffect, useState } from 'react';
import { API_URL } from '../config/apiUrl';
import type { Place } from '../types/catalog';

const STORAGE_KEY = 'xplora:altitudes:v1';
const MAX_POINTS = 60;

type Cache = Record<string, number>;

const keyOf = (lat: number, lon: number) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

const readCache = (): Cache => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Cache;
  } catch {
    return {};
  }
};

const writeCache = (cache: Cache) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Sin almacenamiento (modo privado): se vuelve a pedir en la próxima visita.
  }
};

const coordsOf = (place: Place): [number, number] | null => {
  const lat = Number(place.latitud);
  const lon = Number(place.longitud);
  return place.latitud && place.longitud && Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};

const resolveFromCache = (places: Place[], cache: Cache): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const place of places) {
    if (typeof place.altitud === 'number') {
      result[place.slug] = place.altitud;
      continue;
    }
    const coords = coordsOf(place);
    const cached = coords ? cache[keyOf(...coords)] : undefined;
    if (typeof cached === 'number') result[place.slug] = cached;
  }
  return result;
};

/** Altitud por `slug`. Los lugares sin coordenadas (o si falla la consulta) simplemente no aparecen. */
export const usePlaceElevations = (places: Place[]): Record<string, number> => {
  const [elevations, setElevations] = useState<Record<string, number>>(() => resolveFromCache(places, readCache()));

  useEffect(() => {
    const cache = readCache();
    const known = resolveFromCache(places, cache);
    // eslint-disable-next-line react/set-state-in-effect -- sincroniza con la lista que llegó de la API
    setElevations(known);

    const missing = places
      .filter((place) => known[place.slug] === undefined)
      .map(coordsOf)
      .filter((coords): coords is [number, number] => coords !== null)
      .slice(0, MAX_POINTS);
    if (!missing.length) return undefined;

    const controller = new AbortController();
    const query = encodeURIComponent(missing.map(([lat, lon]) => keyOf(lat, lon)).join('|'));
    fetch(`${API_URL}/api/viaje/altitudes?puntos=${query}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { data?: Array<number | null> } | null) => {
        if (!body?.data) return;
        missing.forEach(([lat, lon], index) => {
          const value = body.data?.[index];
          if (typeof value === 'number') cache[keyOf(lat, lon)] = value;
        });
        writeCache(cache);
        setElevations(resolveFromCache(places, cache));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [places]);

  return elevations;
};
