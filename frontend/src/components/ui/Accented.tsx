// Acento editorial: la única pieza que pone un fragmento de un titular en cursiva serif.
// El fragmento se elige a mano en cada idioma (clave `…Accent` de los mensajes); nunca se calcula
// contando palabras. Si el fragmento no aparece en el texto, el titular se muestra sin acento.

interface AccentedProps {
  text: string;
  accent?: string;
  /** Clases extra para el fragmento acentuado (p. ej. otro color sobre fondo oscuro). */
  accentClassName?: string;
  /** Pone el texto previo y el acento en líneas separadas (titular de la portada). */
  stacked?: boolean;
}

export const Accented = ({ text, accent, accentClassName = '', stacked = false }: AccentedProps) => {
  const at = accent ? text.lastIndexOf(accent) : -1;
  if (!accent || at < 0) return <>{text}</>;
  const before = text.slice(0, at);
  const after = text.slice(at + accent.length);
  const block = stacked ? 'block ' : '';
  return (
    <>
      {stacked ? before.trim() && <span className="block">{before.trim()}</span> : before}
      <em className={`${block}accent ${accentClassName}`.trim()}>{accent}</em>
      {after}
    </>
  );
};
