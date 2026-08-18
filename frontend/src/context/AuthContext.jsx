import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/resources";

const AuthContext = createContext(null);

const TOKEN_KEY = "xplorasg_token";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al cargar la app, si hay un token guardado, intenta recuperar
  // el perfil para mantener la sesión activa entre recargas.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCargando(false);
      return;
    }
    authService
      .perfil()
      .then((data) => setUsuario(data.usuario))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setCargando(false));
  }, []);

  function iniciarSesion({ usuario, token }) {
    localStorage.setItem(TOKEN_KEY, token);
    setUsuario(usuario);
  }

  function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
