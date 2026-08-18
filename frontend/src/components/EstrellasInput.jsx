import { useState } from "react";
import "./EstrellasInput.css";

export default function EstrellasInput({ valor, onChange }) {
  const [hover, setHover] = useState(0);

  return (
    <div className="estrellas-input" role="radiogroup" aria-label="Calificación de 1 a 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={`estrellas-input__estrella ${n <= (hover || valor) ? "activa" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
