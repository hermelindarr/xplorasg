-- ============================================================
-- Ejecutar DESPUÉS de "npm run seed:users" (backend/seeds/seedUsers.js)
-- Vincula los usuarios de prueba con los lugares y opiniones DEMO.
-- ============================================================

USE xplorasg;

-- Asigna el prestador de prueba como dueño de los lugares DEMO de
-- hospedaje y restaurante.
UPDATE lugares SET id_prestador = (SELECT id_usuario FROM usuarios WHERE correo = 'prestador.demo@xplorasg.mx')
WHERE nombre IN ('Posada Las Encinas (DEMO)', 'Fonda La Huasteca (DEMO)');

-- Opinión DEMO del turista de prueba
INSERT INTO opiniones (id_usuario, id_lugar, calificacion, comentario)
  SELECT u.id_usuario, l.id_lugar, 5, 'Excelente vista, dato de opinión DEMO para pruebas.'
  FROM usuarios u, lugares l
  WHERE u.correo = 'turista.demo@xplorasg.mx' AND l.nombre = 'Mirador Sierra Azul (DEMO)'
  AND NOT EXISTS (
    SELECT 1 FROM opiniones o WHERE o.id_usuario = u.id_usuario AND o.id_lugar = l.id_lugar
  );
