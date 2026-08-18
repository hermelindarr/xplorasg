import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { lugarService } from "../services/resources";
import AvisoOffline from "../components/AvisoOffline";
import SeccionOpiniones from "../components/SeccionOpiniones";
import FormularioReserva from "../components/FormularioReserva";
import "./LugarDetalle.css";

export default function LugarDetalle() {
  const { id } = useParams();
  const [lugar, setLugar] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [desdeCache, setDesdeCache] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState(null);

  const cargarLugar = useCallback(() => {
    lugarService
      .detalle(id)
      .then((d) => {
        setLugar(d.lugar);
        setDesdeCache(Boolean(d.desdeCache));
        setGuardadoEn(d.guardadoEn || null);
      })
      .catch((err) => setError(err.mensaje || "No se pudo cargar el lugar."))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    setCargando(true);
    cargarLugar();
  }, [cargarLugar]);

  if (cargando) return <div className="contenedor lugar-detalle"><p>Cargando…</p></div>;
  if (error) return <div className="contenedor lugar-detalle"><div className="mensaje-error">{error}</div></div>;
  if (!lugar) return null;

  const esHospedaje = Boolean(lugar.id_hospedaje);

  return (
    <div className="lugar-detalle">
      <div className="lugar-detalle__hero">
        <div className="contenedor">
          <Link to="/lugares" className="lugar-detalle__volver">← Volver a explorar</Link>
          {desdeCache && <AvisoOffline guardadoEn={guardadoEn} />}
          <h1>
            {lugar.nombre}
            {lugar.es_demo ? <span className="badge-demo">DEMO</span> : null}
          </h1>
          <p className="lugar-detalle__ubicacion">📍 {lugar.municipio} · {lugar.categoria}</p>
        </div>
      </div>

      <div className="contenedor lugar-detalle__cuerpo">
        <div className="lugar-detalle__principal">
          <section>
            <h2>Descripción</h2>
            <p>{lugar.descripcion || "Sin descripción disponible."}</p>
          </section>

          <section>
            <h2>Opiniones y calificaciones</h2>
            {lugar.calificacion_promedio ? (
              <p className="lugar-detalle__calificacion">⭐ {lugar.calificacion_promedio} de 5 ({lugar.total_opiniones} opinión{lugar.total_opiniones !== 1 ? "es" : ""})</p>
            ) : (
              <p>Este lugar aún no tiene opiniones registradas.</p>
            )}
            <SeccionOpiniones idLugar={id} onOpinionCreada={cargarLugar} />
          </section>
        </div>

        <aside>
          <div className="lugar-detalle__ficha tarjeta">
            <h3>Información práctica</h3>
            <dl>
              {lugar.horarios && <><dt>Horario</dt><dd>{lugar.horarios}</dd></>}
              {lugar.precio_rango && <><dt>Precio</dt><dd>{lugar.precio_rango}</dd></>}
              {lugar.contacto && <><dt>Contacto</dt><dd>{lugar.contacto}</dd></>}
              <dt>Estado</dt>
              <dd className={`estado-badge estado-${lugar.estado_verificacion}`}>
                {lugar.estado_verificacion === "aprobado" ? "Información verificada" : lugar.estado_verificacion}
              </dd>
            </dl>
          </div>

          {esHospedaje && (
            <FormularioReserva idHospedaje={lugar.id_hospedaje} precioNoche={lugar.precio_noche} />
          )}
        </aside>
      </div>
    </div>
  );
}
