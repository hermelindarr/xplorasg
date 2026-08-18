import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Registro() {
  const [form, setForm] = useState({ nombre: "", correo: "", contrasena: "", rol_solicitado: "turista" });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError(null);

    if (form.contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const data = await authService.registrar(form);
      iniciarSesion(data);
      navigate("/");
    } catch (err) {
      setError(err.mensaje || "No se pudo completar el registro.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-pagina">
      <div className="auth-tarjeta tarjeta">
        <h1>Crear cuenta</h1>
        <p className="auth-subtitulo">Únete a XploraSG y guarda tus rutas, opiniones y reservaciones.</p>

        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={manejarEnvio}>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>
            <input id="nombre" required value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} placeholder="Tu nombre" />
          </div>
          <div className="campo">
            <label htmlFor="correo">Correo electrónico</label>
            <input id="correo" type="email" required value={form.correo} onChange={(e) => actualizar("correo", e.target.value)} placeholder="tucorreo@ejemplo.com" />
          </div>
          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input id="contrasena" type="password" required value={form.contrasena} onChange={(e) => actualizar("contrasena", e.target.value)} placeholder="Mínimo 8 caracteres" />
          </div>

          <div className="campo">
            <label>Tipo de cuenta</label>
            <div className="selector-rol">
              <button
                type="button"
                className={`chip ${form.rol_solicitado === "turista" ? "activo" : ""}`}
                onClick={() => actualizar("rol_solicitado", "turista")}
              >
                Turista
              </button>
              <button
                type="button"
                className={`chip ${form.rol_solicitado === "prestador" ? "activo" : ""}`}
                onClick={() => actualizar("rol_solicitado", "prestador")}
              >
                Prestador de servicios
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primario auth-boton" disabled={enviando}>
            {enviando ? "Creando cuenta…" : "Registrarme"}
          </button>
        </form>

        <p className="auth-pie">
          ¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
