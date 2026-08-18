const lugarModel = require("../models/lugarModel");
const reservaModel = require("../models/reservaModel");

// GET /lugares?municipio=&categoria=
// Búsqueda por municipio o categoría — funcionalidad prioritaria
// del Sprint 1 (45.9% de los encuestados en la Fase I la solicitó).
async function listar(req, res, next) {
  try {
    const { municipio, categoria } = req.query;
    const lugares = await lugarModel.findAll({ municipio, categoria });
    res.json({ total: lugares.length, lugares });
  } catch (err) {
    next(err);
  }
}

// GET /lugares/:id — detalle de lugar con imágenes
async function detalle(req, res, next) {
  try {
    const lugar = await lugarModel.findById(req.params.id);
    if (!lugar) {
      return res.status(404).json({ error: { codigo: "NO_ENCONTRADO", mensaje: "Lugar no encontrado." } });
    }
    const imagenes = await lugarModel.findImagenes(req.params.id);
    res.json({ lugar: { ...lugar, imagenes } });
  } catch (err) {
    next(err);
  }
}

// POST /lugares — el prestador registra su negocio (queda "pendiente"
// hasta que el administrador lo revise, sec. 13 del brief).
async function crear(req, res, next) {
  try {
    const { nombre, descripcion, id_municipio, id_categoria, horarios, precio_rango, contacto, latitud, longitud, tipo, precio_noche, capacidad, tipo_cocina } = req.body;

    if (!nombre || !id_municipio || !id_categoria) {
      return res.status(400).json({
        error: { codigo: "DATOS_INCOMPLETOS", mensaje: "nombre, id_municipio e id_categoria son obligatorios." },
      });
    }
    if (tipo && !["hospedaje", "restaurante"].includes(tipo)) {
      return res.status(400).json({
        error: { codigo: "TIPO_INVALIDO", mensaje: "tipo debe ser 'hospedaje', 'restaurante' o vacío." },
      });
    }

    const lugar = await lugarModel.crear({
      nombre, descripcion, id_municipio, id_categoria,
      id_prestador: req.usuario.id_usuario,
      horarios, precio_rango, contacto, latitud, longitud,
      tipo, precio_noche, capacidad, tipo_cocina,
    });

    res.status(201).json({ lugar });
  } catch (err) {
    next(err);
  }
}

// GET /prestador/lugares — negocios del prestador autenticado
async function misLugares(req, res, next) {
  try {
    const lugares = await lugarModel.findByPrestador(req.usuario.id_usuario);
    res.json({ total: lugares.length, lugares });
  } catch (err) {
    next(err);
  }
}

// PUT /lugares/:id — el prestador edita SU propio negocio (vuelve a
// "pendiente" para nueva revisión del administrador)
async function actualizar(req, res, next) {
  try {
    const lugar = await lugarModel.actualizarPropio({
      id_lugar: req.params.id,
      id_prestador: req.usuario.id_usuario,
      campos: req.body,
    });
    if (!lugar) {
      return res.status(404).json({
        error: { codigo: "NO_ENCONTRADO", mensaje: "El lugar no existe o no te pertenece." },
      });
    }
    res.json({ lugar });
  } catch (err) {
    next(err);
  }
}

// POST /lugares/:id/imagenes — el prestador agrega una fotografía (URL
// ya subida a almacenamiento externo — ver sección de almacenamiento del README)
async function agregarImagen(req, res, next) {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: { codigo: "DATOS_INCOMPLETOS", mensaje: "url es obligatoria." } });
    }
    const imagenes = await lugarModel.agregarImagen({
      id_lugar: req.params.id,
      id_prestador: req.usuario.id_usuario,
      url,
    });
    if (!imagenes) {
      return res.status(404).json({
        error: { codigo: "NO_ENCONTRADO", mensaje: "El lugar no existe o no te pertenece." },
      });
    }
    res.status(201).json({ imagenes });
  } catch (err) {
    next(err);
  }
}

// GET /prestador/reservaciones — reservas que recibió el prestador
async function reservacionesRecibidas(req, res, next) {
  try {
    const reservaciones = await reservaModel.findByPrestador(req.usuario.id_usuario);
    res.json({ total: reservaciones.length, reservaciones });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, detalle, crear, misLugares, actualizar, agregarImagen, reservacionesRecibidas };
