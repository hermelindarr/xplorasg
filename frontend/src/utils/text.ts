// Convierte la frase de actividades de una ficha en etiquetas cortas.
// "Senderismo, fotografía y observación de aves." → ["Senderismo", "Fotografía", "Observación de aves"]
export const activityTags = (value: string | null | undefined, max = 3): string[] => {
  if (!value) return [];
  const parts = value
    .replace(/\.$/, '')
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  const last = parts.pop();
  if (last) {
    const match = last.match(/ (y|and) /);
    const index = match?.index ?? -1;
    if (match && index > 0) parts.push(last.slice(0, index), last.slice(index + match[0].length));
    else parts.push(last);
  }
  return parts
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .filter((part) => part.length > 2 && part.length < 48)
    .slice(0, max);
};

export const isClosedNotice = (value: string | null | undefined): boolean => /\b(cerrad[oa]|closed)\b/i.test(value ?? '');

const RULE_PATTERN = /\b(prohibid[oa]s?|no (se )?permit\w*|no nadar|no introducir|no (se )?admite\w*|prohibited|not allowed|no swimming|do not|don't)\b/i;

/** Oraciones de una ficha que prohíben algo (nadar, mascotas, alcohol…), en tipo oración. */
export const ruleSentences = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/(?<=[.;!])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => RULE_PATTERN.test(sentence))
    .map((sentence) => {
      // Lo escrito todo en mayúsculas se pasa a tipo oración; lo que va entre paréntesis se respeta.
      const fixed = sentence.replace(/[A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{2,})+/g, (caps) => caps.toLowerCase());
      return fixed.charAt(0).toUpperCase() + fixed.slice(1);
    });
};

/** Recomendaciones sin las oraciones que prohíben algo (ésas ya se muestran en el aviso). */
export const withoutRules = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const rest = value
    .split(/(?<=[.;!])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !RULE_PATTERN.test(sentence))
    .join(' ');
  return rest || null;
};
