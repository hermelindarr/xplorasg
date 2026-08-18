const reservaModel = require("../models/reservaModel");

// POST /reservas — crea una reservación (mínimo: hospedaje, fecha, usuario autenticado)
async function crear(req, res, next) {
  try {
    const { id_hospedaje, fecha_reserva } = req.body;

    if (!id_hospedaje || !fecha_reserva) {
      return res.status(400).json({
        error: { codigo: "DATOS_INCOMPLETOS", mensaje: "id_hospedaje y fecha_reserva son obligatorios." },
      });
    }

    // La fecha de reserva no puede ser en el pasado.
    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha_reserva < hoy) {
      return res.status(400).json({
        error: { codigo: "FECHA_INVALIDA", mensaje: "La fecha de reserva no puede ser anterior a hoy." },
      });
    }

    const hospedaje = await reservaModel.findHospedajeConLugar(id_hospedaje);
    if (!hospedaje) {
      return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "El hospedaje indicado no existe." } });
    }
    if (hospedaje.estado_verificacion !== "aprobado") {
      return res.status(409).json({
        error: { codigo: "LUGAR_NO_DISPONIBLE", mensaje: "Este hospedaje aún no está disponible para reservar." },
      });
    }

    const reservacion = await reservaModel.crear({
      id_usuario: req.usuario.id_usuario,
      id_hospedaje,
      fecha_reserva,
    });

    res.status(201).json({ reservacion });
  } catch (err) {
    next(err);
  }
}

// GET /reservas — reservaciones del usuario autenticado ("Mis reservaciones")
async function listarPropias(req, res, next) {
  try {
    const reservaciones = await reservaModel.findByUsuario(req.usuario.id_usuario);
    res.json({ total: reservaciones.length, reservaciones });
  } catch (err) {
    next(err);
  }
}

module.exports = { crear, listarPropias };
