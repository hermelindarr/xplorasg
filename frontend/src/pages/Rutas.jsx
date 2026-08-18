import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { rutaService } from "../services/resources";
import AvisoOffline from "../components/AvisoOffline";
import "./Rutas.css";

export default function Rutas() {
  const [rutas, setRutas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [desdeCache, setDesdeCache] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState(null);

  useEffect(() => {
    rutaService
      .listar()
      .then((d) => {
        setRutas(d.rutas);
        setDesdeCache(Boolean(d.desdeCache));
        setGuardadoEn(d.guardadoEn || null);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="contenedor rutas-pagina">
      <h1>Rutas sugeridas</h1>
      <p className="lugares-subtitulo">Recorridos armados para aprovechar mejor tu visita a la Sierra Gorda.</p>

      {desdeCache && <AvisoOffline guardadoEn={guardadoEn} />}
      {cargando && <p>Cargando rutas…</p>}
      {!cargando && rutas.length === 0 && <p>Aún no hay rutas sugeridas publicadas.</p>}

      <div className="rutas-grid">
        {rutas.map((r) => (
          <Link key={r.id_ruta} to={`/rutas/${r.id_ruta}`} className="tarjeta ruta-tarjeta">
            <h3>{r.nombre}</h3>
            <p>{r.descripcion}</p>
            <span className="ruta-tarjeta__paradas">{r.total_paradas} parada{r.total_paradas !== 1 ? "s" : ""}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
