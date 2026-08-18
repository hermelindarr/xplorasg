const { pool } = require("../config/db");

// DECISIÓN DE IMPLEMENTACIÓN: el diseño de Fase II no especificó el
// algoritmo de recomendación. Para esta primera versión se usa un
// criterio simple y transparente: mejor calificación promedio con
// al menos una opinión, priorizando también lugares sin reseñas aún
// (para darles visibilidad) de forma moderada. Puede evolucionar a
// un motor más sofisticado sin cambiar el contrato del endpoint.
async function obtenerRecomendaciones({ limite = 6 } = {}) {
  // mysql2 no soporta bien un placeholder dentro de LIMIT en modo
  // prepared statement; se valida como entero y se interpola de forma
  // segura (no proviene de texto libre del usuario).
  const limiteSeguro = Math.min(Math.max(parseInt(limite, 10) || 6, 1), 50);

  const [rows] = await pool.query(
    `SELECT
        l.id_lugar, l.nombre, l.descripcion,
        m.nombre AS municipio, c.nombre AS categoria,
        ROUND(AVG(o.calificacion), 1) AS calificacion_promedio,
        COUNT(o.id_opinion) AS total_opiniones
     FROM lugares l
     JOIN municipios m ON m.id_municipio = l.id_municipio
     JOIN categorias c ON c.id_categoria = l.id_categoria
     LEFT JOIN opiniones o ON o.id_lugar = l.id_lugar
     WHERE l.estado_verificacion = 'aprobado'
     GROUP BY l.id_lugar
     ORDER BY (AVG(o.calificacion) IS NULL) ASC, AVG(o.calificacion) DESC, COUNT(o.id_opinion) DESC
     LIMIT ${limiteSeguro}`
  );
  return rows;
}

module.exports = { obtenerRecomendaciones };
