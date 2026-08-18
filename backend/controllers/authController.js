const authService = require("../services/authService");

// POST /usuarios — registro de nuevos usuarios (turista o prestador)
async function registrar(req, res, next) {
  try {
    const { nombre, correo, contrasena, rol_solicitado } = req.body;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        error: { codigo: "DATOS_INCOMPLETOS", mensaje: "Nombre, correo y contraseña son obligatorios." },
      });
    }
    if (contrasena.length < 8) {
      return res.status(400).json({
        error: { codigo: "CONTRASENA_DEBIL", mensaje: "La contraseña debe tener al menos 8 caracteres." },
      });
    }

    const { usuario, token } = await authService.registrar({ nombre, correo, contrasena, rol_solicitado });
    const { contrasena_hash, ...usuarioPublico } = usuario;

    res.status(201).json({ usuario: usuarioPublico, token });
  } catch (err) {
    next(err);
  }
}

// POST /login
async function login(req, res, next) {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({
        error: { codigo: "DATOS_INCOMPLETOS", mensaje: "Correo y contraseña son obligatorios." },
      });
    }

    const { usuario, token } = await authService.login({ correo, contrasena });
    res.json({ usuario, token });
  } catch (err) {
    next(err);
  }
}

// GET /perfil — requiere token; devuelve el usuario autenticado
async function perfil(req, res, next) {
  try {
    const usuarioModel = require("../models/usuarioModel");
    const usuario = await usuarioModel.findById(req.usuario.id_usuario);
    if (!usuario) {
      return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Usuario no encontrado." } });
    }
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
}

module.exports = { registrar, login, perfil };
