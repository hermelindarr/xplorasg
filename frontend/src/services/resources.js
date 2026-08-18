import api from "./api";
import { guardarEnCache, leerDeCache, claveConFiltros } from "./offlineCache";

// ---------- Autenticación (siempre requiere red) ----------
export const authService = {
  registrar: (datos) => api.post("/usuarios", datos).then((r) => r.data),
  login: (datos) => api.post("/login", datos).then((r) => r.data),
  perfil: () => api.get("/perfil").then((r) => r.data),
};

// Ejecuta una petición de red; si falla (sin conexión), intenta
// recuperar la última respuesta guardada en caché para esa clave.
// Devuelve además `desdeCache` para que la UI pueda avisar al usuario.
async function conRespaldoOffline(clave, peticion) {
  try {
    const data = await peticion();
    guardarEnCache(clave, data);
    return { ...data, desdeCache: false };
  } catch (err) {
    const cache = leerDeCache(clave);
    if (cache) {
      return { ...cache.datos, desdeCache: true, guardadoEn: cache.guardadoEn };
    }
    throw err;
  }
}

// ---------- Lugares (con respaldo offline) ----------
export const lugarService = {
  listar: (filtros = {}) => {
    const clave = claveConFiltros("lugares", filtros);
    return conRespaldoOffline(clave, () =>
      api.get("/lugares", { params: filtros }).then((r) => r.data)
    );
  },
  detalle: (id) =>
    conRespaldoOffline(`lugar:${id}`, () => api.get(`/lugares/${id}`).then((r) => r.data)),
};

// ---------- Catálogos (con respaldo offline) ----------
export const catalogoService = {
  municipios: () =>
    conRespaldoOffline("municipios", () => api.get("/municipios").then((r) => r.data)),
  categorias: () =>
    conRespaldoOffline("categorias", () => api.get("/categorias").then((r) => r.data)),
};

// ---------- Exploración (con respaldo offline) ----------
export const exploracionService = {
  eventos: (filtros = {}) => {
    const clave = claveConFiltros("eventos", filtros);
    return conRespaldoOffline(clave, () =>
      api.get("/eventos", { params: filtros }).then((r) => r.data)
    );
  },
  recomendaciones: () =>
    conRespaldoOffline("recomendaciones", () => api.get("/recomendaciones").then((r) => r.data)),
};

// ---------- Rutas sugeridas (con respaldo offline) ----------
export const rutaService = {
  listar: () => conRespaldoOffline("rutas", () => api.get("/rutas").then((r) => r.data)),
  detalle: (id) =>
    conRespaldoOffline(`ruta:${id}`, () => api.get(`/rutas/${id}`).then((r) => r.data)),
};

// ---------- Opiniones y calificaciones (requieren red para escribir) ----------
export const opinionService = {
  listar: (id_lugar) =>
    conRespaldoOffline(`opiniones:${id_lugar}`, () =>
      api.get(`/lugares/${id_lugar}/opiniones`).then((r) => r.data)
    ),
  crear: (id_lugar, datos) =>
    api.post(`/lugares/${id_lugar}/opiniones`, datos).then((r) => r.data),
};

// ---------- Reservaciones (siempre requieren red) ----------
export const reservaService = {
  crear: (datos) => api.post("/reservas", datos).then((r) => r.data),
  misReservaciones: () => api.get("/reservas").then((r) => r.data),
};

// ---------- Prestador (siempre requieren red y sesión) ----------
export const prestadorService = {
  misLugares: () => api.get("/prestador/lugares").then((r) => r.data),
  misReservaciones: () => api.get("/prestador/reservaciones").then((r) => r.data),
  crearLugar: (datos) => api.post("/lugares", datos).then((r) => r.data),
  actualizarLugar: (id, datos) => api.put(`/lugares/${id}`, datos).then((r) => r.data),
  agregarImagen: (id, url) => api.post(`/lugares/${id}/imagenes`, { url }).then((r) => r.data),
};

// ---------- Administración (siempre requieren red y sesión) ----------
export const adminService = {
  lugares: (estado) => api.get("/admin/lugares", { params: { estado } }).then((r) => r.data),
  aprobarLugar: (id) => api.put(`/admin/lugares/${id}/aprobar`).then((r) => r.data),
  rechazarLugar: (id) => api.put(`/admin/lugares/${id}/rechazar`).then((r) => r.data),
  usuarios: () => api.get("/admin/usuarios").then((r) => r.data),
  cambiarEstadoUsuario: (id, activo) => api.put(`/admin/usuarios/${id}/estado`, { activo }).then((r) => r.data),
  crearMunicipio: (nombre) => api.post("/admin/municipios", { nombre }).then((r) => r.data),
  crearCategoria: (nombre, icono) => api.post("/admin/categorias", { nombre, icono }).then((r) => r.data),
  reportes: () => api.get("/admin/reportes").then((r) => r.data),
};
