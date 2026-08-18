const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuarioModel = require("../models/usuarioModel");
const { jwtSecret, jwtExpiresIn } = require("../config/env");

const SALT_ROUNDS = 10;

function generarToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
      nombre_rol: usuario.nombre_rol,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

// Registro. Por defecto crea un usuario con rol "turista"; el registro
// como "prestador" se permite explícitamente (rol_solicitado) porque
// el prestador también necesita cuenta para publicar su negocio.
async function registrar({ nombre, correo, contrasena, rol_solicitado = "turista" }) {
  const rolesPermitidosEnRegistro = ["turista", "prestador"];
  if (!rolesPermitidosEnRegistro.includes(rol_solicitado)) {
    const err = new Error("Rol no permitido en autorregistro");
    err.status = 400;
    err.codigo = "ROL_INVALIDO";
    err.publicMessage = "El rol solicitado no es válido para el autorregistro.";
    throw err;
  }

  const existente = await usuarioModel.findByEmail(correo);
  if (existente) {
    const err = new Error("Correo ya registrado");
    err.status = 409;
    err.codigo = "CORREO_DUPLICADO";
    err.publicMessage = "Ya existe una cuenta registrada con ese correo.";
    throw err;
  }

  const id_rol = await usuarioModel.getRoleIdByName(rol_solicitado);
  const contrasena_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
  const usuario = await usuarioModel.create({ nombre, correo, contrasena_hash, id_rol });

  const token = generarToken(usuario);
  return { usuario, token };
}

async function login({ correo, contrasena }) {
  const usuario = await usuarioModel.findByEmail(correo);

  // Mensaje genérico intencional: no revelar si fue el correo o la
  // contraseña lo que falló (buena práctica de seguridad).
  const credencialesInvalidas = () => {
    const err = new Error("Credenciales inválidas");
    err.status = 401;
    err.codigo = "CREDENCIALES_INVALIDAS";
    err.publicMessage = "Correo o contraseña incorrectos.";
    throw err;
  };

  if (!usuario || !usuario.activo) credencialesInvalidas();

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!coincide) credencialesInvalidas();

  const token = generarToken(usuario);
  const { contrasena_hash, ...usuarioSinHash } = usuario;
  return { usuario: usuarioSinHash, token };
}

module.exports = { registrar, login, generarToken };
