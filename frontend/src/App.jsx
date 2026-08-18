import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RutaProtegida from "./components/RutaProtegida";
import InstalarApp from "./components/InstalarApp";

import Home from "./pages/Home";
import IniciarSesion from "./pages/IniciarSesion";
import Registro from "./pages/Registro";
import Lugares from "./pages/Lugares";
import LugarDetalle from "./pages/LugarDetalle";
import Mapa from "./pages/Mapa";
import Rutas from "./pages/Rutas";
import RutaDetalle from "./pages/RutaDetalle";
import Eventos from "./pages/Eventos";
import Perfil from "./pages/Perfil";
import PanelPrestador from "./pages/PanelPrestador";
import PanelAdmin from "./pages/PanelAdmin";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <InstalarApp />
        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/lugares/:id" element={<LugarDetalle />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/rutas" element={<Rutas />} />
            <Route path="/rutas/:id" element={<RutaDetalle />} />
            <Route path="/eventos" element={<Eventos />} />
            <Route
              path="/perfil"
              element={
                <RutaProtegida>
                  <Perfil />
                </RutaProtegida>
              }
            />
            <Route
              path="/panel-prestador"
              element={
                <RutaProtegida rolesPermitidos={["prestador"]}>
                  <PanelPrestador />
                </RutaProtegida>
              }
            />
            <Route
              path="/panel-admin"
              element={
                <RutaProtegida rolesPermitidos={["administrador"]}>
                  <PanelAdmin />
                </RutaProtegida>
              }
            />
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Routes>
        </main>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

function PaginaNoEncontrada() {
  return (
    <div className="contenedor" style={{ padding: "80px 24px", textAlign: "center" }}>
      <h1>Página no encontrada</h1>
      <p>La página que buscas no existe o fue movida.</p>
    </div>
  );
}
