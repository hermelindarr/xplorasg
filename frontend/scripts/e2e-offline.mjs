import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';

// Verifica el modo sin conexión contra la app servida (PWA_BASE_URL) y la API real (API_URL).
// Los valores esperados se leen de la API, no se fijan: así la prueba vale para cualquier base de datos.
const baseUrl = process.env.PWA_BASE_URL || 'http://localhost:5173';
const apiUrl = process.env.API_URL || 'http://localhost:3000';
const outputDirectory = resolve(import.meta.dirname, '..', 'test-results');

const fetchJson = async (path) => {
  const response = await fetch(`${apiUrl}${path}`);
  assert.ok(response.ok, `La API respondió ${response.status} en ${path}`);
  return response.json();
};

// Las opciones "Todos/Todas" del filtro no vienen de la API, por eso se suma una.
const [municipios, categorias] = await Promise.all([
  fetchJson('/api/catalogo/municipios').then((body) => body.data),
  fetchJson('/api/catalogo/categorias').then((body) => body.data),
]);
const expectedMunicipios = municipios.length + 1;
const categoryNames = new Set(categorias.map((item) => item.nombre));

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
});
// El sitio elige idioma por el navegador: la verificación se hace en español (es-MX).
const context = await browser.newContext({ serviceWorkers: 'allow', locale: 'es-MX' });
const page = await context.newPage();

// Espera a que el filtro tenga los municipios de la API (no sólo el encabezado).
const waitForMunicipios = (expected) => page.waitForFunction(
  (count) => document.querySelectorAll('#municipality-filter option').length === count,
  expected,
  { timeout: 20_000 },
);

const categoryOptionsValid = async () => {
  const labels = await page.locator('#category-filter option').allInnerTexts();
  const [first, ...rest] = labels;
  assert.ok(rest.length >= 1, `El filtro de categorías sólo tiene ${labels.length} opción(es).`);
  for (const label of rest) {
    assert.ok(categoryNames.has(label), `La categoría "${label}" del filtro no existe en la API.`);
  }
  return { total: labels.length, first };
};

try {
  await page.goto(`${baseUrl}/explorar`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Lugares para conocer' }).waitFor();
  await waitForMunicipios(expectedMunicipios);
  const categoriesOnline = await categoryOptionsValid();

  // La segunda navegación garantiza que la página esté controlada por el Service Worker recién instalado.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20_000 });
  await waitForMunicipios(expectedMunicipios);

  const cachedEntries = await page.evaluate(async () => new Promise((resolveCount, reject) => {
    const request = indexedDB.open('xplorasg-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction('catalog-responses', 'readonly');
      const countRequest = transaction.objectStore('catalog-responses').count();
      countRequest.onsuccess = () => resolveCount(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    };
  }));
  assert.ok(Number(cachedEntries) >= 3, `Se esperaban al menos 3 respuestas locales; se encontraron ${cachedEntries}.`);

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Lugares para conocer' }).waitFor();
  // Sólo el indicador visible en esta ventana (en escritorio el de lg; en móvil el sr-only no cuenta).
  await page.getByRole('status').filter({ hasText: 'Sin conexión', visible: true }).first().waitFor({ timeout: 20_000 });
  await waitForMunicipios(expectedMunicipios);
  const categoriesOffline = await categoryOptionsValid();
  assert.equal(categoriesOffline.total, categoriesOnline.total, 'Las categorías sin conexión no coinciden con las de la visita en línea.');
  const cards = await page.locator('a[href^="/lugares/"]').count();
  assert.ok(cards > 0, 'Sin conexión no se muestra ninguna tarjeta de lugar desde la caché.');

  await page.goto(`${baseUrl}/mapa`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Mapa de la Sierra Gorda' }).waitFor();
  await page.waitForFunction(
    (count) => document.querySelectorAll('#map-municipality option').length === count,
    expectedMunicipios,
    { timeout: 20_000 },
  );

  await mkdir(outputDirectory, { recursive: true });
  await page.screenshot({ path: resolve(outputDirectory, 'pwa-offline.png'), fullPage: true });
  console.log(`PWA offline verificada: ${cachedEntries} respuestas en caché, ${expectedMunicipios} municipios, ${cards} tarjetas sin conexión, navegación /explorar → /mapa sin red.`);
} finally {
  await context.setOffline(false).catch(() => undefined);
  await browser.close();
}
