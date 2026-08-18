import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function IniciarSesion() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const data = await authService.login({ correo, contrasena });
      iniciarSesion(data);
      navigate(location.state?.from || "/");
    } catch (err) {
      setError(err.mensaje || "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-tarjeta tarjeta">
        <h1>Iniciar sesión</h1>
        <p className="auth-subtitulo">Accede a tus rutas, reservaciones y opiniones guardadas.</p>

        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input
              id="correo" type="email" required autoComplete="email"
              value={correo} onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </div>
          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena" type="password" required autoComplete="current-password"
              value={contrasena} onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primario auth-boton" disabled={enviando}>
            {enviando ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="auth-pie">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
