import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { opinionService } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import EstrellasInput from "./EstrellasInput";
import "./SeccionOpiniones.css";

export default function SeccionOpiniones({ idLugar, onOpinionCreada }) {
  const { usuario } = useAuth();
  const [opiniones, setOpiniones] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  function cargarOpiniones() {
    setCargando(true);
    opinionService
      .listar(idLugar)
      .then((d) => setOpiniones(d.opiniones))
      .catch(() => {})
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarOpiniones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLugar]);

  async function enviarOpinion(e) {
    e.preventDefault();
    setError(null);
    if (!calificacion) {
      setError("Selecciona una calificación de 1 a 5 estrellas.");
      return;
    }
    setEnviando(true);
    try {
      await opinionService.crear(idLugar, { calificacion, comentario });
      setCalificacion(0);
      setComentario("");
      setExito(true);
      cargarOpiniones();
      onOpinionCreada?.();
    } catch (err) {
      setError(err.mensaje || "No se pudo registrar tu opinión.");
    } finally {
      setEnviando(false);
    }
  }

  const yaOpino = opiniones.some((o) => o.usuario === usuario?.nombre);

  return (
    <div className="seccion-opiniones">
      {usuario && !yaOpino && (
        <form className="tarjeta form-opinion" onSubmit={enviarOpinion}>
          <h3>Deja tu opinión</h3>
          {error && <div className="mensaje-error">{error}</div>}
          {exito && <p className="form-opinion__exito">¡Gracias por tu opinión!</p>}
          <EstrellasInput valor={calificacion} onChange={setCalificacion} />
          <textarea
            placeholder="Cuéntale a otros viajeros cómo fue tu experiencia (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            rows={3}
          />
          <button type="submit" className="btn btn-primario" disabled={enviando}>
            {enviando ? "Enviando…" : "Publicar opinión"}
          </button>
        </form>
      )}

      {!usuario && (
        <p className="form-opinion__aviso">
          <Link to="/iniciar-sesion">Inicia sesión</Link> para dejar tu opinión y calificación.
        </p>
      )}

      {cargando && <p>Cargando opiniones…</p>}
      {!cargando && opiniones.length === 0 && <p>Aún no hay opiniones para este lugar. ¡Sé el primero!</p>}

      <ul className="lista-opiniones">
        {opiniones.map((o) => (
          <li key={o.id_opinion} className="lista-opiniones__item">
            <div className="lista-opiniones__encabezado">
              <strong>{o.usuario}</strong>
              <span className="lista-opiniones__estrellas">{"★".repeat(o.calificacion)}{"☆".repeat(5 - o.calificacion)}</span>
            </div>
            {o.comentario && <p>{o.comentario}</p>}
            <time>{new Date(o.creado_en).toLocaleDateString("es-MX", { dateStyle: "medium" })}</time>
          </li>
        ))}
      </ul>
    </div>
  );
}
