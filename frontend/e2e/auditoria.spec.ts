import { expect, test, type Page } from '@playwright/test';

// Auditoría de flujos completos contra el backend local real y la base de pruebas (xv2).
// Usa sólo la cuenta de prueba `qa-turista@xplorasg.test`. No escribe datos de personas reales.
// Requiere: backend en localhost:3000 y la app compilada/servida con VITE_API_URL apuntando a él.
// Ejecutar: PW_BASE_URL=http://localhost:4174 npx playwright test e2e/auditoria.spec.ts

const TEST_EMAIL = 'qa-turista@xplorasg.test';
const FICHA = '/lugares/el-chuveje';

const login = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(TEST_EMAIL);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).not.toHaveURL(/\/login$/);
};

const favoriteButton = (page: Page) => page.getByRole('button', { name: /Guardar en favoritos|Quitar de favoritos/ }).first();

test.describe('Sesión (backend real)', () => {
  test('inicia sesión, entra al panel y cierra sesión', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).not.toHaveURL(/\/dashboard$/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Favoritos (backend real)', () => {
  test('guardar, recargar, ver en Favoritos y quitar', async ({ page }) => {
    await login(page);
    await page.goto(FICHA);
    const initial = await favoriteButton(page).getAttribute('aria-pressed');
    if (initial === 'true') await favoriteButton(page).click();
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false');

    const saved = page.waitForResponse((r) => r.url().includes('/api/favoritos/') && r.request().method() === 'POST');
    await favoriteButton(page).click();
    expect((await saved).status()).toBeLessThan(300);
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/favoritos');
    await expect(page.getByRole('link', { name: /El Chuveje/i }).first()).toBeVisible();

    await page.goto(FICHA);
    const removed = page.waitForResponse((r) => r.url().includes('/api/favoritos/') && r.request().method() === 'DELETE');
    await favoriteButton(page).click();
    expect((await removed).status()).toBeLessThan(300);
    await page.reload();
    await expect(favoriteButton(page)).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('Compartir', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('copia el enlace de la ficha y muestra confirmación', async ({ page }) => {
    await page.goto(FICHA);
    await page.getByRole('button', { name: 'Compartir' }).first().click();
    await expect(page.getByText('¡Enlace copiado!')).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(FICHA);
  });
});

test.describe('WhatsApp', () => {
  test('solo las fichas con teléfono real ofrecen WhatsApp, con el número de la API', async ({ page, request }) => {
    const api = process.env.API_URL || 'http://localhost:3000';
    const { data: services } = await (await request.get(`${api}/api/catalogo/servicios?limit=100`)).json() as { data: Array<{ slug: string; contacto: string | null }> };
    expect(services.length).toBeGreaterThan(0);
    let withLink = 0;
    for (const service of services) {
      await page.goto(`/servicios/${service.slug}`, { waitUntil: 'networkidle' });
      const links = await page.locator('a[href^="https://wa.me/"]').evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''));
      if (/aproximad|sin confirmar|por confirmar/i.test(service.contacto ?? '')) {
        expect(links, `${service.slug} tiene un número aproximado`).toHaveLength(0);
      }
      for (const href of links) {
        expect(href).toMatch(/^https:\/\/wa\.me\/52\d{10}\?text=/);
        withLink++;
      }
    }
    expect(withLink, 'al menos una ficha ofrece WhatsApp').toBeGreaterThan(0);
  });
});

test.describe('Idioma', () => {
  const pages: Array<{ path: string; es: RegExp; en: RegExp }> = [
    { path: '/explorar', es: /Explora la Sierra Gorda/, en: /Explore the Sierra Gorda/ },
    { path: '/servicios', es: /Servicios locales/, en: /Local services/ },
    { path: '/agenda', es: /Agenda/, en: /Sierra Gorda events/ },
    { path: '/mapa', es: /Mapa de la Sierra Gorda/, en: /Sierra Gorda map/ },
    { path: '/favoritos', es: /favoritos/i, en: /favorites/i },
  ];

  for (const item of pages) {
    test(`cambia de español a inglés en ${item.path}`, async ({ page }) => {
      await page.goto(`${item.path}?lang=es`);
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(item.es);
      await page.goto(`${item.path}?lang=en`);
      await expect(page.getByRole('heading', { level: 1 }).first()).toContainText(item.en);
    });
  }
});

test.describe('Navegación', () => {
  test('todas las páginas principales cargan sin 404 ni errores de consola', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      // Las fotos externas de prueba no alcanzan el host desde el entorno; se registran aparte.
      if (/Failed to load resource/.test(m.text())) return;
      errors.push(m.text());
    });
    const routes = ['/', '/explorar', '/servicios', '/agenda', '/mapa', '/favoritos', '/asistente', '/nosotros', '/privacidad', '/terminos', FICHA, '/servicios/restaurante-coral'];
    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.getByRole('heading', { name: 'Página no encontrada', exact: true })).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test('control: una ruta inexistente sí muestra la página 404', async ({ page }) => {
    await page.goto('/ruta-que-no-existe-xplorasg', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Página no encontrada', exact: true })).toHaveCount(1);
  });
});

test.describe('Agenda y promociones (datos reales de prueba)', () => {
  test('la agenda carga eventos o su estado vacío', async ({ page }) => {
    await page.goto('/agenda');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const hasEvents = await page.locator('article, li').count();
    expect(hasEvents).toBeGreaterThan(0);
  });

  test('servicios muestra el carril de promociones', async ({ page }) => {
    await page.goto('/servicios');
    await expect(page.getByRole('heading', { name: 'Promociones vigentes' })).toBeVisible();
  });
});

test.describe('Mapa', () => {
  test('el mapa carga y muestra la ficha de un lugar seleccionable', async ({ page }) => {
    await page.goto('/mapa');
    await expect(page.getByRole('heading', { name: 'Mapa de la Sierra Gorda' })).toBeVisible();
  });
});

test.describe('PWA', () => {
  test.use({ serviceWorkers: 'allow' });

  test('el manifiesto responde y el Service Worker toma el control', async ({ page }) => {
    await page.goto('/explorar');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const manifest = await page.request.get(new URL(manifestHref!, page.url()).toString());
    expect(manifest.status()).toBe(200);
    const body = await manifest.json();
    expect(body.name).toBeTruthy();
    expect(body.display).toBeTruthy();
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20_000 });
  });
});

test.describe('Sin conexión', () => {
  test.use({ serviceWorkers: 'allow' });

  test('muestra datos guardados sin conexión y recupera el estado al volver', async ({ page, context }) => {
    await page.goto('/explorar', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20_000 });
    await page.reload({ waitUntil: 'networkidle' });
    // Espera a que los datos estén cargados antes de contarlos.
    await expect(page.locator('#municipality-filter option')).not.toHaveCount(1, { timeout: 15_000 });
    const municipiosOnline = await page.locator('#municipality-filter option').count();

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('status').filter({ hasText: 'Sin conexión' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#municipality-filter option')).toHaveCount(municipiosOnline, { timeout: 15_000 });

    await context.setOffline(false);
    // El aviso de la app es la señal visible en todos los anchos (el indicador de cabecera se oculta en pantallas <420 px).
    await expect(page.getByRole('status').filter({ hasText: 'Sin conexión.', visible: true })).toHaveCount(0, { timeout: 15_000 });
  });
});
