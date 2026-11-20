import { Request, Response } from 'express';
import {
  getElevations,
  getRoute,
  getWeather,
  MAX_ELEVATION_POINTS,
  parseCoordinate,
  parsePoint,
  parsePointList,
  parseRouteProfile,
  TravelServiceError,
} from '../services/travelService';
import { getLang } from '../services/i18n';

const respondWithError = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof TravelServiceError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error(fallback, error);
  res.status(500).json({ error: fallback });
};

export const currentWeather = async (req: Request, res: Response): Promise<void> => {
  const latitud = parseCoordinate(req.query.latitud, -90, 90);
  const longitud = parseCoordinate(req.query.longitud, -180, 180);
  if (latitud === null || longitud === null) {
    res.status(400).json({ error: 'Las coordenadas del clima son inválidas.' });
    return;
  }

  try {
    res.status(200).json({ data: await getWeather({ latitud, longitud }, getLang(req)) });
  } catch (error) {
    respondWithError(res, error, 'No fue posible consultar el clima.');
  }
};

export const calculateRoute = async (req: Request, res: Response): Promise<void> => {
  const origin = parsePoint(req.body?.origen);
  const destination = parsePoint(req.body?.destino);
  const profile = parseRouteProfile(req.body?.perfil ?? 'driving-car');
  if (!origin || !destination || !profile) {
    res.status(400).json({ error: 'El origen, destino o perfil de ruta es inválido.' });
    return;
  }

  try {
    res.status(200).json({ data: await getRoute(origin, destination, profile, getLang(req)) });
  } catch (error) {
    respondWithError(res, error, 'No fue posible calcular la ruta.');
  }
};


/** GET /api/viaje/altitudes?puntos=lat,lon|lat,lon → { data: [metros | null, ...] } en el mismo orden. */
export const elevations = async (req: Request, res: Response): Promise<void> => {
  const points = parsePointList(req.query.puntos);
  if (!points) {
    res.status(400).json({ error: `Envía entre 1 y ${MAX_ELEVATION_POINTS} coordenadas válidas como "lat,lon|lat,lon".` });
    return;
  }
  try {
    // La altitud no cambia: el navegador puede guardarla un día.
    res.set('Cache-Control', 'public, max-age=86400');
    res.status(200).json({ data: await getElevations(points) });
  } catch (error) {
    respondWithError(res, error, 'No fue posible consultar la altitud.');
  }
};
