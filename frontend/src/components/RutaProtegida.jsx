import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Protege rutas que requieren sesión iniciada y, opcionalmente,
// un rol específico (control de acceso por roles — sección 5 del brief).
export default function RutaProtegida({ children, rolesPermitidos }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null; // evita parpadeo mientras se valida el token

  if (!usuario) return <Navigate to="/iniciar-sesion" replace />;

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.nombre_rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
