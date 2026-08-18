import { useEffect, useState } from "react";
import { adminService } from "../services/resources";
import "./PanelAdmin.css";

const PESTANAS = [
  { id: "publicaciones", label: "Publicaciones" },
  { id: "usuarios", label: "Usuarios" },
  { id: "reportes", label: "Reportes" },
];

export default function PanelAdmin() {
  const [pestana, setPestana] = useState("publicaciones");

  return (
    <div className="contenedor panel-pagina">
      <h1>Panel de administración</h1>
      <p className="lugares-subtitulo">Revisa publicaciones, gestiona usuarios y consulta el estado del sistema.</p>

      <div className="panel-tabs">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            className={`chip ${pestana === p.id ? "activo" : ""}`}
            onClick={() => setPestana(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === "publicaciones" && <TabPublicaciones />}
      {pestana === "usuarios" && <TabUsuarios />}
      {pestana === "reportes" && <TabReportes />}
    </div>
  );
}

function TabPublicaciones() {
  const [filtro, setFiltro] = useState("pendiente");
  const [lugares, setLugares] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(null);

  function cargar() {
    setCargando(true);
    adminService
      .lugares(filtro || undefined)
      .then((d) => setLugares(d.lugares))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function accionar(id, accion) {
    setAccionando(id);
    try {
      if (accion === "aprobar") await adminService.aprobarLugar(id);
      else await adminService.rechazarLugar(id);
      cargar();
    } finally {
      setAccionando(null);
    }
  }

  return (
    <section className="panel-seccion">
      <div className="panel-filtros">
        {["pendiente", "aprobado", "rechazado", ""].map((f) => (
          <button key={f || "todos"} className={`chip ${filtro === f ? "activo" : ""}`} onClick={() => setFiltro(f)}>
            {f || "Todos"}
          </button>
        ))}
      </div>

      {cargando && <p>Cargando…</p>}
      {!cargando && lugares.length === 0 && <p>No hay publicaciones con este filtro.</p>}

      <div className="panel-tabla">
        {lugares.map((l) => (
          <div key={l.id_lugar} className="tarjeta panel-fila panel-fila--publicacion">
            <div>
              <strong>{l.nombre}</strong>
              <span className="panel-fila__meta"> · {l.municipio} · {l.categoria}</span>
              <br />
              <span className="panel-fila__meta">Prestador: {l.prestador || "—"}</span>
            </div>
            <div className="panel-fila__acciones">
              <span className={`estado-badge estado-${l.estado_verificacion === "aprobado" ? "aprobado" : l.estado_verificacion === "rechazado" ? "rechazado" : "pendiente"}`}>
                {l.estado_verificacion}
              </span>
              {l.estado_verificacion === "pendiente" && (
                <>
                  <button className="btn btn-primario" disabled={accionando === l.id_lugar} onClick={() => accionar(l.id_lugar, "aprobar")}>
                    Aprobar
                  </button>
                  <button className="btn btn-secundario" disabled={accionando === l.id_lugar} onClick={() => accionar(l.id_lugar, "rechazar")}>
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(null);

  function cargar() {
    setCargando(true);
    adminService.usuarios().then((d) => setUsuarios(d.usuarios)).finally(() => setCargando(false));
  }

  useEffect(() => { cargar(); }, []);

  async function alternarEstado(u) {
    setAccionando(u.id_usuario);
    try {
      await adminService.cambiarEstadoUsuario(u.id_usuario, !u.activo);
      cargar();
    } catch {
      // El backend ya evita que el admin se desactive a sí mismo; se ignora aquí.
    } finally {
      setAccionando(null);
    }
  }

  return (
    <section className="panel-seccion">
      {cargando && <p>Cargando…</p>}
      <div className="panel-tabla">
        {usuarios.map((u) => (
          <div key={u.id_usuario} className="tarjeta panel-fila">
            <div>
              <strong>{u.nombre}</strong>
              <span className="panel-fila__meta"> · {u.correo}</span>
              <br />
              <span className="chip activo" style={{ marginTop: 4 }}>{u.nombre_rol}</span>
            </div>
            <div className="panel-fila__acciones">
              <span className={`estado-badge ${u.activo ? "estado-aprobado" : "estado-rechazado"}`}>
                {u.activo ? "Activo" : "Desactivado"}
              </span>
              <button
                className="btn btn-secundario"
                disabled={accionando === u.id_usuario}
                onClick={() => alternarEstado(u)}
              >
                {u.activo ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TabReportes() {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    adminService.reportes().then(setDatos);
  }, []);

  if (!datos) return <p>Cargando reportes…</p>;

  return (
    <section className="panel-seccion">
      <div className="reportes-grid">
        <div className="tarjeta reporte-tarjeta">
          <strong>{datos.totales.total_usuarios}</strong>
          <span>Usuarios registrados</span>
        </div>
        <div className="tarjeta reporte-tarjeta">
          <strong>{datos.totales.total_lugares}</strong>
          <span>Lugares registrados</span>
        </div>
        <div className="tarjeta reporte-tarjeta">
          <strong>{datos.totales.total_reservaciones}</strong>
          <span>Reservaciones totales</span>
        </div>
        <div className="tarjeta reporte-tarjeta">
          <strong>{datos.totales.calificacion_promedio_general || "—"}</strong>
          <span>Calificación promedio general</span>
        </div>
      </div>

      <div className="reportes-detalle">
        <div className="tarjeta reportes-detalle__col">
          <h3>Usuarios por rol</h3>
          {datos.usuariosPorRol.map((r) => (
            <div key={r.nombre_rol} className="reportes-detalle__fila">
              <span>{r.nombre_rol}</span><strong>{r.total}</strong>
            </div>
          ))}
        </div>
        <div className="tarjeta reportes-detalle__col">
          <h3>Lugares por estado</h3>
          {datos.lugaresPorEstado.map((r) => (
            <div key={r.estado_verificacion} className="reportes-detalle__fila">
              <span>{r.estado_verificacion}</span><strong>{r.total}</strong>
            </div>
          ))}
        </div>
        <div className="tarjeta reportes-detalle__col">
          <h3>Reservaciones por estado</h3>
          {datos.reservacionesPorEstado.length === 0 && <p className="reportes-detalle__vacio">Sin datos aún.</p>}
          {datos.reservacionesPorEstado.map((r) => (
            <div key={r.estado} className="reportes-detalle__fila">
              <span>{r.estado}</span><strong>{r.total}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
