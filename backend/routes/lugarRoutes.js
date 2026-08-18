const express = require("express");
const router = express.Router();
const lugarController = require("../controllers/lugarController");
const { verificarToken } = require("../middleware/authMiddleware");
const { permitirRoles } = require("../middleware/roleMiddleware");

// Públicos
router.get("/lugares", lugarController.listar);
router.get("/lugares/:id", lugarController.detalle);

// Prestador: alta y administración de su propio negocio (sec. 5 del brief)
router.post("/lugares", verificarToken, permitirRoles("prestador"), lugarController.crear);
router.put("/lugares/:id", verificarToken, permitirRoles("prestador"), lugarController.actualizar);
router.post("/lugares/:id/imagenes", verificarToken, permitirRoles("prestador"), lugarController.agregarImagen);

router.get("/prestador/lugares", verificarToken, permitirRoles("prestador"), lugarController.misLugares);
router.get("/prestador/reservaciones", verificarToken, permitirRoles("prestador"), lugarController.reservacionesRecibidas);

module.exports = router;
