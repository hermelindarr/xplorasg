// Construye el enlace "Reservar / Contactar" por WhatsApp.
// Sólo se usa el teléfono real escrito en el contacto del servicio. Si no hay uno
// confiable, no se ofrece WhatsApp: nunca se redirige al turista a un número ajeno.

const PHONE_PATTERN = /(?:\+?52[\s.-]?)?(?:\(?\d{2,3}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4}/;

export const whatsappNumberFrom = (contacto: string | null | undefined): string | null => {
  const match = contacto?.match(PHONE_PATTERN);
  const digits = match?.[0].replace(/\D/g, '') ?? '';
  if (digits.length === 10) return `52${digits}`;
  if (digits.length === 12 && digits.startsWith('52')) return digits;
  return null;
};

export const hasRealPhone = (contacto: string | null | undefined): boolean => {
  // Un número marcado como aproximado o sin confirmar no se usa para reservar.
  if (!contacto || /aproximad|sin confirmar|por confirmar/i.test(contacto)) return false;
  const digits = contacto?.match(PHONE_PATTERN)?.[0].replace(/\D/g, '') ?? '';
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('52'));
};

export const buildWhatsappUrl = (serviceName: string, contacto: string | null | undefined, lang: 'es' | 'en' = 'es'): string | null => {
  const number = hasRealPhone(contacto) ? whatsappNumberFrom(contacto) : null;
  if (!number) return null;
  const spanish = `Hola, vi "${serviceName}" en XploraSG y me gustaría información para reservar.`;
  // Los prestadores hablan español: al turista extranjero se le prepara un mensaje bilingüe.
  const message = lang === 'en'
    ? `Hello! I saw "${serviceName}" on XploraSG and I'd like booking information.\n\n(${spanish} Escribo en inglés.)`
    : spanish;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};
