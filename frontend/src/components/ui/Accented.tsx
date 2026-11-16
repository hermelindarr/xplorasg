// Acento editorial: la única pieza que pone un fragmento de un titular en cursiva serif.
// El fragmento se elige a mano en cada idioma (clave `…Accent` de los mensajes); nunca se calcula
// contando palabras. Si el fragmento no aparece en el texto, el titular se muestra sin acento.

export const Accented = ({ text, accent }: { text: string; accent?: string }) => {
  const at = accent ? text.lastIndexOf(accent) : -1;
  if (!accent || at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <em className="accent">{accent}</em>
      {text.slice(at + accent.length)}
    </>
  );
};
