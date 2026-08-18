// Formato de error consistente en toda la API:
// { error: { codigo, mensaje, detalles? } }

function manejadorNotFound(req, res) {
  res.status(404).json({
    error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: `No existe la ruta ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  console.error(err);

  // JSON mal formado en el body de la petición (body-parser)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: { codigo: "JSON_INVALIDO", mensaje: "El cuerpo de la petición no es un JSON válido." },
    });
  }

  // Error de duplicado en MySQL (ej. correo ya registrado)
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      error: { codigo: "DUPLICADO", mensaje: "El registro ya existe (dato duplicado)." },
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    error: {
      codigo: err.codigo || "ERROR_INTERNO",
      mensaje: err.publicMessage || "Ocurrió un error inesperado en el servidor.",
    },
  });
}

module.exports = { manejadorNotFound, manejadorErrores };
