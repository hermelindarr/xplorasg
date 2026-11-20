// Antes ponía un fragmento de cada titular en cursiva serif. Ese recurso se repetía en casi todos los
// títulos y hacía que el sitio pareciera plantilla, así que ahora el titular se muestra completo y parejo.
// Se conservan las props (`accent`, `accentClassName`, `stacked`) para no tocar cada página que lo usa.

interface AccentedProps {
  text: string;
  accent?: string;
  accentClassName?: string;
  stacked?: boolean;
}

export const Accented = ({ text }: AccentedProps) => <>{text}</>;
