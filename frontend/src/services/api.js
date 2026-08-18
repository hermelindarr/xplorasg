import axios from "axios";

// URL base de la API. En desarrollo apunta al backend local;
// en producción se define con la variable de entorno VITE_API_URL.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({ baseURL });

// Adjunta automáticamente el token JWT (si existe) a cada petición.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("xplorasg_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normaliza los errores de la API para que los componentes siempre
// reciban un mensaje legible, sin importar si fue un error de red
// (sin conexión) o un error de la API con formato { error: {...} }.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      return Promise.reject({ codigo: "SIN_CONEXION", mensaje: "No hay conexión con el servidor. Verifica tu internet." });
    }
    const apiError = error.response.data?.error;
    return Promise.reject(apiError || { codigo: "ERROR_DESCONOCIDO", mensaje: "Ocurrió un error inesperado." });
  }
);

export default api;
