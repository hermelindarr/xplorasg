import { NextFunction, Request, Response } from 'express';

/**
 * Clave del cliente para los límites: el usuario con sesión o la IP real.
 * Nunca se lee `x-forwarded-for` a mano: Express solo la usa para `req.ip`
 * cuando `TRUST_PROXY` está configurado (Render, Railway, Nginx…), así que una
 * cabecera inventada no cambia la clave.
 */
export const clientKey = (req: Request): string => req.user?.id || req.ip || req.socket.remoteAddress || 'anon';

type Entry = { count: number; start: number };

/** Contador por ventana de tiempo que solo descarta entradas vencidas (nunca reinicia a todos). */
export const createLimiter = ({ windowMs, max, maxKeys = 20_000 }: { windowMs: number; max: number; maxKeys?: number }) => {
  const hits = new Map<string, Entry>();
  const prune = (now: number) => {
    for (const [key, entry] of hits) if (now - entry.start > windowMs) hits.delete(key);
    // Si aún hay demasiadas claves activas, se descartan las más antiguas (orden de inserción).
    while (hits.size > maxKeys) {
      const oldest = hits.keys().next().value;
      if (oldest === undefined) break;
      hits.delete(oldest);
    }
  };
  /** Devuelve 0 si se permite; si no, los segundos que faltan para reintentar. */
  return (key: string): number => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      if (entry) hits.delete(key);
      hits.set(key, { count: 1, start: now });
      if (hits.size > maxKeys) prune(now);
      return 0;
    }
    entry.count += 1;
    return entry.count > max ? Math.max(1, Math.ceil((entry.start + windowMs - now) / 1000)) : 0;
  };
};

// Limitador de solicitudes en memoria por usuario/IP (suficiente para una instancia).
export const rateLimit = ({ windowMs, max, message }: { windowMs: number; max: number; message: string }) => {
  const check = createLimiter({ windowMs, max });
  return (req: Request, res: Response, next: NextFunction): void => {
    const retryAfter = check(clientKey(req));
    if (retryAfter) {
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: message, retryAfter });
      return;
    }
    next();
  };
};
