import { useEffect, useState } from "react";
import "./InstalarApp.css";

// Sección 10 del brief: "Instalación de la aplicación" debe ser una
// capacidad real, no solo mencionada. Este componente escucha el
// evento estándar del navegador para ofrecer instalar XploraSG como
// app (PWA) y dispara el prompt nativo del sistema operativo.
export default function InstalarApp() {
  const [promptEvento, setPromptEvento] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function manejarPrompt(e) {
      e.preventDefault();
      setPromptEvento(e);
      // No molestar si el usuario ya lo descartó antes en esta sesión
      if (!sessionStorage.getItem("xplorasg_instalar_descartado")) {
        setVisible(true);
      }
    }
    window.addEventListener("beforeinstallprompt", manejarPrompt);
    return () => window.removeEventListener("beforeinstallprompt", manejarPrompt);
  }, []);

  async function instalar() {
    if (!promptEvento) return;
    promptEvento.prompt();
    await promptEvento.userChoice;
    setVisible(false);
    setPromptEvento(null);
  }

  function descartar() {
    setVisible(false);
    sessionStorage.setItem("xplorasg_instalar_descartado", "1");
  }

  if (!visible) return null;

  return (
    <div className="instalar-app">
      <div className="contenedor instalar-app__interior">
        <p>📲 Instala XploraSG en tu celular para acceder más rápido, incluso sin conexión.</p>
        <div className="instalar-app__acciones">
          <button className="btn btn-primario" onClick={instalar}>Instalar</button>
          <button className="btn btn-secundario" onClick={descartar}>Ahora no</button>
        </div>
      </div>
    </div>
  );
}
