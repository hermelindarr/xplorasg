import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { exploracionService } from "../services/resources";
import LugarTarjeta from "../components/LugarTarjeta";
import "./Home.css";

const CATEGORIAS_DESTACADAS = [
  { nombre: "Naturaleza", icono: "🌿" },
  { nombre: "Aventura", icono: "🏔️" },
  { nombre: "Cultura", icono: "🏛️" },
  { nombre: "Gastronomía", icono: "🍲" },
  { nombre: "Comunidad", icono: "🤝" },
];

export default function Home() {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    exploracionService
      .recomendaciones()
      .then((data) => setRecomendaciones(data.recomendaciones.slice(0, 3)))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="contenedor hero__interior">
          <div className="hero__texto">
            <h1>Explora la Sierra Gorda a tu manera</h1>
            <p className="hero__slogan">Explora. Conecta. Vive la Sierra Gorda.</p>
            <p className="hero__descripcion">
              Naturaleza, aventura, cultura, gastronomía y comunidad en un solo lugar —
              con mapa, rutas sugeridas y opiniones verificadas, incluso sin conexión.
            </p>
            <div className="hero__acciones">
              <Link to="/lugares" className="btn btn-primario">Explorar lugares</Link>
              <Link to="/mapa" className="btn btn-turquesa">Ver mapa</Link>
              <Link to="/rutas" className="btn btn-secundario">Rutas sugeridas</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="contenedor seccion">
        <h2>Categorías</h2>
        <div className="categorias-grid">
          {CATEGORIAS_DESTACADAS.map((c) => (
            <Link key={c.nombre} to={`/lugares?categoria=${encodeURIComponent(c.nombre)}`} className="categoria-chip">
              <span className="categoria-chip__icono">{c.icono}</span>
              {c.nombre}
            </Link>
          ))}
        </div>
      </section>

      <section className="contenedor seccion">
        <div className="seccion__encabezado">
          <h2>Recomendados para ti</h2>
          <Link to="/lugares" className="seccion__vertodo">Ver todos →</Link>
        </div>

        {cargando && <p>Cargando recomendaciones…</p>}
        {!cargando && recomendaciones.length === 0 && (
          <p>Aún no hay suficientes datos para recomendaciones. Explora los lugares disponibles.</p>
        )}
        <div className="lugares-grid">
          {recomendaciones.map((lugar) => (
            <LugarTarjeta key={lugar.id_lugar} lugar={lugar} />
          ))}
        </div>
      </section>

      <section className="franja-confianza">
        <div className="contenedor franja-confianza__interior">
          <div>
            <strong>86.5%</strong>
            <span>valora que la información esté verificada</span>
          </div>
          <div>
            <strong>67.6%</strong>
            <span>considera clave el mapa con geolocalización</span>
          </div>
          <div>
            <strong>97.3%</strong>
            <span>ha tenido problemas de conexión — por eso XploraSG funciona offline</span>
          </div>
        </div>
      </section>
    </div>
  );
}
