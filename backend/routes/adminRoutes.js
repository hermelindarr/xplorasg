const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarToken } = require("../middleware/authMiddleware");
const { permitirRoles } = require("../middleware/roleMiddleware");

// Todas las rutas de este archivo requieren rol "administrador"
// (sec. 5 y 16 del brief: panel administrativo con permisos protegidos).
router.use(verificarToken, permitirRoles("administrador"));

router.get("/admin/lugares", adminController.listarLugares);
router.put("/admin/lugares/:id/aprobar", adminController.aprobarLugar);
router.put("/admin/lugares/:id/rechazar", adminController.rechazarLugar);

router.get("/admin/usuarios", adminController.listarUsuarios);
router.put("/admin/usuarios/:id/estado", adminController.cambiarEstadoUsuario);

router.post("/admin/municipios", adminController.crearMunicipio);
router.post("/admin/categorias", adminController.crearCategoria);

router.get("/admin/reportes", adminController.reportes);

module.exports = router;
