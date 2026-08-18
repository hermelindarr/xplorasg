// Middleware de autorización por rol. Uso:
//   router.post("/lugares", verificarToken, permitirRoles("administrador", "prestador"), controlador)
//
// Debe usarse SIEMPRE después de verificarToken, ya que depende de req.usuario.
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: { codigo: "NO_AUTORIZADO", mensaje: "Se requiere iniciar sesión." },
      });
    }

    if (!rolesPermitidos.includes(req.usuario.nombre_rol)) {
      return res.status(403).json({
        error: {
          codigo: "ROL_NO_PERMITIDO",
          mensaje: `Esta acción requiere uno de los siguientes roles: ${rolesPermitidos.join(", ")}.`,
        },
      });
    }

    next();
  };
}

module.exports = { permitirRoles };
