const { pool } = require("../config/db");

// Catálogos de apoyo (municipios y categorías) usados para poblar
// filtros de búsqueda en el frontend.

async function findAllMunicipios() {
  const [rows] = await pool.query(
    `SELECT id_municipio, nombre FROM municipios ORDER BY nombre ASC`
  );
  return rows;
}

async function findAllCategorias() {
  const [rows] = await pool.query(
    `SELECT id_categoria, nombre, icono FROM categorias ORDER BY nombre ASC`
  );
  return rows;
}

module.exports = { findAllMunicipios, findAllCategorias };
