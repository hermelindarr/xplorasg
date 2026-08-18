const opinionModel = require("../models/opinionModel");

// GET /lugares/:id/opiniones
async function listar(req, res, next) {
  try {
    const opiniones = await opinionModel.findByLugar(req.params.id);
    res.json({ total: opiniones.length, opiniones });
  } catch (err) {
    next(err);
  }
}

// POST /lugares/:id/opiniones — requiere sesión; una opinión por
// usuario por lugar (evita información inconsistente, sec. 14 del brief)
async function crear(req, res, next) {
  try {
    const id_lugar = req.params.id;
    const { calificacion, comentario } = req.body;

    const calNum = Number(calificacion);
    if (!calNum || calNum < 1 || calNum > 5 || !Number.isInteger(calNum)) {
      return res.status(400).json({
        error: { codigo: "CALIFICACION_INVALIDA", mensaje: "La calificación debe ser un número entero entre 1 y 5." },
      });
    }

    const existe = await opinionModel.lugarExiste(id_lugar);
    if (!existe) {
      return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "El lugar indicado no existe." } });
    }

    const yaOpino = await opinionModel.yaOpino(req.usuario.id_usuario, id_lugar);
    if (yaOpino) {
      return res.status(409).json({
        error: { codigo: "OPINION_DUPLICADA", mensaje: "Ya registraste una opinión para este lugar." },
      });
    }

    const opinion = await opinionModel.crear({
      id_usuario: req.usuario.id_usuario,
      id_lugar,
      calificacion: calNum,
      comentario,
    });

    res.status(201).json({ opinion });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, crear };
