import { useEffect, useState } from "react";
import { prestadorService, catalogoService } from "../services/resources";
import "./PanelPrestador.css";

const ETIQUETAS_ESTADO = {
  pendiente: { texto: "En revisión", clase: "estado-pendiente" },
  aprobado: { texto: "Publicado", clase: "estado-aprobado" },
  rechazado: { texto: "Rechazado", clase: "estado-rechazado" },
};

export default function PanelPrestador() {
  const [lugares, setLugares] = useState([]);
  const [reservaciones, setReservaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  function cargarTodo() {
    setCargando(true);
    Promise.all([prestadorService.misLugares(), prestadorService.misReservaciones()])
      .then(([lugaresData, reservasData]) => {
        setLugares(lugaresData.lugares);
        setReservaciones(reservasData.reservaciones);
      })
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarTodo();
  }, []);

  return (
    <div className="contenedor panel-pagina">
      <div className="panel-encabezado">
        <div>
          <h1>Panel de prestador</h1>
          <p className="lugares-subtitulo">Administra tus negocios y consulta tus reservaciones.</p>
        </div>
        <button className="btn btn-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Cancelar" : "+ Registrar negocio"}
        </button>
      </div>

      {mostrarForm && (
        <FormularioNegocio
          onCreado={() => {
            setMostrarForm(false);
            cargarTodo();
          }}
        />
      )}

      <section className="panel-seccion">
        <h2>Mis negocios</h2>
        {cargando && <p>Cargando…</p>}
        {!cargando && lugares.length === 0 && <p>Aún no has registrado ningún negocio.</p>}
        <div className="panel-tabla">
          {lugares.map((l) => {
            const estado = ETIQUETAS_ESTADO[l.estado_verificacion] || { texto: l.estado_verificacion, clase: "" };
            return (
              <div key={l.id_lugar} className="tarjeta panel-fila">
                <div>
                  <strong>{l.nombre}</strong>
                  <span className="panel-fila__meta"> · {l.municipio} · {l.categoria}</span>
                </div>
                <span className={`estado-badge ${estado.clase}`}>{estado.texto}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-seccion">
        <h2>Reservaciones recibidas</h2>
        {!cargando && reservaciones.length === 0 && <p>Aún no has recibido reservaciones.</p>}
        <div className="panel-tabla">
          {reservaciones.map((r) => (
            <div key={r.id_reservacion} className="tarjeta panel-fila">
              <div>
                <strong>{r.turista}</strong>
                <span className="panel-fila__meta"> · {r.turista_correo}</span>
                <br />
                <span className="panel-fila__meta">
                  {r.lugar} · {new Date(r.fecha_reserva).toLocaleDateString("es-MX", { dateStyle: "medium" })}
                </span>
              </div>
              <span className={`estado-badge ${r.estado === "confirmada" ? "estado-aprobado" : "estado-pendiente"}`}>
                {r.estado}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FormularioNegocio({ onCreado }) {
  const [municipios, setMunicipios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState({
    nombre: "", descripcion: "", id_municipio: "", id_categoria: "",
    horarios: "", precio_rango: "", contacto: "", tipo: "", precio_noche: "", capacidad: "", tipo_cocina: "",
  });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    catalogoService.municipios().then((d) => setMunicipios(d.municipios)).catch(() => {});
    catalogoService.categorias().then((d) => setCategorias(d.categorias)).catch(() => {});
  }, []);

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (!form.nombre || !form.id_municipio || !form.id_categoria) {
      setError("Nombre, municipio y categoría son obligatorios.");
      return;
    }
    setEnviando(true);
    try {
      await prestadorService.crearLugar(form);
      onCreado();
    } catch (err) {
      setError(err.mensaje || "No se pudo registrar el negocio.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="tarjeta form-negocio" onSubmit={enviar}>
      <h3>Registrar nuevo negocio</h3>
      <p className="form-negocio__aviso">Tu publicación quedará "en revisión" hasta que un administrador la apruebe.</p>
      {error && <div className="mensaje-error">{error}</div>}

      <div className="form-negocio__grid">
        <div className="campo">
          <label>Nombre del negocio</label>
          <input required value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} />
        </div>
        <div className="campo">
          <label>Tipo</label>
          <select value={form.tipo} onChange={(e) => actualizar("tipo", e.target.value)}>
            <option value="">Atractivo general</option>
            <option value="hospedaje">Hospedaje</option>
            <option value="restaurante">Restaurante</option>
          </select>
        </div>
        <div className="campo">
          <label>Municipio</label>
          <select required value={form.id_municipio} onChange={(e) => actualizar("id_municipio", e.target.value)}>
            <option value="">Selecciona…</option>
            {municipios.map((m) => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Categoría</label>
          <select required value={form.id_categoria} onChange={(e) => actualizar("id_categoria", e.target.value)}>
            <option value="">Selecciona…</option>
            {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
          </select>
        </div>
        <div className="campo">
          <label>Horarios</label>
          <input value={form.horarios} onChange={(e) => actualizar("horarios", e.target.value)} placeholder="08:00 - 18:00" />
        </div>
        <div className="campo">
          <label>Rango de precio</label>
          <input value={form.precio_rango} onChange={(e) => actualizar("precio_rango", e.target.value)} placeholder="$100 - $300 MXN" />
        </div>
        <div className="campo">
          <label>Contacto</label>
          <input value={form.contacto} onChange={(e) => actualizar("contacto", e.target.value)} />
        </div>

        {form.tipo === "hospedaje" && (
          <>
            <div className="campo">
              <label>Precio por noche (MXN)</label>
              <input type="number" min="0" value={form.precio_noche} onChange={(e) => actualizar("precio_noche", e.target.value)} />
            </div>
            <div className="campo">
              <label>Capacidad (personas)</label>
              <input type="number" min="1" value={form.capacidad} onChange={(e) => actualizar("capacidad", e.target.value)} />
            </div>
          </>
        )}
        {form.tipo === "restaurante" && (
          <div className="campo">
            <label>Tipo de cocina</label>
            <input value={form.tipo_cocina} onChange={(e) => actualizar("tipo_cocina", e.target.value)} />
          </div>
        )}
      </div>

      <div className="campo">
        <label>Descripción</label>
        <textarea rows={3} value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)} />
      </div>

      <button type="submit" className="btn btn-primario" disabled={enviando}>
        {enviando ? "Registrando…" : "Registrar negocio"}
      </button>
    </form>
  );
}
