const { pool } = require("../config/db");

// Capa de acceso a datos para Usuarios. Los controladores nunca
// escriben SQL directamente: siempre pasan por este modelo.

async function findByEmail(correo) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.correo, u.contrasena_hash, u.activo,
            r.id_rol, r.nombre_rol
     FROM usuarios u
     JOIN roles r ON r.id_rol = u.id_rol
     WHERE u.correo = :correo`,
    { correo }
  );
  return rows[0] || null;
}

async function findById(id_usuario) {
  const [rows] = await pool.query(
    `SELECT u.id_usuario, u.nombre, u.correo, u.activo, u.creado_en,
            r.id_rol, r.nombre_rol
     FROM usuarios u
     JOIN roles r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = :id_usuario`,
    { id_usuario }
  );
  return rows[0] || null;
}

async function create({ nombre, correo, contrasena_hash, id_rol }) {
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, correo, contrasena_hash, id_rol)
     VALUES (:nombre, :correo, :contrasena_hash, :id_rol)`,
    { nombre, correo, contrasena_hash, id_rol }
  );
  return findById(result.insertId);
}

async function getRoleIdByName(nombre_rol) {
  const [rows] = await pool.query(
    `SELECT id_rol FROM roles WHERE nombre_rol = :nombre_rol`,
    { nombre_rol }
  );
  return rows[0]?.id_rol || null;
}

module.exports = { findByEmail, findById, create, getRoleIdByName };
