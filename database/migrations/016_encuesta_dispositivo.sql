-- 016_encuesta_dispositivo.sql
-- Marca las respuestas de la encuesta que llegan desde el mismo dispositivo.
-- Se guarda solo un resumen (SHA-256) de un identificador aleatorio que genera el navegador:
-- no es la IP ni un dato personal, y no permite saber quién respondió.
-- El panel de administración lo usa para contar las respuestas repetidas.
-- Idempotente y compatible con PostgreSQL local y Supabase (SQL Editor).

ALTER TABLE public.encuestas ADD COLUMN IF NOT EXISTS dispositivo VARCHAR(64);
ALTER TABLE public.encuestas ADD COLUMN IF NOT EXISTS otra_persona BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_encuestas_dispositivo ON public.encuestas (dispositivo);
