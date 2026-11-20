import { Request, Response } from 'express';
import type { PoolClient } from 'pg';
import pool from '../config/db';
import { placeReviewQuery, serviceReviewQuery } from './contentReviewController';
import { approvalRequirements, type ReviewReadiness } from '../services/contentReviewService';
import {
  ADMIN_PLACE_FIELDS,
  ADMIN_SERVICE_FIELDS,
  isAcceptableImageUrl,
  pickAdminFields,
  splitProposal,
  type ServiceProposal,
} from '../services/moderationService';

// Moderación del administrador (todas las rutas exigen rol 'administrador' en adminRoutes).
//
//   GET    /api/admin/moderacion                         bandeja de solicitudes pendientes
//   GET    /api/admin/contenido/:tipo/:id                ficha completa para editar
//   PATCH  /api/admin/contenido/:tipo/:id                editar directamente (se aplica de inmediato)
//   POST   /api/admin/moderacion/:tipo/:id/aprobar       aprobar y publicar (aplica la propuesta si existe)
//   POST   /api/admin/moderacion/:tipo/:id/rechazar      rechazar con motivo (descarta la propuesta si existe)
//   DELETE /api/admin/contenido/:tipo/:id                eliminar (borrado lógico, deja de verse en todos lados)
//   GET    /api/admin/reportes                           datos para exportar a Excel, CSV y Word

type Kind = 'lugar' | 'servicio' | 'promocion';

const parseKind = (value: unknown): Kind | null =>
  value === 'lugar' || value === 'servicio' || value === 'promocion' ? value : null;

