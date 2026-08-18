-- ============================================================
-- XploraSG — Datos iniciales / semillas
-- Los lugares turísticos marcados es_demo = TRUE son FICTICIOS,
-- creados únicamente para demostrar el funcionamiento del sistema.
-- No representan información turística real verificada.
-- ============================================================

USE xplorasg;

-- Roles base
INSERT INTO roles (nombre_rol) VALUES
  ('turista'), ('prestador'), ('administrador');

-- Municipios de la Sierra Gorda de Querétaro
INSERT INTO municipios (nombre) VALUES
  ('Jalpan de Serra'),
  ('Landa de Matamoros'),
  ('Pinal de Amoles'),
  ('Arroyo Seco'),
  ('San Joaquín');

-- Categorías (alineadas a la iconografía de marca: naturaleza, cultura,
-- aventura, rutas, experiencias, comunidad)
INSERT INTO categorias (nombre, icono) VALUES
  ('Naturaleza', 'naturaleza'),
  ('Aventura', 'aventura'),
  ('Cultura', 'cultura'),
  ('Gastronomía', 'experiencias'),
  ('Comunidad', 'comunidad');

-- Los usuarios de prueba (administrador, prestador, turista) NO se insertan
-- aquí porque requieren la contraseña hasheada con bcrypt.
-- Se crean ejecutando: cd backend && npm run seed:users
-- Ver backend/seeds/seedUsers.js

-- Lugares DEMO (ficticios, para demostrar el funcionamiento)
INSERT INTO lugares (nombre, descripcion, latitud, longitud, horarios, precio_rango, contacto, id_municipio, id_categoria, id_prestador, estado_verificacion, es_demo) VALUES
  ('Mirador Sierra Azul (DEMO)', 'Mirador panorámico ficticio usado como dato de demostración para la funcionalidad de mapa y geolocalización.', 21.2167, -99.4667, '08:00 - 18:00', 'Gratuito', 'DEMO - sin contacto real', 1, 1, NULL, 'aprobado', TRUE),
  ('Cascada El Salto (DEMO)', 'Cascada ficticia de demostración para ilustrar la categoría de aventura y ecoturismo.', 21.1500, -99.3333, '09:00 - 17:00', '$50 - $80 MXN', 'DEMO - sin contacto real', 2, 2, NULL, 'aprobado', TRUE),
  ('Museo de la Sierra (DEMO)', 'Museo comunitario ficticio de demostración para la categoría cultura.', 21.1928, -99.4614, '10:00 - 16:00', '$30 MXN', 'DEMO - sin contacto real', 1, 3, NULL, 'aprobado', TRUE),
  ('Posada Las Encinas (DEMO)', 'Hospedaje ficticio de demostración, usado para probar el flujo de reservaciones.', 21.1350, -99.2100, 'Recepción 24h', '$800 - $1200 MXN/noche', 'DEMO - sin contacto real', 3, 1, NULL, 'aprobado', TRUE),
  ('Fonda La Huasteca (DEMO)', 'Restaurante ficticio de demostración de comida regional.', 21.0980, -99.3850, '08:00 - 21:00', '$120 - $250 MXN', 'DEMO - sin contacto real', 4, 4, NULL, 'aprobado', TRUE),
  ('Taller Textil Comunitario (DEMO)', 'Espacio comunitario ficticio de demostración para la categoría comunidad.', 21.2450, -99.1900, '09:00 - 15:00', 'Entrada libre', 'DEMO - sin contacto real', 5, 5, NULL, 'pendiente', TRUE);

-- Extensiones de hospedaje/restaurante para los lugares DEMO correspondientes
INSERT INTO hospedajes (id_lugar, precio_noche, capacidad)
  SELECT id_lugar, 1000.00, 4 FROM lugares WHERE nombre = 'Posada Las Encinas (DEMO)';

INSERT INTO restaurantes (id_lugar, tipo_cocina)
  SELECT id_lugar, 'Regional / Huasteca' FROM lugares WHERE nombre = 'Fonda La Huasteca (DEMO)';

-- Ruta sugerida DEMO
INSERT INTO rutas (nombre, descripcion) VALUES
  ('Ruta Cultural Jalpan (DEMO)', 'Recorrido ficticio de demostración que conecta atractivos culturales y naturales.');

INSERT INTO ruta_lugar (id_ruta, id_lugar, orden)
  SELECT r.id_ruta, l.id_lugar, 1 FROM rutas r, lugares l
  WHERE r.nombre = 'Ruta Cultural Jalpan (DEMO)' AND l.nombre = 'Mirador Sierra Azul (DEMO)';
INSERT INTO ruta_lugar (id_ruta, id_lugar, orden)
  SELECT r.id_ruta, l.id_lugar, 2 FROM rutas r, lugares l
  WHERE r.nombre = 'Ruta Cultural Jalpan (DEMO)' AND l.nombre = 'Museo de la Sierra (DEMO)';

-- Nota: la opinión DEMO y la vinculación del prestador de prueba a sus
-- lugares se agregan en 03_seed_relaciones_usuarios.sql, que debe
-- ejecutarse DESPUÉS de crear los usuarios con "npm run seed:users".
