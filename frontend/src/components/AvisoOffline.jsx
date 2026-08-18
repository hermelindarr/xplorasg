import "./AvisoOffline.css";

// Se muestra cuando los datos visibles provienen del caché local
// (no se pudo contactar al servidor). Transparencia con el usuario
// sobre qué está viendo, tal como pide el brief (sec. 10).
export default function AvisoOffline({ guardadoEn }) {
  const fecha = guardadoEn
    ? new Date(guardadoEn).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="aviso-offline">
      <span className="punto" />
      Sin conexión: mostrando información guardada{fecha ? ` el ${fecha}` : ""}.
    </div>
  );
}
