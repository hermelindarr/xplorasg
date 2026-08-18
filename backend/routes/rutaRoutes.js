const express = require("express");
const router = express.Router();
const rutaController = require("../controllers/rutaController");

router.get("/rutas", rutaController.listar);
router.get("/rutas/:id", rutaController.detalle);

module.exports = router;