const parseId = (value: unknown): number | null => {
  const id = Number.parseInt(String(value), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const reasonOf = (body: unknown): string => {
  const value = (body as { motivo?: unknown } | undefined)?.motivo;
  return typeof value === 'string' ? value.trim().slice(0, 1000) : '';
};

const TABLES: Record<Kind, string> = { lugar: 'lugares_turisticos', servicio: 'servicios', promocion: 'promociones' };

// ---------------------------------------------------------------- Bandeja

export const listModerationQueue = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [services, places, promotions] = await Promise.all([
      pool.query(
        `SELECT s.id, s.nombre, s.slug, s.estado_aprobacion, s.motivo_revision,
                s.descripcion, s.horario, s.rango_precio, s.contacto, s.reservacion, s.tipo_servicio,
                s.cambios_propuestos, COALESCE(s.cambios_enviados_at, s.updated_at) AS enviado_at,
                p.nombre_comercial AS prestador, mu.nombre AS municipio, ca.nombre AS categoria
         FROM public.servicios AS s
         JOIN public.prestadores AS p ON p.id = s.prestador_id
         LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
         LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
         WHERE s.deleted_at IS NULL
           AND (s.estado_aprobacion = 'en_revision' OR s.cambios_propuestos IS NOT NULL)
         ORDER BY enviado_at ASC
         LIMIT 200`,
      ),
      pool.query(
        `SELECT l.id, l.nombre, l.slug, l.estado_aprobacion, l.motivo_revision, l.updated_at AS enviado_at,
                mu.nombre AS municipio, ca.nombre AS categoria
         FROM public.lugares_turisticos AS l
         JOIN public.municipios AS mu ON mu.id = l.municipio_id
         JOIN public.categorias AS ca ON ca.id = l.categoria_id
         WHERE l.deleted_at IS NULL AND l.estado_aprobacion = 'en_revision'
         ORDER BY l.updated_at ASC
         LIMIT 200`,
      ),
      pool.query(
        `SELECT pr.id, pr.titulo AS nombre, pr.descripcion, pr.condiciones, pr.fecha_inicio, pr.fecha_fin,
                pr.estado_aprobacion, pr.motivo_revision, pr.created_at AS enviado_at,
                s.nombre AS servicio, p.nombre_comercial AS prestador
         FROM public.promociones AS pr
         LEFT JOIN public.servicios AS s ON s.id = pr.servicio_id
         LEFT JOIN public.prestadores AS p ON p.id = pr.prestador_id
         WHERE pr.deleted_at IS NULL AND pr.estado_aprobacion = 'en_revision'
         ORDER BY pr.created_at ASC
         LIMIT 200`,
      ),
    ]);

    // Requisitos de publicación (descripción, fuente, multimedia…) de lugares y servicios en la bandeja.
    const readiness = async (kind: 'lugar' | 'servicio', ids: number[]) => {
      if (!ids.length) return new Map<number, string[]>();
      const query = (kind === 'lugar' ? placeReviewQuery : serviceReviewQuery).replace('LIMIT $3 OFFSET $4', '');
      const rows = await pool.query<ReviewReadiness & { id: number }>(
        `SELECT * FROM (${query}) AS content WHERE id = ANY($3::int[])`,
        [null, null, ids],
      );
      return new Map(rows.rows.map((row) => [row.id, approvalRequirements(kind, row)]));
    };
    const [serviceMissing, placeMissing] = await Promise.all([
      readiness('servicio', services.rows.map((row) => row.id)),
      readiness('lugar', places.rows.map((row) => row.id)),
    ]);

    const items = [
      ...services.rows.map((row) => {
        const isChange = row.estado_aprobacion === 'aprobado' && row.cambios_propuestos;
        const proposal = (row.cambios_propuestos ?? null) as ServiceProposal | null;
        // Una foto nueva cuenta como multimedia pública: no bloquea la aprobación.
        const missing = (serviceMissing.get(row.id) ?? []).filter((item) => !(proposal?.imagen_url && item.startsWith('multimedia')));
        return {
          tipo: 'servicio' as const,
          solicitud: isChange ? 'cambios' : 'nuevo',
          id: row.id,
          nombre: row.nombre,
          slug: row.slug,
          estado: row.estado_aprobacion,
          prestador: row.prestador,
          municipio: row.municipio,
          categoria: row.categoria ?? row.tipo_servicio,
          enviadoAt: row.enviado_at,
          motivoRevision: row.motivo_revision,
          faltantes: isChange ? [] : missing,
          // Para comparar: lo publicado contra lo propuesto (sólo los campos que cambian).
          cambios: proposal
            ? Object.entries(proposal).map(([campo, propuesto]) => ({
                campo,
                actual: campo === 'imagen_url' ? null : (row[campo] ?? null),
                propuesto,
              }))
            : [],
        };
      }),
      ...places.rows.map((row) => ({
        tipo: 'lugar' as const,
        solicitud: 'nuevo',
        id: row.id,
        nombre: row.nombre,
        slug: row.slug,
        estado: row.estado_aprobacion,
        prestador: null,
        municipio: row.municipio,
        categoria: row.categoria,
        enviadoAt: row.enviado_at,
        motivoRevision: row.motivo_revision,
        faltantes: placeMissing.get(row.id) ?? [],
        cambios: [],
      })),
      ...promotions.rows.map((row) => ({
        tipo: 'promocion' as const,
        solicitud: 'nuevo',
        id: row.id,
        nombre: row.nombre,
        slug: null,
        estado: row.estado_aprobacion,
        prestador: row.prestador,
        municipio: null,
        categoria: row.servicio,
        enviadoAt: row.enviado_at,
        motivoRevision: row.motivo_revision,
        faltantes: [],
        cambios: [],
        detalle: { descripcion: row.descripcion, condiciones: row.condiciones, fechaInicio: row.fecha_inicio, fechaFin: row.fecha_fin },
      })),
    ].sort((a, b) => new Date(a.enviadoAt).getTime() - new Date(b.enviadoAt).getTime());

    res.json({ data: items });
  } catch (error) {
    console.error('Error consultando la bandeja de moderación:', error);
    res.status(500).json({ error: 'No fue posible cargar las solicitudes pendientes.' });
  }
};

// ---------------------------------------------------------------- Ficha y edición directa

