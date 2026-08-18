const { pool } = require("../config/db");

async function findByLugar(id_lugar) {
  const [rows] = await pool.query(
    `SELECT o.id_opinion, o.calificacion, o.comentario, o.creado_en,
            u.nombre AS usuario
     FROM opiniones o
     JOIN usuarios u ON u.id_usuario = o.id_usuario
     WHERE o.id_lugar = :id_lugar
     ORDER BY o.creado_en DESC`,
    { id_lugar }
  );
  return rows;
}

async function yaOpino(id_usuario, id_lugar) {
  const [rows] = await pool.query(
    `SELECT id_opinion FROM opiniones WHERE id_usuario = :id_usuario AND id_lugar = :id_lugar`,
    { id_usuario, id_lugar }
  );
  return Boolean(rows[0]);
}

async function crear({ id_usuario, id_lugar, calificacion, comentario }) {
  const [result] = await pool.query(
    `INSERT INTO opiniones (id_usuario, id_lugar, calificacion, comentario)
     VALUES (:id_usuario, :id_lugar, :calificacion, :comentario)`,
    { id_usuario, id_lugar, calificacion, comentario: comentario || null }
  );
  const [rows] = await pool.query(
    `SELECT o.id_opinion, o.calificacion, o.comentario, o.creado_en, u.nombre AS usuario
     FROM opiniones o JOIN usuarios u ON u.id_usuario = o.id_usuario
     WHERE o.id_opinion = :id`,
    { id: result.insertId }
  );
  return rows[0];
}

async function lugarExiste(id_lugar) {
  const [rows] = await pool.query(`SELECT id_lugar FROM lugares WHERE id_lugar = :id_lugar`, { id_lugar });
  return Boolean(rows[0]);
}

module.exports = { findByLugar, yaOpino, crear, lugarExiste };
