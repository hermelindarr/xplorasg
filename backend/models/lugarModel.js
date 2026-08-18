const { pool } = require("../config/db");

// Consulta lugares con filtros opcionales de municipio y categoría
// (funcionalidad prioritaria del Sprint 1, solicitada por el 45.9%
// de los encuestados en la Fase I).
async function findAll({ municipio, categoria, soloAprobados = true } = {}) {
  const condiciones = [];
  const params = {};

  if (soloAprobados) {
    condiciones.push("l.estado_verificacion = 'aprobado'");
  }
  if (municipio) {
    condiciones.push("m.nombre = :municipio");
    params.municipio = municipio;
  }
  if (categoria) {
    condiciones.push("c.nombre = :categoria");
    params.categoria = categoria;
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
        l.id_lugar, l.nombre, l.descripcion, l.latitud, l.longitud,
        l.horarios, l.precio_rango, l.contacto, l.estado_verificacion, l.es_demo,
        m.nombre AS municipio, c.nombre AS categoria,
        ROUND(AVG(o.calificacion), 1) AS calificacion_promedio,
        COUNT(DISTINCT o.id_opinion) AS total_opiniones
     FROM lugares l
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     LEFT JOIN opiniones o ON o.id_lugar = l.id_lugar
     ${where}
     GROUP BY l.id_lugar
     ORDER BY l.nombre ASC`,
    params
  );
  return rows;
}

async function findById(id_lugar) {
  const [rows] = await pool.query(
    `SELECT
        l.*, m.nombre AS municipio, c.nombre AS categoria,
        h.id_hospedaje, h.precio_noche, h.capacidad,
        ROUND(AVG(o.calificacion), 1) AS calificacion_promedio,
        COUNT(DISTINCT o.id_opinion) AS total_opiniones
     FROM lugares l
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     LEFT JOIN hospedajes h ON h.id_lugar = l.id_lugar
     LEFT JOIN opiniones o ON o.id_lugar = l.id_lugar
     WHERE l.id_lugar = :id_lugar
     GROUP BY l.id_lugar`,
    { id_lugar }
  );
  return rows[0] || null;
}

async function findImagenes(id_lugar) {
  const [rows] = await pool.query(
    `SELECT id_imagen, url, orden FROM imagenes WHERE id_lugar = :id_lugar ORDER BY orden ASC`,
    { id_lugar }
  );
  return rows;
}

// ---------- Prestador: alta y administración de su propio negocio ----------

async function crear({ nombre, descripcion, id_municipio, id_categoria, id_prestador, horarios, precio_rango, contacto, latitud, longitud, tipo, precio_noche, capacidad, tipo_cocina }) {
  const [result] = await pool.query(
    `INSERT INTO lugares
       (nombre, descripcion, id_municipio, id_categoria, id_prestador, horarios, precio_rango, contacto, latitud, longitud, estado_verificacion, es_demo)
     VALUES (:nombre, :descripcion, :id_municipio, :id_categoria, :id_prestador, :horarios, :precio_rango, :contacto, :latitud, :longitud, 'pendiente', FALSE)`,
    { nombre, descripcion: descripcion || null, id_municipio, id_categoria, id_prestador,
      horarios: horarios || null, precio_rango: precio_rango || null, contacto: contacto || null,
      latitud: latitud || null, longitud: longitud || null }
  );
  const id_lugar = result.insertId;

  if (tipo === "hospedaje") {
    await pool.query(
      `INSERT INTO hospedajes (id_lugar, precio_noche, capacidad) VALUES (:id_lugar, :precio_noche, :capacidad)`,
      { id_lugar, precio_noche: precio_noche || null, capacidad: capacidad || null }
    );
  } else if (tipo === "restaurante") {
    await pool.query(
      `INSERT INTO restaurantes (id_lugar, tipo_cocina) VALUES (:id_lugar, :tipo_cocina)`,
      { id_lugar, tipo_cocina: tipo_cocina || null }
    );
  }

  return findById(id_lugar);
}

// Lugares que pertenecen a un prestador específico (incluye pendientes/rechazados)
async function findByPrestador(id_prestador) {
  const [rows] = await pool.query(
    `SELECT l.id_lugar, l.nombre, l.estado_verificacion, l.creado_en,
            m.nombre AS municipio, c.nombre AS categoria
     FROM lugares l
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     WHERE l.id_prestador = :id_prestador
     ORDER BY l.creado_en DESC`,
    { id_prestador }
  );
  return rows;
}

// Actualiza solo los campos permitidos, y solo si el lugar pertenece al prestador.
// Al editar, vuelve a 'pendiente' para que el administrador revise el cambio
// (sec. 13 del brief: flujo de validación de publicaciones).
async function actualizarPropio({ id_lugar, id_prestador, campos }) {
  const permitidos = ["nombre", "descripcion", "horarios", "precio_rango", "contacto", "latitud", "longitud"];
  const entradas = Object.entries(campos).filter(([k, v]) => permitidos.includes(k) && v !== undefined);
  if (entradas.length === 0) return findById(id_lugar);

  const set = entradas.map(([k]) => `${k} = :${k}`).join(", ");
  const params = Object.fromEntries(entradas);

  const [result] = await pool.query(
    `UPDATE lugares SET ${set}, estado_verificacion = 'pendiente'
     WHERE id_lugar = :id_lugar AND id_prestador = :id_prestador`,
    { ...params, id_lugar, id_prestador }
  );
  if (result.affectedRows === 0) return null; // no existe o no es el dueño
  return findById(id_lugar);
}

async function agregarImagen({ id_lugar, id_prestador, url }) {
  const [lugarRows] = await pool.query(
    `SELECT id_lugar FROM lugares WHERE id_lugar = :id_lugar AND id_prestador = :id_prestador`,
    { id_lugar, id_prestador }
  );
  if (!lugarRows[0]) return null;

  const [ordenRows] = await pool.query(
    `SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM imagenes WHERE id_lugar = :id_lugar`,
    { id_lugar }
  );
  await pool.query(
    `INSERT INTO imagenes (id_lugar, url, orden) VALUES (:id_lugar, :url, :orden)`,
    { id_lugar, url, orden: ordenRows[0].siguiente }
  );
  return findImagenes(id_lugar);
}

module.exports = { findAll, findById, findImagenes, crear, findByPrestador, actualizarPropio, agregarImagen };
