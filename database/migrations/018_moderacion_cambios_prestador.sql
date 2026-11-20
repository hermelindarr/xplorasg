-- 018_moderacion_cambios_prestador.sql
-- Flujo de moderación: lo que envía un prestador nunca se publica solo.
--
-- * Servicio nuevo (o aún no publicado): se guarda con estado_aprobacion = 'en_revision'
--   y no aparece en la vista pública hasta que un administrador lo apruebe.
-- * Servicio ya publicado: los cambios del prestador se guardan como PROPUESTA en
--   cambios_propuestos (JSON). La versión pública no cambia hasta que el administrador
--   aprueba la propuesta; si la rechaza, la propuesta se descarta y queda el motivo.
--
-- Sólo agrega columnas e índices (no modifica ni borra datos). Es seguro ejecutarlo varias veces.

ALTER TABLE public.servicios
  ADD COLUMN IF NOT EXISTS cambios_propuestos JSONB,
  ADD COLUMN IF NOT EXISTS cambios_enviados_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.servicios.cambios_propuestos IS
  'Cambios enviados por el prestador pendientes de revisión (no visibles al público). Campos permitidos: descripcion, horario, rango_precio, contacto, reservacion, imagen_url.';
COMMENT ON COLUMN public.servicios.cambios_enviados_at IS
  'Momento en que el prestador envió el último servicio nuevo o propuesta de cambios a revisión.';

-- Bandeja del administrador: solicitudes pendientes, de la más antigua a la más reciente.
CREATE INDEX IF NOT EXISTS idx_servicios_moderacion_pendiente
  ON public.servicios (cambios_enviados_at)
  WHERE deleted_at IS NULL AND (cambios_propuestos IS NOT NULL OR estado_aprobacion = 'en_revision');
