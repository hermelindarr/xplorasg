const express = require("express");
const router = express.Router();
const catalogoController = require("../controllers/catalogoController");

router.get("/municipios", catalogoController.listarMunicipios);
router.get("/categorias", catalogoController.listarCategorias);

module.exports = router;
