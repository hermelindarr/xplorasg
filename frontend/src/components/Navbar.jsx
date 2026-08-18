import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/logo-xplorasg-transparente.png";
import { useAuth } from "../context/AuthContext";
import { useConexion } from "../hooks/useConexion";
import "./Navbar.css";

const ENLACES = [
  { to: "/", label: "Inicio" },
  { to: "/lugares", label: "Explorar" },
  { to: "/mapa", label: "Mapa" },
  { to: "/rutas", label: "Rutas" },
  { to: "/eventos", label: "Eventos" },
];

export default function Navbar() {
  const { usuario, cerrarSesion } = useAuth();
  const enLinea = useConexion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();

  function salir() {
    cerrarSesion();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="contenedor navbar__interior">
        <Link to="/" className="navbar__marca" onClick={() => setMenuAbierto(false)}>
          <img src={logo} alt="XploraSG — Turismo Inteligente" className="navbar__logo" />
        </Link>

        <nav className={`navbar__enlaces ${menuAbierto ? "navbar__enlaces--abierto" : ""}`}>
          {ENLACES.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              className={({ isActive }) => `navbar__enlace ${isActive ? "activo" : ""}`}
              onClick={() => setMenuAbierto(false)}
            >
              {e.label}
            </NavLink>
          ))}

          <span className={`indicador-conexion ${enLinea ? "online" : "offline"}`}>
            <span className="punto" />
            {enLinea ? "En línea" : "Sin conexión"}
          </span>

          {usuario ? (
            <div className="navbar__usuario">
              {usuario.nombre_rol === "prestador" && (
                <NavLink to="/panel-prestador" className="navbar__enlace">Mi negocio</NavLink>
              )}
              {usuario.nombre_rol === "administrador" && (
                <NavLink to="/panel-admin" className="navbar__enlace">Administración</NavLink>
              )}
              <NavLink to="/perfil" className="navbar__enlace">
                Hola, {usuario.nombre.split(" ")[0]}
              </NavLink>
              <button className="btn btn-secundario" onClick={salir}>Salir</button>
            </div>
          ) : (
            <div className="navbar__usuario">
              <NavLink to="/iniciar-sesion" className="btn btn-secundario">Iniciar sesión</NavLink>
              <NavLink to="/registro" className="btn btn-primario">Registrarme</NavLink>
            </div>
          )}
        </nav>

        <button
          className="navbar__hamburguesa"
          aria-label="Abrir menú"
          onClick={() => setMenuAbierto((v) => !v)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
