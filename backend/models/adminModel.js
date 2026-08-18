const { pool } = require("../config/db");

// ---------- Publicaciones (lugares) pendientes de revisión ----------

async function findLugaresPorEstado(estado) {
  const condicion = estado ? "WHERE l.estado_verificacion = :estado" : "";
  const [rows] = await pool.query(
    `SELECT l.id_lugar, l.nombre, l.estado_verificacion, l.creado_en,
            m.nombre AS municipio, c.nombre AS categoria,
            u.nombre AS prestador, u.correo AS prestador_correo
     FROM lugares l
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     LEFT JOIN usuarios u ON u.id_usuario = l.id_prestador
     ${condicion}
     ORDER BY l.creado_en DESC`,
    { estado }
  );
  return rows;
}

async function cambiarEstadoLugar(id_lugar, estado) {
  const [result] = await pool.query(
    `UPDATE lugares SET estado_verificacion = :estado WHERE id_lugar = :id_lugar`,
    { id_lugar, estado }
  );
  return result.affectedRows > 0;
}

// ---------- Usuarios ----------

async function findAllUsuarios() {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.correo, u.activo, u.creado_en, r.nombre_rol
     FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
     ORDER BY u.creado_en DESC`
  );
  return rows;
}

async function cambiarEstadoUsuario(id_usuario, activo) {
  const [result] = await pool.query(
    `UPDATE usuarios SET activo = :activo WHERE id_usuario = :id_usuario`,
    { id_usuario, activo }
  );
  return result.affectedRows > 0;
}

// ---------- Catálogos (municipios / categorías) ----------

async function crearMunicipio(nombre) {
  const [result] = await pool.query(`INSERT INTO municipios (nombre) VALUES (:nombre)`, { nombre });
  return { id_municipio: result.insertId, nombre };
}

async function crearCategoria(nombre, icono) {
  const [result] = await pool.query(
    `INSERT INTO categorias (nombre, icono) VALUES (:nombre, :icono)`,
    { nombre, icono: icono || null }
  );
  return { id_categoria: result.insertId, nombre, icono: icono || null };
}

// ---------- Reportes básicos ----------

async function obtenerReportes() {
  const [porRol] = await pool.query(
    `SELECT r.nombre_rol, COUNT(*) AS total FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol GROUP BY r.nombre_rol`
  );
  const [porEstadoLugar] = await pool.query(
    `SELECT estado_verificacion, COUNT(*) AS total FROM lugares GROUP BY estado_verificacion`
  );
  const [reservasPorEstado] = await pool.query(
    `SELECT estado, COUNT(*) AS total FROM reservaciones GROUP BY estado`
  );
  const [[totales]] = await pool.query(
    `SELECT
        (SELECT COUNT(*) FROM usuarios) AS total_usuarios,
        (SELECT COUNT(*) FROM lugares) AS total_lugares,
        (SELECT COUNT(*) FROM opiniones) AS total_opiniones,
        (SELECT COUNT(*) FROM reservaciones) AS total_reservaciones,
        (SELECT ROUND(AVG(calificacion), 2) FROM opiniones) AS calificacion_promedio_general`
  );

  return { totales, usuariosPorRol: porRol, lugaresPorEstado: porEstadoLugar, reservacionesPorEstado: reservasPorEstado };
}

module.exports = {
  findLugaresPorEstado,
  cambiarEstadoLugar,
  findAllUsuarios,
  cambiarEstadoUsuario,
  crearMunicipio,
  crearCategoria,
  obtenerReportes,
};
