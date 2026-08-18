const { pool } = require("../config/db");

async function findAll({ municipio } = {}) {
  const condiciones = ["e.fecha >= CURDATE()"];
  const params = {};
  if (municipio) {
    condiciones.push("m.nombre = :municipio");
    params.municipio = municipio;
  }
  const where = `WHERE ${condiciones.join(" AND ")}`;

  const [rows] = await pool.query(
    `SELECT e.id_evento, e.nombre, e.fecha, e.descripcion,
            l.id_lugar, l.nombre AS lugar, m.nombre AS municipio
     FROM eventos e
     JOIN lugares l ON l.id_lugar = e.id_lugar
     JOIN municipios m ON m.id_municipio = l.id_municipio
     ${where}
     ORDER BY e.fecha ASC`,
    params
  );
  return rows;
}

module.exports = { findAll };
