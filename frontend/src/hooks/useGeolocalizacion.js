import { useCallback, useState } from "react";

// Necesidad de la Fase I: 67.6% de los encuestados considera importante
// contar con mapa/geolocalización. Este hook encapsula el acceso a la
// geolocalización del navegador con manejo explícito de permisos/errores.
export function useGeolocalizacion() {
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const solicitarUbicacion = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización.");
      return;
    }
    setBuscando(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicacion({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscando(false);
      },
      (err) => {
        const mensajes = {
          1: "Permiso de ubicación denegado. Actívalo en la configuración del navegador.",
          2: "No se pudo determinar tu ubicación.",
          3: "La solicitud de ubicación tardó demasiado.",
        };
        setError(mensajes[err.code] || "No se pudo obtener tu ubicación.");
        setBuscando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ubicacion, error, buscando, solicitarUbicacion };
}
