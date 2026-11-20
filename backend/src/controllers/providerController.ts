import { Request, Response } from 'express';
import pool from '../config/db';
import {
  mergeProposal,
  slugify,
  validateProviderService,
  type ServiceProposal,
} from '../services/moderationService';

// Panel "Mi negocio": un prestador ve y edita SOLO sus propios servicios y promociones.
// La pertenencia siempre se valida en SQL con prestadores.usuario_id = usuario autenticado.
//
// Regla de negocio: nada de lo que envía un prestador se publica solo.
// - Servicio nuevo o aún no publicado → estado 'en_revision' (no aparece en la vista pública).
// - Servicio ya publicado → los cambios quedan como propuesta (servicios.cambios_propuestos);
//   el público sigue viendo la versión aprobada hasta que el administrador la apruebe.

const cleanText = (value: unknown, max = 2000): string | null | undefined => {
  if (value === undefined) return undefined; // no se envió: no se modifica
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const text = value.trim().slice(0, max);
  return text || null;
};

const parseDate = (value: unknown): Date | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00-06:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const PENDING_MESSAGE = 'Tu solicitud quedó en espera de validación. El equipo de XploraSG la revisará antes de publicarla.';

export const getMyBusiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const providers = await pool.query(
      `SELECT p.id, p.nombre_comercial, p.descripcion, p.telefono, p.correo, p.estado_aprobacion
       FROM public.prestadores AS p
       WHERE p.usuario_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.nombre_comercial`,
      [req.user!.id],
    );
    const ids = providers.rows.map((row) => row.id);

    const [services, promotions] = ids.length
      ? await Promise.all([
          pool.query(
            `SELECT s.id, s.prestador_id, s.nombre, s.slug, s.descripcion, s.horario, s.rango_precio,
                    s.contacto, s.reservacion, s.tipo_servicio, s.estado_aprobacion, s.motivo_revision,
                    s.cambios_propuestos, s.cambios_enviados_at, s.updated_at,
                    COALESCE(mu.nombre, '') AS municipio, ca.nombre AS categoria
             FROM public.servicios AS s
             LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
             LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
             WHERE s.prestador_id = ANY($1::int[]) AND s.deleted_at IS NULL
             ORDER BY s.nombre`,
            [ids],
          ),
          pool.query(
            `SELECT pr.id, pr.prestador_id, pr.servicio_id, pr.titulo, pr.descripcion, pr.condiciones,
                    pr.fecha_inicio, pr.fecha_fin, pr.estado_aprobacion, pr.motivo_revision,
                    s.nombre AS servicio_nombre
             FROM public.promociones AS pr
             LEFT JOIN public.servicios AS s ON s.id = pr.servicio_id
             WHERE pr.prestador_id = ANY($1::int[]) AND pr.deleted_at IS NULL
             ORDER BY pr.fecha_fin DESC`,
            [ids],
          ),
        ])
      : [{ rows: [] }, { rows: [] }];

    res.json({ data: { prestadores: providers.rows, servicios: services.rows, promociones: promotions.rows } });
  } catch (error) {
    console.error('Error consultando el negocio del prestador:', error);
    res.status(500).json({ error: 'No fue posible cargar la información de tu negocio.' });
  }
};

