import { useEffect, useState } from "react";
import { exploracionService } from "../services/resources";
import AvisoOffline from "../components/AvisoOffline";
import "./Eventos.css";

export default function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [desdeCache, setDesdeCache] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState(null);

  useEffect(() => {
    exploracionService
      .eventos()
      .then((d) => {
        setEventos(d.eventos);
        setDesdeCache(Boolean(d.desdeCache));
        setGuardadoEn(d.guardadoEn || null);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="contenedor eventos-pagina">
      <h1>Próximos eventos</h1>
      <p className="lugares-subtitulo">Festivales, ferias y actividades comunitarias en la Sierra Gorda.</p>

      {desdeCache && <AvisoOffline guardadoEn={guardadoEn} />}
      {cargando && <p>Cargando eventos…</p>}
      {!cargando && eventos.length === 0 && <p>No hay eventos próximos registrados por ahora.</p>}

      <div className="eventos-lista">
        {eventos.map((ev) => (
          <div key={ev.id_evento} className="tarjeta evento-item">
            <div className="evento-item__fecha">
              {new Date(ev.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
            </div>
            <div>
              <h3>{ev.nombre}</h3>
              <p className="evento-item__lugar">📍 {ev.lugar} · {ev.municipio}</p>
              {ev.descripcion && <p>{ev.descripcion}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
