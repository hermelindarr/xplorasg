const catalogoModel = require("../models/catalogoModel");

// GET /municipios
async function listarMunicipios(_req, res, next) {
  try {
    const municipios = await catalogoModel.findAllMunicipios();
    res.json({ municipios });
  } catch (err) {
    next(err);
  }
}

// GET /categorias
async function listarCategorias(_req, res, next) {
  try {
    const categorias = await catalogoModel.findAllCategorias();
    res.json({ categorias });
  } catch (err) {
    next(err);
  }
}

module.exports = { listarMunicipios, listarCategorias };
