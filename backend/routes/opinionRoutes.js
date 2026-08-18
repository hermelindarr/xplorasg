const express = require("express");
const router = express.Router();
const opinionController = require("../controllers/opinionController");
const { verificarToken } = require("../middleware/authMiddleware");

router.get("/lugares/:id/opiniones", opinionController.listar);
router.post("/lugares/:id/opiniones", verificarToken, opinionController.crear);

module.exports = router;
