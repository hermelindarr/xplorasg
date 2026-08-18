import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { lugarService, catalogoService } from "../services/resources";
import { useConexion } from "../hooks/useConexion";
import AvisoOffline from "../components/AvisoOffline";
import "leaflet/dist/leaflet.css";
import "./Mapa.css";

// Centro por defecto: Jalpan de Serra, Querétaro (cabecera de la Sierra Gorda)
const CENTRO_SIERRA_GORDA = [21.2167, -99.4667];

// Colores por categoría, tomados de la paleta oficial de XploraSG,
// para que el marcador comunique de un vistazo el tipo de lugar.
const COLOR_POR_CATEGORIA = {
  Naturaleza: "#2E7D4E",
  Aventura: "#1FA7A5",
  Cultura: "#C49A4E",
  Gastronomía: "#B3261E",
  Comunidad: "#0D2B45",
};

function crearIcono(color) {
  return L.divIcon({
    className: "marcador-xplorasg",
    html: `<span style="background:${color}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const ICONOS_CACHE = Object.fromEntries(
  Object.entries(COLOR_POR_CATEGORIA).map(([cat, color]) => [cat, crearIcono(color)])
);
const ICONO_DEFECTO = crearIcono("#5A6B78");

function BotonUbicacion({ onUbicacion }) {
  const map = useMap();
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);

  function localizar() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    setBuscando(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(coords, 12);
        onUbicacion(coords);
        setBuscando(false);
      },
      () => {
        setError("No se pudo obtener tu ubicación. Revisa los permisos.");
        setBuscando(false);
      }
    );
  }

  return (
    <div className="mapa-control-ubicacion">
      <button className="btn btn-turquesa" onClick={localizar} disabled={buscando}>
        {buscando ? "Ubicando…" : "📍 Mi ubicación"}
      </button>
      {error && <p className="mapa-error-ubicacion">{error}</p>}
    </div>
  );
}

export default function Mapa() {
  const [lugares, setLugares] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [miUbicacion, setMiUbicacion] = useState(null);
  const [desdeCache, setDesdeCache] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState(null);
  const enLinea = useConexion();

  useEffect(() => {
    catalogoService.categorias().then((d) => setCategorias(d.categorias)).catch(() => {});
  }, []);

  useEffect(() => {
    setCargando(true);
    setError(null);
    // lugarService.listar ya intenta la red primero y, si falla,
    // recupera automáticamente la última respuesta guardada en caché
    // (ver services/offlineCache.js) — necesidad #1 de la Fase I.
    lugarService
      .listar({ categoria: categoriaActiva || undefined })
      .then((d) => {
        setLugares(d.lugares);
        setDesdeCache(Boolean(d.desdeCache));
        setGuardadoEn(d.guardadoEn || null);
      })
      .catch((err) => setError(err.mensaje || "No se pudieron cargar los lugares y no hay datos guardados para mostrar."))
      .finally(() => setCargando(false));
  }, [categoriaActiva]);

  const lugaresConCoordenadas = useMemo(
    () => lugares.filter((l) => l.latitud && l.longitud),
    [lugares]
  );

  return (
    <div className="mapa-pagina">
      <div className="mapa-encabezado contenedor">
        <div>
          <h1>Mapa turístico</h1>
          <p className="lugares-subtitulo">Ubica lugares, aplica filtros y usa tu ubicación para orientarte.</p>
        </div>
        <span className={`indicador-conexion ${enLinea ? "online" : "offline"}`}>
          <span className="punto" />
          {enLinea ? "En línea" : "Sin conexión — mostrando información guardada"}
        </span>
      </div>

      <div className="contenedor mapa-filtros">
        <button
          className={`chip ${!categoriaActiva ? "activo" : ""}`}
          onClick={() => setCategoriaActiva(null)}
        >
          Todas
        </button>
        {categorias.map((c) => (
          <button
            key={c.id_categoria}
            className={`chip ${categoriaActiva === c.nombre ? "activo" : ""}`}
            onClick={() => setCategoriaActiva(c.nombre)}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="contenedor">
        {desdeCache && !error && <AvisoOffline guardadoEn={guardadoEn} />}
        {error && <div className="mensaje-error">{error}</div>}
      </div>

      <div className="mapa-lienzo-wrapper">
        <MapContainer center={CENTRO_SIERRA_GORDA} zoom={10} className="mapa-lienzo">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BotonUbicacion onUbicacion={setMiUbicacion} />

          {miUbicacion && (
            <Marker position={miUbicacion} icon={crearIcono("#1A2733")}>
              <Popup>Estás aquí</Popup>
            </Marker>
          )}

          {lugaresConCoordenadas.map((lugar) => (
            <Marker
              key={lugar.id_lugar}
              position={[Number(lugar.latitud), Number(lugar.longitud)]}
              icon={ICONOS_CACHE[lugar.categoria] || ICONO_DEFECTO}
            >
              <Popup>
                <strong>{lugar.nombre}</strong>
                {lugar.es_demo ? <span className="badge-demo">DEMO</span> : null}
                <br />
                <span className="popup-categoria">{lugar.categoria} · {lugar.municipio}</span>
                <br />
                <Link to={`/lugares/${lugar.id_lugar}`}>Ver detalle →</Link>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {cargando && <div className="mapa-cargando">Cargando lugares…</div>}
      </div>

      <div className="contenedor mapa-leyenda">
        {Object.entries(COLOR_POR_CATEGORIA).map(([cat, color]) => (
          <span key={cat} className="mapa-leyenda__item">
            <span className="mapa-leyenda__punto" style={{ background: color }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}
