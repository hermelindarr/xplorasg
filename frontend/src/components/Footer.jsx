import logo from "../assets/logo-xplorasg-transparente.png";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor footer__interior">
        <div className="footer__marca">
          <img src={logo} alt="XploraSG" className="footer__logo" />
          <p className="footer__slogan">Explora. Conecta. Vive la Sierra Gorda.</p>
        </div>
        <div className="footer__col">
          <h4>Contacto</h4>
          <a href="mailto:xplora.sg8@gmail.com">xplora.sg8@gmail.com</a>
        </div>
        <div className="footer__col">
          <h4>Proyecto</h4>
          <p>Turismo Digital Inteligente — Sierra Gorda de Querétaro</p>
        </div>
      </div>
      <p className="footer__legal">© {new Date().getFullYear()} XploraSG — Proyecto académico. Datos marcados como DEMO son ficticios.</p>
    </footer>
  );
}
