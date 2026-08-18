import { useState } from "react";
import { Link } from "react-router-dom";
import { reservaService } from "../services/resources";
import { useAuth } from "../context/AuthContext";
import "./FormularioReserva.css";

export default function FormularioReserva({ idHospedaje, precioNoche }) {
  const { usuario } = useAuth();
  const [fecha, setFecha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [reservaCreada, setReservaCreada] = useState(null);

  const hoy = new Date().toISOString().slice(0, 10);

  async function enviar(e) {
    e.preventDefault();
    setError(null);
    if (!fecha) {
      setError("Selecciona una fecha para tu reservación.");
      return;
    }
    setEnviando(true);
    try {
      const data = await reservaService.crear({ id_hospedaje: idHospedaje, fecha_reserva: fecha });
      setReservaCreada(data.reservacion);
    } catch (err) {
      setError(err.mensaje || "No se pudo crear la reservación.");
    } finally {
      setEnviando(false);
    }
  }

  if (!usuario) {
    return (
      <div className="tarjeta reserva-tarjeta">
        <h3>Reservar</h3>
        <p className="reserva-aviso">
          <Link to="/iniciar-sesion">Inicia sesión</Link> para reservar este hospedaje.
        </p>
      </div>
    );
  }

  if (reservaCreada) {
    return (
      <div className="tarjeta reserva-tarjeta">
        <h3>¡Reservación registrada!</h3>
        <p className="reserva-confirmacion">
          Fecha: <strong>{new Date(reservaCreada.fecha_reserva).toLocaleDateString("es-MX", { dateStyle: "long" })}</strong>
          <br />
          Estado: <span className="chip activo">{reservaCreada.estado}</span>
        </p>
        <p className="reserva-nota">Puedes consultar el estado de tu reservación en tu perfil.</p>
      </div>
    );
  }

  return (
    <form className="tarjeta reserva-tarjeta" onSubmit={enviar}>
      <h3>Reservar</h3>
      {precioNoche && <p className="reserva-precio">${Number(precioNoche).toLocaleString("es-MX")} MXN / noche</p>}
      {error && <div className="mensaje-error">{error}</div>}
      <div className="campo">
        <label htmlFor="fecha-reserva">Fecha</label>
        <input
          id="fecha-reserva" type="date" required min={hoy}
          value={fecha} onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primario" disabled={enviando} style={{ width: "100%" }}>
        {enviando ? "Reservando…" : "Confirmar reservación"}
      </button>
    </form>
  );
}
