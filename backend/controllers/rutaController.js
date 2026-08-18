const rutaModel = require("../models/rutaModel");

// GET /rutas
async function listar(_req, res, next) {
  try {
    const rutas = await rutaModel.findAll();
    res.json({ total: rutas.length, rutas });
  } catch (err) {
    next(err);
  }
}

// GET /rutas/:id — incluye las paradas en orden, con coordenadas para el mapa
async function detalle(req, res, next) {
  try {
    const ruta = await rutaModel.findById(req.params.id);
    if (!ruta) {
      return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Ruta no encontrada." } });
    }
    res.json({ ruta });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, detalle };
