import { expect, test } from '@playwright/test';
import { makePlace, mockApi } from './fixtures';

test.describe('Inicio', () => {
  test('muestra el perfil de altitud, el buscador y los prestadores con WhatsApp', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('metros');
    // Cada lugar es un punto del perfil, accesible con teclado y lector de pantalla.
    await expect(page.getByRole('button', { name: /Lugar de Prueba 1, Jalpan de Serra, a 1,200 metros/ })).toBeVisible();
    await expect(page.getByRole('search')).toBeVisible();
    // La portada es una selección curada: la lista completa de lugares vive en /explorar.
    await expect(page.locator('#lugares')).toHaveCount(0);

    const whatsapp = page.locator('#prestadores').getByRole('link', { name: /Reservar o contactar/ }).first();
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/524412960445\?text=/);
  });

  test('perfil en móvil: un toque elige el lugar más cercano y la lista de 44 px también', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApi(page);
    await page.goto('/');
    const figure = page.locator('figure');
    await figure.scrollIntoViewIfNeeded();
    const point = (name: string) => page.getByRole('button', { name: new RegExp(`^${name}, Jalpan de Serra`) });
    const center = async (name: string) => {
      const box = await point(name).locator('circle').boundingBox();
      return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
    };

    // Un clic a 20 px del punto lo elige sin abrir la ficha.
    const p2 = await center('Lugar de Prueba 2');
    await page.mouse.click(p2.x, p2.y - 20);
    await expect(point('Lugar de Prueba 2')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/$/);

    // La lista elige el lugar con botones de al menos 44 px.
    const rail = page.getByRole('group', { name: 'Lugares del perfil, de oeste a este' });
    const chip = rail.getByRole('button', { name: /Lugar de Prueba 3/ });
    expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(point('Lugar de Prueba 3')).toHaveAttribute('aria-pressed', 'true');

    // Un segundo toque sobre el lugar elegido abre su ficha.
    const p3 = await center('Lugar de Prueba 3');
    await page.mouse.click(p3.x, p3.y);
    await expect(page).toHaveURL(/\/lugares\/lugar-3$/);
  });

  test('Explorar lista todos los lugares con su altitud', async ({ page }) => {
    await mockApi(page);
    await page.goto('/explorar');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Sierra Gorda');
    const cards = page.locator('#lugares article');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText('1,200 m');
    await expect(cards.first().getByRole('link', { name: 'Lugar de Prueba 1' })).toHaveAttribute('href', '/lugares/lugar-1');
  });

  test('al buscar desde la portada aparecen los resultados', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByLabel('Buscar lugar').fill('cascada');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.locator('#lugares article').first()).toBeVisible();
  });

  test('el buscador envía el término al catálogo', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    const request = page.waitForRequest((req) => req.url().includes('/api/catalogo/lugares') && req.url().includes('q=cascada'));
    await page.getByLabel('Buscar lugar').fill('cascada');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await request;
  });

  test('"Ver todos los lugares" lleva la búsqueda de la portada a Explorar', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByLabel('Buscar lugar').fill('cascada');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    const request = page.waitForRequest((req) => new URL(req.url()).pathname.endsWith('/catalogo/lugares') && req.url().includes('q=cascada'));
    await page.locator('#lugares').getByRole('link', { name: 'Ver todos los lugares' }).click();
    await expect(page).toHaveURL(/\/explorar\?q=cascada$/);
    await request;
    await expect(page.getByLabel('Buscar lugar')).toHaveValue('cascada');
  });

  test('Explorar no carga la portada: sin hero, sin mosaico y sin prestadores', async ({ page }) => {
    await mockApi(page);
    await page.goto('/explorar');
    await expect(page.locator('#lugares article').first()).toBeVisible();
    await expect(page.locator('#prestadores')).toHaveCount(0);
    await expect(page.locator('#home-destinations')).toHaveCount(0);
  });

  test('paginación con "Cargar más"', async ({ page }) => {
    const first = Array.from({ length: 24 }, (_, index) => makePlace(index + 1));
    const second = Array.from({ length: 3 }, (_, index) => makePlace(index + 25));
    await mockApi(page, { places: first, pageTwo: second, total: 27 });
    await page.goto('/explorar');
    await expect(page.locator('#lugares article')).toHaveCount(24);
    const loadMore = page.getByRole('button', { name: 'Cargar más' });
    await loadMore.click();
    await expect(page.locator('#lugares article')).toHaveCount(27);
    await expect(loadMore).toBeHidden();
  });
});

