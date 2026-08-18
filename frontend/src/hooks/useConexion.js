import { useEffect, useState } from "react";

// Necesidad crítica de la Fase I: 97.3% de los encuestados ha tenido
// problemas de conectividad. Este hook expone el estado real de
// conexión del navegador para mostrar el indicador visual requerido
// en la sección 10 del brief de Fase III.
export function useConexion() {
  const [enLinea, setEnLinea] = useState(navigator.onLine);

  useEffect(() => {
    const marcarOnline = () => setEnLinea(true);
    const marcarOffline = () => setEnLinea(false);
    window.addEventListener("online", marcarOnline);
    window.addEventListener("offline", marcarOffline);
    return () => {
      window.removeEventListener("online", marcarOnline);
      window.removeEventListener("offline", marcarOffline);
    };
  }, []);

  return enLinea;
}
