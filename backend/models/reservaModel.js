const { pool } = require("../config/db");

// Verifica que el hospedaje exista y devuelve datos básicos (lugar,
// prestador dueño) — usado para validar antes de crear una reserva.
async function findHospedajeConLugar(id_hospedaje) {
  const [rows] = await pool.query(
    `SELECT h.id_hospedaje, h.precio_noche, h.capacidad,
            l.id_lugar, l.nombre AS nombre_lugar, l.id_prestador, l.estado_verificacion
     FROM hospedajes h
     JOIN lugares l ON l.id_lugar = h.id_lugar
     WHERE h.id_hospedaje = :id_hospedaje`,
    { id_hospedaje }
  );
  return rows[0] || null;
}

async function crear({ id_usuario, id_hospedaje, fecha_reserva }) {
  const [result] = await pool.query(
    `INSERT INTO reservaciones (id_usuario, id_hospedaje, fecha_reserva, estado)
     VALUES (:id_usuario, :id_hospedaje, :fecha_reserva, 'pendiente')`,
    { id_usuario, id_hospedaje, fecha_reserva }
  );
  return findById(result.insertId);
}

async function findById(id_reservacion) {
  const [rows] = await pool.query(
    `SELECT r.id_reservacion, r.fecha_reserva, r.estado, r.creado_en,
            h.id_hospedaje, h.precio_noche,
            l.id_lugar, l.nombre AS lugar, l.contacto
     FROM reservaciones r
     JOIN hospedajes h ON h.id_hospedaje = r.id_hospedaje
     JOIN lugares l ON l.id_lugar = h.id_lugar
     WHERE r.id_reservacion = :id_reservacion`,
    { id_reservacion }
  );
  return rows[0] || null;
}

// Reservaciones de un turista (para "Mis reservaciones" en el perfil)
async function findByUsuario(id_usuario) {
  const [rows] = await pool.query(
    `SELECT r.id_reservacion, r.fecha_reserva, r.estado, r.creado_en,
            h.id_hospedaje, h.precio_noche,
            l.id_lugar, l.nombre AS lugar, m.nombre AS municipio
     FROM reservaciones r
     JOIN hospedajes h ON h.id_hospedaje = r.id_hospedaje
     JOIN lugares l ON l.id_lugar = h.id_lugar
     JOIN municipios m ON m.id_municipio = l.id_municipio
     WHERE r.id_usuario = :id_usuario
     ORDER BY r.creado_en DESC`,
    { id_usuario }
  );
  return rows;
}

// Reservaciones que recibe un prestador sobre sus hospedajes (Sprint 4,
// se deja lista la consulta desde ahora porque la tabla ya lo soporta).
async function findByPrestador(id_prestador) {
  const [rows] = await pool.query(
    `SELECT r.id_reservacion, r.fecha_reserva, r.estado, r.creado_en,
            u.nombre AS turista, u.correo AS turista_correo,
            l.nombre AS lugar
     FROM reservaciones r
     JOIN hospedajes h ON h.id_hospedaje = r.id_hospedaje
     JOIN lugares l ON l.id_lugar = h.id_lugar
     JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE l.id_prestador = :id_prestador
     ORDER BY r.creado_en DESC`,
    { id_prestador }
  );
  return rows;
}

module.exports = { findHospedajeConLugar, crear, findById, findByUsuario, findByPrestador };
