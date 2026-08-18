const adminModel = require("../models/adminModel");

// GET /admin/lugares?estado=pendiente
async function listarLugares(req, res, next) {
  try {
    const lugares = await adminModel.findLugaresPorEstado(req.query.estado);
    res.json({ total: lugares.length, lugares });
  } catch (err) {
    next(err);
  }
}

// PUT /admin/lugares/:id/aprobar
async function aprobarLugar(req, res, next) {
  try {
    const ok = await adminModel.cambiarEstadoLugar(req.params.id, "aprobado");
    if (!ok) return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Lugar no encontrado." } });
    res.json({ mensaje: "Publicación aprobada." });
  } catch (err) {
    next(err);
  }
}

// PUT /admin/lugares/:id/rechazar
async function rechazarLugar(req, res, next) {
  try {
    const ok = await adminModel.cambiarEstadoLugar(req.params.id, "rechazado");
    if (!ok) return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Lugar no encontrado." } });
    res.json({ mensaje: "Publicación rechazada." });
  } catch (err) {
    next(err);
  }
}

// GET /admin/usuarios
async function listarUsuarios(_req, res, next) {
  try {
    const usuarios = await adminModel.findAllUsuarios();
    res.json({ total: usuarios.length, usuarios });
  } catch (err) {
    next(err);
  }
}

// PUT /admin/usuarios/:id/estado  { activo: true|false }
async function cambiarEstadoUsuario(req, res, next) {
  try {
    const { activo } = req.body;
    if (typeof activo !== "boolean") {
      return res.status(400).json({ error: { codigo: "DATOS_INCOMPLETOS", mensaje: "activo debe ser true o false." } });
    }
    // No permitir que un administrador se desactive a sí mismo por accidente
    if (Number(req.params.id) === req.usuario.id_usuario && !activo) {
      return res.status(400).json({ error: { codigo: "OPERACION_NO_PERMITIDA", mensaje: "No puedes desactivar tu propia cuenta." } });
    }
    const ok = await adminModel.cambiarEstadoUsuario(req.params.id, activo);
    if (!ok) return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Usuario no encontrado." } });
    res.json({ mensaje: activo ? "Usuario activado." : "Usuario desactivado." });
  } catch (err) {
    next(err);
  }
}

// POST /admin/municipios
async function crearMunicipio(req, res, next) {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: { codigo: "DATOS_INCOMPLETOS", mensaje: "nombre es obligatorio." } });
    const municipio = await adminModel.crearMunicipio(nombre);
    res.status(201).json({ municipio });
  } catch (err) {
    next(err);
  }
}

// POST /admin/categorias
async function crearCategoria(req, res, next) {
  try {
    const { nombre, icono } = req.body;
    if (!nombre) return res.status(400).json({ error: { codigo: "DATOS_INCOMPLETOS", mensaje: "nombre es obligatorio." } });
    const categoria = await adminModel.crearCategoria(nombre, icono);
    res.status(201).json({ categoria });
  } catch (err) {
    next(err);
  }
}

// GET /admin/reportes
async function reportes(_req, res, next) {
  try {
    const datos = await adminModel.obtenerReportes();
    res.json(datos);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarLugares, aprobarLugar, rechazarLugar,
  listarUsuarios, cambiarEstadoUsuario,
  crearMunicipio, crearCategoria,
  reportes,
};
