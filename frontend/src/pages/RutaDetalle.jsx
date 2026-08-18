import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import { rutaService } from "../services/resources";
import AvisoOffline from "../components/AvisoOffline";
import "leaflet/dist/leaflet.css";
import "./RutaDetalle.css";

function iconoParada(numero) {
  return L.divIcon({
    className: "marcador-parada",
    html: `<span class="marcador-parada__punto">${numero}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function RutaDetalle() {
  const { id } = useParams();
  const [ruta, setRuta] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [desdeCache, setDesdeCache] = useState(false);

  useEffect(() => {
    setCargando(true);
    rutaService
      .detalle(id)
      .then((d) => {
        setRuta(d.ruta);
        setDesdeCache(Boolean(d.desdeCache));
      })
      .catch((err) => setError(err.mensaje || "No se pudo cargar la ruta."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <div className="contenedor rutas-pagina"><p>Cargando…</p></div>;
  if (error) return <div className="contenedor rutas-pagina"><div className="mensaje-error">{error}</div></div>;
  if (!ruta) return null;

  const paradasConCoords = ruta.paradas.filter((p) => p.latitud && p.longitud);
  const posiciones = paradasConCoords.map((p) => [Number(p.latitud), Number(p.longitud)]);
  const centro = posiciones[0] || [21.2167, -99.4667];

  return (
    <div className="ruta-detalle">
      <div className="contenedor ruta-detalle__encabezado">
        <Link to="/rutas" className="lugar-detalle__volver">← Volver a rutas</Link>
        {desdeCache && <AvisoOffline guardadoEn={null} />}
        <h1>{ruta.nombre}</h1>
        <p className="lugares-subtitulo">{ruta.descripcion}</p>
      </div>

      {posiciones.length > 0 && (
        <div className="ruta-detalle__mapa-envoltura">
          <MapContainer center={centro} zoom={11} className="ruta-detalle__mapa" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Polyline positions={posiciones} pathOptions={{ color: "#1FA7A5", weight: 4, dashArray: "6 8" }} />
            {paradasConCoords.map((p, i) => (
              <Marker key={p.id_lugar} position={[Number(p.latitud), Number(p.longitud)]} icon={iconoParada(i + 1)}>
                <Popup>
                  <strong>{i + 1}. {p.nombre}</strong>
                  <br />
                  <span style={{ color: "#5A6B78" }}>{p.municipio} · {p.categoria}</span>
                  <br />
                  <Link to={`/lugares/${p.id_lugar}`}>Ver detalle →</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="contenedor ruta-detalle__lista">
        <h2>Paradas de la ruta</h2>
        <ol className="ruta-detalle__paradas">
          {ruta.paradas.map((p, i) => (
            <li key={p.id_lugar}>
              <Link to={`/lugares/${p.id_lugar}`}>
                <span className="ruta-detalle__numero">{i + 1}</span>
                <span>
                  <strong>{p.nombre}</strong>
                  <span className="ruta-detalle__meta"> · {p.municipio} · {p.categoria}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