/** POST /api/prestador/servicios: registra un servicio nuevo. Queda 'en_revision', nunca publicado. */
export const createMyService = async (req: Request, res: Response): Promise<void> => {
  const { values, errors } = validateProviderService(req.body, { isNew: true });
  if (Object.keys(errors).length) {
    res.status(400).json({ error: 'Revisa los campos marcados.', campos: errors });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const provider = await client.query<{ id: number }>(
      `SELECT id FROM public.prestadores
       WHERE usuario_id = $1 AND deleted_at IS NULL
         AND ($2::INT IS NULL OR id = $2)
       ORDER BY id LIMIT 1`,
      [req.user!.id, Number.parseInt(String(req.body?.prestador_id ?? ''), 10) || null],
    );
    if (!provider.rows[0]) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Tu cuenta todavía no está vinculada a un negocio.' });
      return;
    }

    // Slug único: nombre + sufijo corto si ya existe.
    const base = slugify(values.nombre!);
    const taken = await client.query<{ slug: string }>(
      `SELECT slug FROM public.servicios WHERE slug = $1 OR slug LIKE $1 || '-%'`,
      [base],
    );
    const used = new Set(taken.rows.map((row) => row.slug));
    let slug = base;
    for (let n = 2; used.has(slug); n += 1) slug = `${base}-${n}`;

    // La foto se guarda como propuesta: se convierte en multimedia sólo cuando el administrador aprueba.
    const proposal: ServiceProposal | null = values.imagen_url ? { imagen_url: values.imagen_url } : null;

    const created = await client.query(
      `INSERT INTO public.servicios
         (prestador_id, municipio_id, categoria_id, nombre, slug, tipo_servicio, descripcion, horario,
          rango_precio, contacto, reservacion, estado_aprobacion, cambios_propuestos, cambios_enviados_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'en_revision', $12, CURRENT_TIMESTAMP)
       RETURNING id, nombre, slug, estado_aprobacion, cambios_enviados_at`,
      [
        provider.rows[0].id, values.municipio_id, values.categoria_id, values.nombre, slug,
        values.tipo_servicio ?? null, values.descripcion ?? null, values.horario ?? null,
        values.rango_precio ?? null, values.contacto ?? null, values.reservacion ?? null,
        proposal ? JSON.stringify(proposal) : null,
      ],
    );
    await client.query('COMMIT');
    res.status(201).json({ data: { ...created.rows[0], pendiente: true }, message: PENDING_MESSAGE });
  } catch (error) {
    await client.query('ROLLBACK');
    const code = (error as { code?: string }).code;
    if (code === '23503') {
      res.status(400).json({ error: 'El municipio o el tipo de servicio no existe.' });
      return;
    }
    console.error('Error creando servicio del prestador:', error);
    res.status(500).json({ error: 'No fue posible registrar tu servicio.' });
  } finally {
    client.release();
  }
};

/**
 * PATCH /api/prestador/servicios/:id
 * - Publicado: los cambios se guardan como propuesta; la ficha pública no cambia.
 * - No publicado (borrador, en revisión o rechazado): se actualiza y vuelve a 'en_revision'.
 * - Suspendido: no se puede editar.
 */
export const updateMyService = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Servicio inválido.' });
    return;
  }

  const { values, errors } = validateProviderService(req.body, { isNew: false });
  if (Object.keys(errors).length) {
    res.status(400).json({ error: 'Revisa los campos marcados.', campos: errors });
    return;
  }
  if (!Object.keys(values).length) {
    res.status(400).json({ error: 'No hay cambios para guardar.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query(
      `SELECT s.id, s.estado_aprobacion, s.descripcion, s.horario, s.rango_precio, s.contacto,
              s.reservacion, s.cambios_propuestos
       FROM public.servicios AS s
       JOIN public.prestadores AS p ON p.id = s.prestador_id
       WHERE s.id = $1 AND p.usuario_id = $2 AND s.deleted_at IS NULL
       FOR UPDATE OF s`,
      [id, req.user!.id],
    );
    const service = current.rows[0];
    if (!service) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'No encontramos ese servicio en tu negocio.' });
      return;
    }
    if (service.estado_aprobacion === 'suspendido') {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'Este servicio está suspendido. Escribe al equipo de XploraSG para reactivarlo.' });
      return;
    }

    let result;
    if (service.estado_aprobacion === 'aprobado') {
      const proposal = mergeProposal(service.cambios_propuestos, values, service);
      if (!proposal) {
        await client.query('ROLLBACK');
        res.status(400).json({ error: 'No hay cambios respecto a lo que ya está publicado.' });
        return;
      }
      result = await client.query(
        `UPDATE public.servicios
         SET cambios_propuestos = $1, cambios_enviados_at = CURRENT_TIMESTAMP, motivo_revision = NULL
         WHERE id = $2
         RETURNING id, estado_aprobacion, cambios_propuestos, cambios_enviados_at`,
        [JSON.stringify(proposal), id],
      );
    } else {
      // Aún no es público: se corrige directamente y vuelve a la bandeja de revisión.
      const { imagen_url: imageUrl, ...columns } = values;
      const entries = Object.entries(columns);
      const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
      const params: unknown[] = entries.map(([, value]) => value);
      const imageProposal = imageUrl !== undefined
        ? mergeProposal(service.cambios_propuestos, { imagen_url: imageUrl }, {})
        : service.cambios_propuestos;
      params.push(imageProposal ? JSON.stringify(imageProposal) : null, id);
      result = await client.query(
        `UPDATE public.servicios
         SET ${sets.length ? `${sets.join(', ')}, ` : ''}
             cambios_propuestos = $${params.length - 1},
             estado_aprobacion = 'en_revision', motivo_revision = NULL,
             cambios_enviados_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${params.length}
         RETURNING id, estado_aprobacion, descripcion, horario, rango_precio, contacto, reservacion,
                   cambios_propuestos, cambios_enviados_at, updated_at`,
        params,
      );
    }
    await client.query('COMMIT');
    res.json({ data: { ...result.rows[0], pendiente: true }, message: PENDING_MESSAGE });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error actualizando servicio del prestador:', error);
    res.status(500).json({ error: 'No fue posible guardar los cambios.' });
  } finally {
    client.release();
  }
};

