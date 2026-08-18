const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

// Verifica que la petición incluya un token JWT válido en el header
// Authorization: Bearer <token>. Si es válido, adjunta el usuario
// decodificado a req.usuario para que los controladores lo usen.
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { codigo: "NO_AUTORIZADO", mensaje: "Se requiere iniciar sesión para acceder a este recurso." },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.usuario = payload; // { id_usuario, correo, nombre_rol }
    next();
  } catch (err) {
    return res.status(401).json({
      error: { codigo: "TOKEN_INVALIDO", mensaje: "La sesión expiró o el token no es válido. Inicia sesión nuevamente." },
    });
  }
}

// Middleware opcional: si hay token lo decodifica, pero no bloquea
// la petición si no existe (útil para endpoints públicos con
// comportamiento distinto para usuarios autenticados).
function tokenOpcional(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      req.usuario = jwt.verify(authHeader.split(" ")[1], jwtSecret);
    } catch {
      req.usuario = null;
    }
  }
  next();
}

module.exports = { verificarToken, tokenOpcional };