export const getContentForEdit = async (req: Request, res: Response): Promise<void> => {
  const kind = parseKind(req.params.tipo);
  const id = parseId(req.params.id);
  if (!kind || kind === 'promocion' || !id) {
    res.status(400).json({ error: 'Contenido inválido.' });
    return;
  }
  const fields = kind === 'servicio' ? ADMIN_SERVICE_FIELDS : ADMIN_PLACE_FIELDS;
  try {
    const result = await pool.query(
      `SELECT id, slug, estado_aprobacion, ${fields.join(', ')}${kind === 'servicio' ? ', cambios_propuestos' : ''}
       FROM public.${TABLES[kind]}
       WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Contenido no encontrado.' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error cargando contenido para editar:', error);
    res.status(500).json({ error: 'No fue posible cargar la ficha.' });
  }
};

/** Inserta una foto pública y la deja como principal del servicio. */
const attachServiceImage = async (client: PoolClient, serviceId: number, url: string, alt: string, userId?: string) => {
  const media = await client.query<{ id: number }>(
    `INSERT INTO public.multimedia (tipo, url, alt_text, titulo, subido_por)
     VALUES ('image', $1, $2, $2, $3)
     RETURNING id`,
    [url, alt.slice(0, 255), userId ?? null],
  );
  await client.query('UPDATE public.servicio_multimedia SET es_principal = FALSE WHERE servicio_id = $1', [serviceId]);
  await client.query(
    `INSERT INTO public.servicio_multimedia (servicio_id, multimedia_id, orden, es_principal)
     VALUES ($1, $2, 0, TRUE)
     ON CONFLICT (servicio_id, multimedia_id) DO UPDATE SET es_principal = TRUE`,
    [serviceId, media.rows[0].id],
  );
};

export const updateContentAsAdmin = async (req: Request, res: Response): Promise<void> => {
  const kind = parseKind(req.params.tipo);
  const id = parseId(req.params.id);
  if (!kind || kind === 'promocion' || !id) {
    res.status(400).json({ error: 'Contenido inválido.' });
    return;
  }
  const { values, errors } = pickAdminFields(req.body, kind === 'servicio' ? ADMIN_SERVICE_FIELDS : ADMIN_PLACE_FIELDS);
  const imageUrl = kind === 'servicio' && typeof req.body?.imagen_url === 'string' ? req.body.imagen_url.trim() : '';
  if (imageUrl && !isAcceptableImageUrl(imageUrl)) errors.imagen_url = 'El enlace de la foto debe ser https y terminar en .jpg, .png o .webp.';
  if (Object.keys(errors).length) {
    res.status(400).json({ error: 'Revisa los campos marcados.', campos: errors });
    return;
  }
  const entries = Object.entries(values);
  if (!entries.length && !imageUrl) {
    res.status(400).json({ error: 'No hay cambios para guardar.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let row;
    if (entries.length) {
      const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
      const result = await client.query(
        `UPDATE public.${TABLES[kind]}
         SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${entries.length + 1} AND deleted_at IS NULL
         RETURNING id, nombre, estado_aprobacion`,
        [...entries.map(([, value]) => value), id],
      );
      row = result.rows[0];
    } else {
      const result = await client.query(
        `SELECT id, nombre, estado_aprobacion FROM public.${TABLES[kind]} WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      row = result.rows[0];
    }
    if (!row) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Contenido no encontrado.' });
      return;
    }
    if (imageUrl) await attachServiceImage(client, id, imageUrl, row.nombre, req.user?.id);
    await client.query('COMMIT');
    res.json({ data: row });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error editando contenido como administrador:', error);
    res.status(500).json({ error: 'No fue posible guardar los cambios.' });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------- Aprobar y rechazar

export const approveModeration = async (req: Request, res: Response): Promise<void> => {
  const kind = parseKind(req.params.tipo);
  const id = parseId(req.params.id);
  if (!kind || !id) {
    res.status(400).json({ error: 'Solicitud inválida.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (kind === 'promocion') {
      const result = await client.query(
        `UPDATE public.promociones
         SET estado_aprobacion = 'aprobado', motivo_revision = NULL, revisado_por = $1,
             revisado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING id, estado_aprobacion`,
        [req.user?.id ?? null, id],
      );
      if (!result.rows[0]) throw Object.assign(new Error('not-found'), { status: 404 });
      await client.query('COMMIT');
      res.json({ data: result.rows[0] });
      return;
    }

    if (kind === 'servicio') {
      const current = await client.query(
        `SELECT id, nombre, cambios_propuestos FROM public.servicios WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [id],
      );
      const service = current.rows[0];
      if (!service) throw Object.assign(new Error('not-found'), { status: 404 });

      // 1) Aplica la propuesta del prestador (si la hay) a la versión pública.
      const { columns, imageUrl } = splitProposal(service.cambios_propuestos);
      const entries = Object.entries(columns);
      if (entries.length) {
        const sets = entries.map(([column], index) => `${column} = $${index + 1}`);
        await client.query(
          `UPDATE public.servicios SET ${sets.join(', ')} WHERE id = $${entries.length + 1}`,
          [...entries.map(([, value]) => value), id],
        );
      }
      if (imageUrl) await attachServiceImage(client, id, imageUrl, service.nombre, req.user?.id);
      await client.query(
        'UPDATE public.servicios SET cambios_propuestos = NULL, cambios_enviados_at = NULL WHERE id = $1',
        [id],
      );
    }

    // 2) Verifica los requisitos de publicación con los datos ya actualizados.
    const query = (kind === 'lugar' ? placeReviewQuery : serviceReviewQuery).replace('LIMIT $3 OFFSET $4', '');
    const check = await client.query<ReviewReadiness & { id: number }>(
      `SELECT * FROM (${query}) AS content WHERE id = $3 LIMIT 1`,
      [null, null, id],
    );
    if (!check.rows[0]) throw Object.assign(new Error('not-found'), { status: 404 });
    const missing = approvalRequirements(kind, check.rows[0]);
    if (missing.length) {
      await client.query('ROLLBACK');
      res.status(409).json({
        error: 'Todavía no se puede publicar. Edita la ficha y completa lo que falta.',
        faltantes: missing,
      });
      return;
    }

    // 3) Publica.
    const updated = await client.query(
      `UPDATE public.${TABLES[kind]}
       SET estado_aprobacion = 'aprobado', motivo_revision = NULL, revisado_por = $1,
           revisado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, slug, estado_aprobacion`,
      [req.user?.id ?? null, id],
    );
    if (kind === 'servicio') {
      await client.query(
        `UPDATE public.prestadores AS p
         SET estado_aprobacion = 'aprobado', updated_at = CURRENT_TIMESTAMP
         FROM public.servicios AS s
         WHERE s.id = $1 AND p.id = s.prestador_id AND p.estado_aprobacion <> 'aprobado'`,
        [id],
      );
    }
    await client.query('COMMIT');
    res.json({ data: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as { status?: number }).status === 404) {
      res.status(404).json({ error: 'La solicitud ya no existe o fue eliminada.' });
      return;
    }
    console.error('Error aprobando contenido:', error);
    res.status(500).json({ error: 'No fue posible aprobar la solicitud.' });
  } finally {
    client.release();
  }
};

export const rejectModeration = async (req: Request, res: Response): Promise<void> => {
  const kind = parseKind(req.params.tipo);
  const id = parseId(req.params.id);
  const reason = reasonOf(req.body);
  if (!kind || !id) {
    res.status(400).json({ error: 'Solicitud inválida.' });
    return;
  }
  if (reason.length < 5) {
    res.status(400).json({ error: 'Escribe el motivo del rechazo para que el prestador sepa qué corregir.' });
    return;
  }
  try {
    // Servicio publicado con cambios propuestos: se descarta la propuesta y la ficha pública sigue igual.
    if (kind === 'servicio') {
      const change = await pool.query(
        `UPDATE public.servicios
         SET cambios_propuestos = NULL, cambios_enviados_at = NULL, motivo_revision = $1,
             revisado_por = $2, revisado_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND deleted_at IS NULL AND estado_aprobacion = 'aprobado' AND cambios_propuestos IS NOT NULL
         RETURNING id, estado_aprobacion`,
        [reason, req.user?.id ?? null, id],
      );
      if (change.rows[0]) {
        res.json({ data: { ...change.rows[0], descartado: 'cambios' } });
        return;
      }
    }
    const result = await pool.query(
      `UPDATE public.${TABLES[kind]}
       SET estado_aprobacion = 'rechazado', motivo_revision = $1, revisado_por = $2,
           revisado_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           ${kind === 'servicio' ? ', cambios_propuestos = NULL, cambios_enviados_at = NULL' : ''}
       WHERE id = $3 AND deleted_at IS NULL
       RETURNING id, estado_aprobacion`,
      [reason, req.user?.id ?? null, id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'La solicitud ya no existe o fue eliminada.' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error rechazando contenido:', error);
    res.status(500).json({ error: 'No fue posible rechazar la solicitud.' });
  }
};

// ---------------------------------------------------------------- Eliminar

export const deleteContentAsAdmin = async (req: Request, res: Response): Promise<void> => {
  const kind = parseKind(req.params.tipo);
  const id = parseId(req.params.id);
  if (!kind || !id) {
    res.status(400).json({ error: 'Contenido inválido.' });
    return;
  }
  try {
    // Borrado lógico: desaparece de la vista pública, de la bandeja y del prestador, pero queda en la base
    // por si hay que recuperarlo.
    const result = await pool.query(
      `UPDATE public.${TABLES[kind]}
       SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id],
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Contenido no encontrado o ya eliminado.' });
      return;
    }
    res.json({ data: { id, eliminado: true } });
  } catch (error) {
    console.error('Error eliminando contenido:', error);
    res.status(500).json({ error: 'No fue posible eliminar el contenido.' });
  }
};

// ---------------------------------------------------------------- Reportes

export const getReportData = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [providers, places, services, municipalities, activity] = await Promise.all([
      pool.query(
        `SELECT p.nombre_comercial AS prestador, p.estado_aprobacion AS estado, p.telefono, p.correo,
                COALESCE(u.email, '') AS cuenta,
                COUNT(s.id) FILTER (WHERE s.deleted_at IS NULL)::INT AS servicios,
                COUNT(s.id) FILTER (WHERE s.deleted_at IS NULL AND s.estado_aprobacion = 'aprobado')::INT AS publicados,
                COUNT(s.id) FILTER (WHERE s.deleted_at IS NULL AND (s.estado_aprobacion = 'en_revision' OR s.cambios_propuestos IS NOT NULL))::INT AS pendientes,
                STRING_AGG(DISTINCT mu.nombre, ', ') AS municipios,
                p.created_at AS registrado
         FROM public.prestadores AS p
         LEFT JOIN public.usuarios AS u ON u.id = p.usuario_id
         LEFT JOIN public.servicios AS s ON s.prestador_id = p.id
         LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
         WHERE p.deleted_at IS NULL
         GROUP BY p.id, u.email
         ORDER BY p.nombre_comercial`,
      ),
      pool.query(
        `SELECT l.nombre, mu.nombre AS municipio, ca.nombre AS categoria, l.estado_aprobacion AS estado,
                l.altitud, (l.latitud IS NOT NULL AND l.longitud IS NOT NULL) AS con_coordenadas,
                (SELECT COUNT(*)::INT FROM public.favoritos f WHERE f.lugar_id = l.id) AS favoritos,
                l.updated_at AS actualizado
         FROM public.lugares_turisticos AS l
         JOIN public.municipios AS mu ON mu.id = l.municipio_id
         JOIN public.categorias AS ca ON ca.id = l.categoria_id
         WHERE l.deleted_at IS NULL
         ORDER BY mu.nombre, l.nombre`,
      ),
      pool.query(
        `SELECT s.nombre, p.nombre_comercial AS prestador, mu.nombre AS municipio,
                COALESCE(ca.nombre, s.tipo_servicio) AS tipo, s.estado_aprobacion AS estado,
                (s.cambios_propuestos IS NOT NULL) AS cambios_pendientes, s.contacto, s.updated_at AS actualizado
         FROM public.servicios AS s
         JOIN public.prestadores AS p ON p.id = s.prestador_id
         LEFT JOIN public.municipios AS mu ON mu.id = s.municipio_id
         LEFT JOIN public.categorias AS ca ON ca.id = s.categoria_id
         WHERE s.deleted_at IS NULL
         ORDER BY mu.nombre NULLS LAST, s.nombre`,
      ),
      pool.query(
        `SELECT mu.nombre AS municipio,
                (SELECT COUNT(*)::INT FROM public.lugares_turisticos l WHERE l.municipio_id = mu.id AND l.deleted_at IS NULL) AS lugares,
                (SELECT COUNT(*)::INT FROM public.lugares_turisticos l WHERE l.municipio_id = mu.id AND l.deleted_at IS NULL AND l.estado_aprobacion = 'aprobado') AS lugares_publicados,
                (SELECT COUNT(*)::INT FROM public.servicios s WHERE s.municipio_id = mu.id AND s.deleted_at IS NULL) AS servicios,
                (SELECT COUNT(*)::INT FROM public.servicios s WHERE s.municipio_id = mu.id AND s.deleted_at IS NULL AND s.estado_aprobacion = 'aprobado') AS servicios_publicados
         FROM public.municipios AS mu
         ORDER BY mu.nombre`,
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::INT FROM public.usuarios WHERE deleted_at IS NULL) AS usuarios,
           (SELECT COUNT(*)::INT FROM public.favoritos) AS favoritos,
           (SELECT COUNT(*)::INT FROM public.promociones WHERE deleted_at IS NULL AND estado_aprobacion = 'aprobado' AND fecha_fin >= NOW()) AS promociones_activas,
           (SELECT COUNT(*)::INT FROM public.eventos WHERE deleted_at IS NULL AND estado_aprobacion = 'aprobado' AND fecha_fin >= NOW()) AS eventos_proximos,
           (SELECT COUNT(*)::INT FROM public.servicios WHERE deleted_at IS NULL AND (estado_aprobacion = 'en_revision' OR cambios_propuestos IS NOT NULL)) AS solicitudes_pendientes`,
      ),
    ]);

    res.json({
      data: {
        generadoEn: new Date().toISOString(),
        actividad: activity.rows[0],
        prestadores: providers.rows,
        lugares: places.rows,
        servicios: services.rows,
        municipios: municipalities.rows,
      },
    });
  } catch (error) {
    console.error('Error generando el reporte:', error);
    res.status(500).json({ error: 'No fue posible generar el reporte.' });
  }
};
