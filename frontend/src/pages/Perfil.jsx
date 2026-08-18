import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reservaService } from "../services/resources";
import "./Perfil.css";

const ETIQUETAS_ROL = {
  turista: "Turista",
  prestador: "Prestador de servicios",
  administrador: "Administrador",
};

const ETIQUETAS_ESTADO = {
  pendiente: { texto: "Pendiente", clase: "estado-pendiente" },
  confirmada: { texto: "Confirmada", clase: "estado-aprobado" },
  cancelada: { texto: "Cancelada", clase: "estado-cancelada" },
};

export default function Perfil() {
  const { usuario } = useAuth();
  const [reservaciones, setReservaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (usuario?.nombre_rol !== "turista") {
      setCargando(false);
      return;
    }
    reservaService
      .misReservaciones()
      .then((d) => setReservaciones(d.reservaciones))
      .catch((err) => setError(err.mensaje || "No se pudieron cargar tus reservaciones."))
      .finally(() => setCargando(false));
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div className="contenedor perfil-pagina">
      <h1>Mi perfil</h1>
      <div className="tarjeta perfil-tarjeta">
        <div className="perfil-avatar">{usuario.nombre.charAt(0).toUpperCase()}</div>
        <div>
          <h2>{usuario.nombre}</h2>
          <p className="perfil-correo">{usuario.correo}</p>
          <span className="chip activo">{ETIQUETAS_ROL[usuario.nombre_rol] || usuario.nombre_rol}</span>
        </div>
      </div>

      <div className="perfil-secciones">
        {usuario.nombre_rol === "turista" && (
          <div className="tarjeta perfil-seccion">
            <h3>Mis reservaciones</h3>
            {cargando && <p>Cargando…</p>}
            {error && <div className="mensaje-error">{error}</div>}
            {!cargando && !error && reservaciones.length === 0 && (
              <p>Aún no tienes reservaciones. <Link to="/lugares">Explora hospedajes</Link> para reservar.</p>
            )}
            <ul className="perfil-reservaciones">
              {reservaciones.map((r) => {
                const estado = ETIQUETAS_ESTADO[r.estado] || { texto: r.estado, clase: "" };
                return (
                  <li key={r.id_reservacion}>
                    <Link to={`/lugares/${r.id_lugar}`}>
                      <div>
                        <strong>{r.lugar}</strong>
                        <span className="perfil-reservaciones__meta"> · {r.municipio}</span>
                        <br />
                        <span className="perfil-reservaciones__fecha">
                          {new Date(r.fecha_reserva).toLocaleDateString("es-MX", { dateStyle: "long" })}
                        </span>
                      </div>
                      <span className={`estado-badge ${estado.clase}`}>{estado.texto}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {usuario.nombre_rol === "prestador" && (
          <div className="tarjeta perfil-seccion">
            <h3>Panel de prestador</h3>
            <p>Administra tus negocios, fotografías y reservaciones recibidas.</p>
            <Link to="/panel-prestador" className="btn btn-primario" style={{ marginTop: 10 }}>Ir al panel</Link>
          </div>
        )}
        {usuario.nombre_rol === "administrador" && (
          <div className="tarjeta perfil-seccion">
            <h3>Panel de administración</h3>
            <p>Aprueba publicaciones, gestiona usuarios y consulta reportes.</p>
            <Link to="/panel-admin" className="btn btn-primario" style={{ marginTop: 10 }}>Ir al panel</Link>
          </div>
        )}
      </div>
    </div>
  );
}
