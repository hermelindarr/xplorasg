const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken } = require("../middleware/authMiddleware");

router.post("/usuarios", authController.registrar); // registro
router.post("/login", authController.login);        // inicio de sesión
router.get("/perfil", verificarToken, authController.perfil); // usuario autenticado

module.exports = router;
