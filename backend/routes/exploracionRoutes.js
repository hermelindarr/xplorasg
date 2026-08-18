const express = require("express");
const router = express.Router();
const exploracionController = require("../controllers/exploracionController");

router.get("/eventos", exploracionController.listarEventos);
router.get("/recomendaciones", exploracionController.listarRecomendaciones);

module.exports = router;
