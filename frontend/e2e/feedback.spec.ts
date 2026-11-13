import { expect, test } from '@playwright/test';
import { mockApi } from './fixtures';

test.describe('Validación y aspectos legales', () => {
  test('la encuesta exige las preguntas obligatorias y envía las respuestas', async ({ page }) => {
    await mockApi(page);
    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/encuesta', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { data: { ok: true } } });
    });
    await page.goto('/encuesta');
    await page.getByRole('button', { name: 'Enviar respuestas' }).click();
    await expect(page.getByRole('alert')).toContainText('Responde las tres calificaciones');

    for (const group of ['satisfecho', 'fácil', 'útil']) {
      await page.getByRole('radiogroup', { name: new RegExp(group) }).getByRole('radio', { name: '5' }).click();
    }
    await page.getByRole('button', { name: 'Sí', exact: true }).click();
    await page.getByLabel(/Con otros medios/).fill('30');
    await page.getByLabel('Con XploraSG', { exact: true }).fill('10');
    await page.getByRole('button', { name: 'Enviar respuestas' }).click();

    await expect(page.getByRole('heading', { name: '¡Gracias por tu tiempo!' })).toBeVisible();
    expect(payload).toMatchObject({ satisfaccion: 5, facilidad: 5, utilidad: 5, recomendaria: true, minutos_otros_medios: 30, minutos_xplorasg: 10, otra_persona: false });
    expect(String((payload as Record<string, unknown> | null)?.dispositivo ?? '')).toMatch(/^[A-Za-z0-9-]{8,64}$/);
  });

  test('una segunda respuesta desde el mismo dispositivo pide confirmar que es otra persona', async ({ page }) => {
    await mockApi(page);
    let payload: Record<string, unknown> | null = null;
    await page.route('**/api/encuesta', async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { data: { ok: true } } });
    });
    await page.addInitScript(() => localStorage.setItem('xplora:encuestaRespondida', '2026-11-10T10:00:00Z'));
    await page.goto('/encuesta');
    for (const group of ['satisfecho', 'fácil', 'útil']) {
      await page.getByRole('radiogroup', { name: new RegExp(group) }).getByRole('radio', { name: '4' }).click();
    }
    await page.getByRole('button', { name: 'Sí', exact: true }).click();
    await page.getByRole('button', { name: 'Enviar respuestas' }).click();
    await expect(page.getByRole('alert')).toContainText('Confirma que eres otra persona');
    expect(payload).toBeNull();
    await page.getByLabel(/Soy otra persona/).check();
    await page.getByRole('button', { name: 'Enviar respuestas' }).click();
    await expect(page.getByRole('heading', { name: '¡Gracias por tu tiempo!' })).toBeVisible();
    expect(payload).toMatchObject({ otra_persona: true });
  });

  test('las promociones de demostración se marcan como ejemplo', async ({ page }) => {
    await mockApi(page);
    const base = { descripcion: 'Desc', condiciones: null, fecha_inicio: '2026-11-01T00:00:00Z', fecha_fin: '2026-12-31T00:00:00Z' };
    await page.route('**/api/agenda/promociones**', (route) => route.fulfill({ json: { data: [
      { ...base, id: 1, titulo: 'Tarifa grupal', servicio_nombre: null, servicio_slug: null, prestador_nombre: 'XploraSG (demostración)', es_ejemplo: true },
      { ...base, id: 2, titulo: 'Noche extra', servicio_nombre: 'Hotel Uno', servicio_slug: 'hotel-uno', prestador_nombre: 'Hoteles', es_ejemplo: false },
    ], pagination: { page: 1, limit: 12, total: 2 } } }));
    await page.goto('/agenda');
    await page.getByRole('tab', { name: 'Promociones' }).click();
    const sample = page.locator('article').filter({ hasText: 'Tarifa grupal' });
    await expect(sample.getByText('Ejemplo', { exact: true })).toBeVisible();
    await expect(sample.getByRole('note')).toContainText('no es una oferta real');
    const real = page.locator('article').filter({ hasText: 'Noche extra' });
    await expect(real.getByText('Promoción', { exact: true })).toBeVisible();
    await expect(real.getByRole('link', { name: /Ver prestador/ })).toBeVisible();
  });

  test('el aviso de privacidad y los términos están enlazados en el pie de página', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Información legal' }).getByRole('link', { name: 'Aviso de privacidad' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Aviso de privacidad' })).toBeVisible();
    await expect(page).toHaveTitle(/Aviso de privacidad integral \| XploraSG/);
  });

  test('el registro exige aceptar el aviso de privacidad', async ({ page }) => {
    await mockApi(page);
    await page.goto('/login');
    await page.getByRole('button', { name: /Regístrate gratis/ }).click();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Aviso de privacidad' }).first()).toHaveAttribute('href', '/privacidad');
  });

  test('la administración de la agenda está protegida', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin/agenda');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Sobre nosotros y pie de página', () => {
  test('la página del equipo muestra el título, la foto y el contacto', async ({ page }) => {
    await mockApi(page);
    await page.goto('/nosotros');
    await expect(page.getByRole('heading', { level: 1, name: 'Conoce al equipo detrás de XploraSG' })).toBeVisible();
    await expect(page.getByRole('img', { name: /equipo de XploraSG/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /xplora\.sg8@gmail\.com/ }).first()).toHaveAttribute('href', 'mailto:xplora.sg8@gmail.com');
  });

  test('el pie de página enlaza las redes oficiales y los documentos legales', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    const social = page.getByRole('list', { name: 'Redes sociales de XploraSG' });
    await expect(social.getByRole('link')).toHaveCount(4);
    await expect(social.getByRole('link', { name: /Facebook/ })).toHaveAttribute('href', 'https://www.facebook.com/share/1DRcqPuP9Q/');
    await expect(social.getByRole('link', { name: /YouTube/ })).toHaveAttribute('href', /UCW3n3WEBrPR1J-xJjyHm6EQ/);
    await expect(social.getByRole('link', { name: /TikTok/ })).toHaveAttribute('href', /@xplora\.sg/);
    await expect(social.getByRole('link', { name: /Instagram/ })).toHaveAttribute('target', '_blank');
    const legal = page.getByRole('navigation', { name: 'Información legal' });
    await expect(legal.getByRole('link', { name: 'Términos de uso' })).toHaveAttribute('href', '/terminos');
    await expect(legal.getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/privacidad');
  });
});
