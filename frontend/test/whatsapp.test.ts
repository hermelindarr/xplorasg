import { describe, expect, it } from 'vitest';
import { buildWhatsappUrl, hasRealPhone, whatsappNumberFrom } from '../src/utils/whatsapp';

// Números de prueba ficticios (no son de ningún negocio real).
describe('WhatsApp de servicios', () => {
  it('convierte un teléfono de 10 dígitos al formato internacional', () => {
    expect(whatsappNumberFrom('Tel: 555 000 1234')).toBe('525550001234');
  });

  it('acepta un número que ya trae +52', () => {
    expect(whatsappNumberFrom('WhatsApp: +52 555 000 1234')).toBe('525550001234');
  });

  it('no usa números marcados como aproximados o sin confirmar', () => {
    expect(hasRealPhone('WhatsApp: +52 555 000 1234 (Aproximado)')).toBe(false);
    expect(hasRealPhone('Tel. 555 000 1234 por confirmar')).toBe(false);
  });

  it('no ofrece enlace si no hay teléfono', () => {
    expect(buildWhatsappUrl('Hotel de prueba', 'Atención directa en mostrador.')).toBeNull();
    expect(buildWhatsappUrl('Hotel de prueba', null)).toBeNull();
  });

  it('genera el enlace con el mensaje codificado, en español y en inglés', () => {
    const es = buildWhatsappUrl('Cabañas de prueba', 'Tel: 555 000 1234', 'es');
    expect(es).toMatch(/^https:\/\/wa\.me\/525550001234\?text=/);
    expect(decodeURIComponent(es!.split('text=')[1])).toContain('"Cabañas de prueba"');

    const en = buildWhatsappUrl('Cabañas de prueba', 'Tel: 555 000 1234', 'en');
    expect(decodeURIComponent(en!.split('text=')[1])).toContain("I'd like booking information");
  });
});
