import { Link } from "react-router-dom";
import "./LugarTarjeta.css";

export default function LugarTarjeta({ lugar }) {
  const calificacion = lugar.calificacion_promedio;

  return (
    <Link to={`/lugares/${lugar.id_lugar}`} className="tarjeta lugar-tarjeta">
      <div className="lugar-tarjeta__imagen" aria-hidden="true">
        <span className="lugar-tarjeta__categoria">{lugar.categoria}</span>
      </div>
      <div className="lugar-tarjeta__cuerpo">
        <h3 className="lugar-tarjeta__nombre">
          {lugar.nombre}
          {lugar.es_demo ? <span className="badge-demo">DEMO</span> : null}
        </h3>
        <p className="lugar-tarjeta__municipio">📍 {lugar.municipio}</p>
        {lugar.descripcion && <p className="lugar-tarjeta__descripcion">{lugar.descripcion}</p>}
        <div className="lugar-tarjeta__pie">
          <span className="lugar-tarjeta__calificacion">
            {calificacion ? `⭐ ${calificacion} (${lugar.total_opiniones})` : "Sin opiniones aún"}
          </span>
          {lugar.precio_rango && <span className="lugar-tarjeta__precio">{lugar.precio_rango}</span>}
        </div>
      </div>
    </Link>
  );
}
