// ============================================================
// Caché offline de datos turísticos.
//
// Necesidad crítica de la Fase I: 97.3% de los encuestados ha tenido
// problemas de conectividad, y 51.4% considera el modo offline de
// MÁXIMA importancia. Por eso el modo offline no es solo visual:
// los datos de lugares/municipios/categorías consultados con éxito
// se guardan localmente y se usan como respaldo cuando no hay red.
//
// QUÉ FUNCIONA OFFLINE:
//   - Ver la última lista de lugares consultada (con filtros previos).
//   - Ver el detalle de un lugar visitado previamente.
//   - Ver municipios y categorías (para armar filtros).
// QUÉ REQUIERE CONEXIÓN:
//   - Iniciar sesión / registrarse.
//   - Escribir opiniones, calificar, reservar.
//   - Ver datos que nunca se consultaron estando en línea.
// ============================================================

const PREFIJO = "xplorasg_cache_";

export function guardarEnCache(clave, datos) {
  try {
    localStorage.setItem(
      PREFIJO + clave,
      JSON.stringify({ datos, guardadoEn: Date.now() })
    );
  } catch {
    // Almacenamiento lleno o no disponible: fallamos en silencio,
    // el modo offline es una mejora, no un requisito bloqueante.
  }
}

export function leerDeCache(clave) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (!crudo) return null;
    const { datos, guardadoEn } = JSON.parse(crudo);
    return { datos, guardadoEn };
  } catch {
    return null;
  }
}

// Genera una clave estable a partir de filtros (para cachear cada
// combinación de búsqueda por separado, ej. lugares:municipio=Jalpan).
export function claveConFiltros(base, filtros = {}) {
  const entradas = Object.entries(filtros)
    .filter(([, v]) => v)
    .sort(([a], [b]) => a.localeCompare(b));
  if (entradas.length === 0) return base;
  const sufijo = entradas.map(([k, v]) => `${k}=${v}`).join("&");
  return `${base}:${sufijo}`;
}
