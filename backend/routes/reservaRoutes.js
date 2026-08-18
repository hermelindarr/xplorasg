const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");
const { verificarToken } = require("../middleware/authMiddleware");

// POST /reservas — crear reservación (Sprint 3, implementado)
router.post("/reservas", verificarToken, reservaController.crear);

// GET /reservas — "Mis reservaciones" del usuario autenticado
router.get("/reservas", verificarToken, reservaController.listarPropias);

module.exports = router;