/** DELETE /api/prestador/servicios/:id/cambios: el prestador retira su propuesta pendiente. */
export const withdrawMyServiceChanges = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Servicio inválido.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE public.servicios AS s
       SET cambios_propuestos = NULL, cambios_enviados_at = NULL
       FROM public.prestadores AS p
       WHERE s.id = $1 AND p.id = s.prestador_id AND p.usuario_id = $2
         AND s.deleted_at IS NULL AND s.estado_aprobacion = 'aprobado' AND s.cambios_propuestos IS NOT NULL
       RETURNING s.id`,
      [id, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No hay cambios pendientes que retirar en ese servicio.' });
      return;
    }
    res.json({ data: { id } });
  } catch (error) {
    console.error('Error retirando cambios del prestador:', error);
    res.status(500).json({ error: 'No fue posible retirar los cambios.' });
  }
};

export const createMyPromotion = async (req: Request, res: Response): Promise<void> => {
  const serviceId = Number.parseInt(String(req.body?.servicio_id), 10);
  const title = cleanText(req.body?.titulo, 255);
  const description = cleanText(req.body?.descripcion, 2000) ?? null;
  const conditions = cleanText(req.body?.condiciones, 2000) ?? null;
  const start = parseDate(req.body?.fecha_inicio);
  const end = parseDate(req.body?.fecha_fin);

  if (!Number.isFinite(serviceId) || !title || title.length < 3 || !start || !end) {
    res.status(400).json({ error: 'Completa el servicio, el título y las fechas de la promoción.' });
    return;
  }
  const endOfDay = new Date(end.getTime() + (24 * 60 * 60 * 1000) - 60_000);
  if (endOfDay < start) {
    res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio.' });
    return;
  }
  if (endOfDay < new Date()) {
    res.status(400).json({ error: 'La promoción ya terminó; elige una fecha de fin futura.' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.promociones
         (prestador_id, servicio_id, titulo, descripcion, condiciones, fecha_inicio, fecha_fin, estado_aprobacion)
       SELECT p.id, s.id, $1, $2, $3, $4, $5, 'en_revision'
       FROM public.servicios AS s
       JOIN public.prestadores AS p ON p.id = s.prestador_id
       WHERE s.id = $6 AND p.usuario_id = $7 AND s.deleted_at IS NULL
       RETURNING id, titulo, estado_aprobacion`,
      [title, description, conditions, start, endOfDay, serviceId, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No encontramos ese servicio en tu negocio.' });
      return;
    }
    res.status(201).json({ data: result.rows[0], message: PENDING_MESSAGE });
  } catch (error) {
    console.error('Error creando promoción:', error);
    res.status(500).json({ error: 'No fue posible registrar la promoción.' });
  }
};

export const deleteMyPromotion = async (req: Request, res: Response): Promise<void> => {
  const id = Number.parseInt(String(req.params.id), 10);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Promoción inválida.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE public.promociones AS pr
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       FROM public.prestadores AS p
       WHERE pr.id = $1 AND p.id = pr.prestador_id AND p.usuario_id = $2 AND pr.deleted_at IS NULL
       RETURNING pr.id`,
      [id, req.user!.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'No encontramos esa promoción en tu negocio.' });
      return;
    }
    res.json({ data: { id } });
  } catch (error) {
    console.error('Error eliminando promoción:', error);
    res.status(500).json({ error: 'No fue posible eliminar la promoción.' });
  }
};