test.describe('Favoritos anónimos', () => {
  test('guardar, ver, persistir y quitar un favorito', async ({ page }) => {
    await mockApi(page, { places: [makePlace(1, { nombre: 'Cascada E2E' })] });
    await page.goto('/explorar');

    const card = page.locator('#lugares article').filter({ hasText: 'Cascada E2E' });
    await card.getByRole('button', { name: 'Guardar en favoritos' }).click();
    await expect(card.getByRole('button', { name: 'Quitar de favoritos' })).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/favoritos');
    await expect(page.locator('article').filter({ hasText: 'Cascada E2E' })).toBeVisible();
    await page.reload();
    const favorite = page.locator('article').filter({ hasText: 'Cascada E2E' });
    await expect(favorite).toBeVisible();

    // El nombre del lugar es el enlace de la tarjeta.
    await favorite.getByRole('link', { name: 'Cascada E2E' }).click();
    const detailButton = page.getByRole('button', { name: 'Quitar de favoritos' });
    await expect(detailButton).toHaveAttribute('aria-pressed', 'true');
    await detailButton.click();
    await expect(page.getByRole('button', { name: 'Guardar en favoritos' })).toHaveAttribute('aria-pressed', 'false');

    await page.goto('/favoritos');
    await expect(page.locator('article').filter({ hasText: 'Cascada E2E' })).toHaveCount(0);
  });
});

test.describe('Seguridad y navegación', () => {
  test('un enlace directo a /admin sin sesión manda a iniciar sesión', async ({ page }) => {
    await mockApi(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  });

  test('barra de navegación inferior en móvil', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Sólo aplica en móvil');
    await mockApi(page);
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación móvil inferior' })).toBeVisible();
  });
});

test.describe('Mapa', () => {
  test('si el servicio de rutas falla, ofrece Google Maps sin romper el mapa', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.21, longitude: -99.47 });
    await mockApi(page, { places: [makePlace(1, { nombre: 'Mirador E2E' })] });
    await page.route('**/api/viaje/ruta', (route) => route.fulfill({ status: 503, json: { error: 'El servicio de rutas aún no tiene configurada su clave.' } }));

    await page.goto('/mapa');
    await page.getByRole('button', { name: /Usar mi ubicación/ }).click();
    await expect(page.getByText(/Ubicación encontrada/)).toBeVisible();
    await page.locator('.leaflet-marker-icon:has(.xplora-marker)').first().evaluate((element: HTMLElement) => element.click());
    await page.getByRole('button', { name: 'Preparar ruta' }).click();
    await page.getByRole('button', { name: 'Trazar ruta' }).click();

    await expect(page.getByText(/no está disponible por ahora/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('se elige el destino de una lista y la ruta pide la ubicación sola', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 21.21, longitude: -99.47 });
    await mockApi(page, { places: [makePlace(1, { nombre: 'Mirador E2E' }), makePlace(2, { nombre: 'Cascada E2E' })] });
    await page.route('**/api/viaje/ruta', (route) => route.fulfill({ status: 503, json: { error: 'El servicio de rutas aún no tiene configurada su clave.' } }));

    await page.goto('/mapa');
    const panelToggle = page.getByRole('button', { name: 'Filtros y ruta' });
    if (await panelToggle.isVisible()) await panelToggle.click();
    await page.getByLabel('¿A dónde quieres ir?').selectOption({ label: 'Cascada E2E · Jalpan de Serra' });
    await expect(page.getByText('Destino seleccionado')).toBeVisible();
    await page.getByRole('button', { name: /Trazar ruta/ }).click();

    await expect(page.getByText(/Ubicación encontrada/).first()).toBeVisible();
    await expect(page.getByText(/no está disponible por ahora/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir en Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
  });
});

