import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { lugarService, catalogoService } from "../services/resources";
import LugarTarjeta from "../components/LugarTarjeta";
import AvisoOffline from "../components/AvisoOffline";
import "./Lugares.css";

export default function Lugares() {
  const [searchParams, setSearchParams] = useSearchParams();
  const municipio = searchParams.get("municipio") || "";
  const categoria = searchParams.get("categoria") || "";

  const [lugares, setLugares] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [desdeCache, setDesdeCache] = useState(false);
  const [guardadoEn, setGuardadoEn] = useState(null);

  // Carga catálogos una sola vez (para los filtros)
  useEffect(() => {
    catalogoService.municipios().then((d) => setMunicipios(d.municipios)).catch(() => {});
    catalogoService.categorias().then((d) => setCategorias(d.categorias)).catch(() => {});
  }, []);

  // Vuelve a buscar cada vez que cambian los filtros de la URL
  useEffect(() => {
    setCargando(true);
    setError(null);
    lugarService
      .listar({ municipio: municipio || undefined, categoria: categoria || undefined })
      .then((d) => {
        setLugares(d.lugares);
        setDesdeCache(Boolean(d.desdeCache));
        setGuardadoEn(d.guardadoEn || null);
      })
      .catch((err) => setError(err.mensaje || "No se pudieron cargar los lugares y no hay datos guardados para mostrar."))
      .finally(() => setCargando(false));
  }, [municipio, categoria]);

  function actualizarFiltro(clave, valor) {
    const next = new URLSearchParams(searchParams);
    if (valor) next.set(clave, valor);
    else next.delete(clave);
    setSearchParams(next);
  }

  return (
    <div className="contenedor lugares-pagina">
      <h1>Explorar lugares</h1>
      <p className="lugares-subtitulo">Busca por municipio o categoría — a partir de lo que más te importa a ti.</p>

      <div className="lugares-filtros">
        <div className="campo lugares-filtros__campo">
          <label htmlFor="f-municipio">Municipio</label>
          <select id="f-municipio" value={municipio} onChange={(e) => actualizarFiltro("municipio", e.target.value)}>
            <option value="">Todos los municipios</option>
            {municipios.map((m) => (
              <option key={m.id_municipio} value={m.nombre}>{m.nombre}</option>
            ))}
          </select>
        </div>
        <div className="campo lugares-filtros__campo">
          <label htmlFor="f-categoria">Categoría</label>
          <select id="f-categoria" value={categoria} onChange={(e) => actualizarFiltro("categoria", e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
        </div>
        {(municipio || categoria) && (
          <button className="btn btn-secundario" onClick={() => setSearchParams({})}>Limpiar filtros</button>
        )}
      </div>

      {desdeCache && !error && <AvisoOffline guardadoEn={guardadoEn} />}
      {error && <div className="mensaje-error">{error}</div>}
      {cargando && <p>Buscando lugares…</p>}

      {!cargando && !error && (
        <>
          <p className="lugares-resultados">{lugares.length} resultado{lugares.length !== 1 ? "s" : ""}</p>
          <div className="lugares-grid">
            {lugares.map((lugar) => (
              <LugarTarjeta key={lugar.id_lugar} lugar={lugar} />
            ))}
          </div>
          {lugares.length === 0 && <p>No se encontraron lugares con esos filtros.</p>}
        </>
      )}
    </div>
  );
}
