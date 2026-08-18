const { pool } = require("../config/db");

async function findAll() {
  const [rows] = await pool.query(
    `SELECT r.id_ruta, r.nombre, r.descripcion, COUNT(rl.id_lugar) AS total_paradas
     FROM rutas r
     LEFT JOIN ruta_lugar rl ON rl.id_ruta = r.id_ruta
     GROUP BY r.id_ruta
     ORDER BY r.nombre ASC`
  );
  return rows;
}

async function findById(id_ruta) {
  const [rutaRows] = await pool.query(
    `SELECT id_ruta, nombre, descripcion FROM rutas WHERE id_ruta = :id_ruta`,
    { id_ruta }
  );
  if (!rutaRows[0]) return null;

  const [paradas] = await pool.query(
    `SELECT rl.orden, l.id_lugar, l.nombre, l.latitud, l.longitud,
            m.nombre AS municipio, c.nombre AS categoria
     FROM ruta_lugar rl
     JOIN lugares l ON l.id_lugar = rl.id_lugar
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     WHERE rl.id_ruta = :id_ruta
     ORDER BY rl.orden ASC`,
    { id_ruta }
  );

  return { ...rutaRows[0], paradas };
}

module.exports = { findAll, findById };