test.describe('Asistente', () => {
  test('conversa y muestra referencias del catálogo', async ({ page }) => {
    await mockApi(page);
    await page.route('**/api/asistente/consulta', (route) => route.fulfill({
      json: { data: { respuesta: '⛪ Las misiones franciscanas son Patrimonio Mundial.', referencias: [{ tipo: 'lugar', id: 1, nombre: 'Misión de Jalpan', slug: 'lugar-1', municipio: 'Jalpan de Serra', resumen: null, distanciaKm: null }], sugerencias: ['¿Qué fiestas vienen?'], clima: null, modo: 'local', aviso: '' } },
    }));
    await page.goto('/asistente');
    await page.getByLabel('Escribe tu pregunta').fill('Quiero conocer las misiones');
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByText('Las misiones franciscanas son Patrimonio Mundial.')).toBeVisible();
    await expect(page.getByRole('link', { name: /Misión de Jalpan/ })).toHaveAttribute('href', '/lugares/lugar-1');
  });

  test('los accesos rápidos preguntan y las tarjetas traen acciones concretas', async ({ page }) => {
    await mockApi(page);
    let asked = '';
    await page.route('**/api/asistente/consulta', async (route) => {
      asked = JSON.parse(route.request().postData() || '{}').pregunta;
      await route.fulfill({
        json: { data: {
          respuesta: 'Ruta propuesta en la Sierra Gorda, en este orden:',
          referencias: [
            { tipo: 'lugar', id: 1, nombre: 'Cascada E2E', slug: 'cascada-e2e', municipio: 'Pinal de Amoles', resumen: 'Cascada.', distanciaKm: null, enMapa: true },
            { tipo: 'servicio', id: 7, nombre: 'Fonda E2E', slug: 'fonda-e2e', municipio: 'Jalpan de Serra', resumen: null, distanciaKm: null, contacto: 'Tel. 441 296 0445' },
          ],
          sugerencias: ['Comida cercana'], clima: null, modo: 'local', aviso: '',
        } },
      });
    });
    await page.goto('/asistente');
    await page.getByRole('button', { name: 'Ruta para hoy' }).click();
    await expect(page.getByText('Ruta propuesta en la Sierra Gorda')).toBeVisible();
    expect(asked).toBe('Ruta para hoy');
    await expect(page.getByRole('link', { name: 'Ver Cascada E2E en el mapa' })).toHaveAttribute('href', '/mapa?lugar=cascada-e2e');
    await expect(page.getByRole('button', { name: 'Guardar en favoritos' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contactar a Fonda E2E por WhatsApp' })).toHaveAttribute('href', /wa\.me\/524412960445/);
    await expect(page.getByRole('group', { name: 'Accesos rápidos' }).getByRole('button', { name: 'Comida cercana' })).toBeVisible();
  });

  test('sin conexión explica qué sigue disponible y si falla permite reintentar', async ({ page, context }) => {
    await mockApi(page);
    let calls = 0;
    await page.route('**/api/asistente/consulta', async (route) => {
      calls += 1;
      if (calls === 1) await route.fulfill({ status: 500, json: { error: 'No fue posible consultar el asistente en este momento.' } });
      else await route.fulfill({ json: { data: { respuesta: 'Listo, aquí va.', referencias: [], sugerencias: [], clima: null, modo: 'local', aviso: '' } } });
    });
    await page.goto('/asistente');
    await page.getByLabel('Escribe tu pregunta').fill('Quiero conocer las misiones');
    await page.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(page.getByRole('alert')).toContainText('No fue posible consultar');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText('Listo, aquí va.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);

    await context.setOffline(true);
    await expect(page.getByText('Chatboot necesita conexión para responder.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ir a Favoritos' })).toHaveAttribute('href', '/favoritos');
    await context.setOffline(false);
  });
});
