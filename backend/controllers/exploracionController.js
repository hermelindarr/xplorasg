const eventoModel = require("../models/eventoModel");
const recomendacionModel = require("../models/recomendacionModel");

// GET /eventos?municipio=
async function listarEventos(req, res, next) {
  try {
    const eventos = await eventoModel.findAll({ municipio: req.query.municipio });
    res.json({ total: eventos.length, eventos });
  } catch (err) {
    next(err);
  }
}

// GET /recomendaciones
async function listarRecomendaciones(req, res, next) {
  try {
    const limite = Number(req.query.limite) || 6;
    const recomendaciones = await recomendacionModel.obtenerRecomendaciones({ limite });
    res.json({ recomendaciones });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarEventos, listarRecomendaciones };
