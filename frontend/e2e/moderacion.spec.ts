import { expect, test, type Page } from '@playwright/test';
import { mockApi } from './fixtures';

// Flujo de moderación: el prestador envía (nada se publica solo) y el administrador decide.
// Corre en modo desarrollo (sin Supabase): la sesión se restaura con el token local y /api/auth/me.

const fakeToken = (sub: string) => `x.${Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.y`;

const signIn = async (page: Page, rol: 'prestador' | 'administrador') => {
  const user = { id: `u-${rol}`, email: `${rol}@test.mx`, nombre: rol === 'prestador' ? 'Lucía Prestadora' : 'Ana Admin', rol };
  await page.addInitScript(([token]) => {
    localStorage.setItem('token', token);
    localStorage.setItem('xplora:lastActivity', String(Date.now()));
  }, [fakeToken(user.id)]);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { user } }));
  await page.route('**/api/favoritos**', (route) => route.fulfill({ json: { data: [] } }));
};

const service = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  prestador_id: 1,
  nombre: 'Cabañas El Río',
  slug: 'cabanas-el-rio',
  descripcion: 'Cabañas de madera junto al río con desayuno serrano y fogata por la noche.',
  horario: '9 a 18 h',
  rango_precio: 'Desde $900 por noche',
  contacto: 'WhatsApp 441 123 4567',
  reservacion: 'Por WhatsApp',
  tipo_servicio: 'Cabañas',
  estado_aprobacion: 'aprobado',
  motivo_revision: null,
  cambios_propuestos: null,
  cambios_enviados_at: null,
  municipio: 'Jalpan de Serra',
  categoria: 'Hospedaje',
  updated_at: '2026-11-10T12:00:00Z',
  ...overrides,
});

const business = (services: unknown[]) => ({
  data: {
    prestadores: [{ id: 1, nombre_comercial: 'Cabañas El Río', descripcion: null, telefono: '4411234567', correo: null, estado_aprobacion: 'aprobado' }],
    servicios: services,
    promociones: [],
  },
});

test.describe('Prestador: todo lo que envía queda en espera de validación', () => {
  test('registrar un servicio valida los campos y confirma que espera revisión', async ({ page }) => {
    await mockApi(page);
    await signIn(page, 'prestador');
    let sent: Record<string, unknown> | null = null;
    await page.route('**/api/prestador/mi-negocio', (route) => route.fulfill({ json: business([service()]) }));
    await page.route('**/api/prestador/servicios', async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({ status: 201, json: { data: { id: 8, nombre: 'Tours El Chuveje', estado_aprobacion: 'en_revision', pendiente: true }, message: 'Tu solicitud quedó en espera de validación. El equipo de XploraSG la revisará antes de publicarla.' } });
    });

    await page.goto('/mi-negocio');
    await page.getByRole('button', { name: 'Registrar un servicio' }).click();
    const form = page.getByRole('form', { name: 'Registrar un servicio' });

    // Validación antes de enviar: no se llama al servidor.
    await form.getByRole('button', { name: 'Enviar a revisión' }).click();
    await expect(form.getByText('Escribe el nombre del servicio (mínimo 3 letras).')).toBeVisible();
    await expect(form.getByText('Elige el municipio donde está tu servicio.')).toBeVisible();
    expect(sent).toBeNull();

    await form.getByLabel('Nombre del servicio').fill('Tours El Chuveje');
    await form.getByLabel('Municipio').selectOption({ label: 'Jalpan de Serra' });
    await form.getByLabel('Categoría').selectOption({ label: 'Naturaleza' });
    await form.getByLabel('Descripción').fill('Recorridos guiados a la cascada El Chuveje con guías de la comunidad.');
    await form.getByLabel('Contacto (teléfono / WhatsApp)').fill('441 555 0101');
    await form.getByRole('button', { name: 'Enviar a revisión' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'en espera de validación' })).toBeVisible();
    expect(sent).toMatchObject({ nombre: 'Tours El Chuveje', municipio_id: 1, categoria_id: 1 });
    expect(sent).not.toHaveProperty('estado_aprobacion');
  });

  test('editar un servicio publicado no cambia la ficha pública: queda como propuesta', async ({ page }) => {
    await mockApi(page);
    await signIn(page, 'prestador');
    let patched: Record<string, unknown> | null = null;
    let current = service();
    await page.route('**/api/prestador/mi-negocio', (route) => route.fulfill({ json: business([current]) }));
    await page.route('**/api/prestador/servicios/7', async (route) => {
      patched = route.request().postDataJSON();
      current = service({ cambios_propuestos: patched, cambios_enviados_at: new Date().toISOString() });
      await route.fulfill({ json: { data: { id: 7, estado_aprobacion: 'aprobado', pendiente: true }, message: 'Tu solicitud quedó en espera de validación. El equipo de XploraSG la revisará antes de publicarla.' } });
    });

    await page.goto('/mi-negocio');
    await page.getByLabel('Horario').fill('8 a 20 h');
    await page.getByRole('button', { name: 'Enviar a revisión' }).first().click();

    // Sólo se envía lo que cambió, y el panel avisa que la versión publicada sigue visible.
    expect(patched).toEqual({ horario: '8 a 20 h' });
    await expect(page.getByText('Tienes cambios en espera de validación')).toBeVisible();
    await expect(page.getByText('(cambio pendiente)')).toBeVisible();
  });
});

const queue = [
  {
    tipo: 'servicio', solicitud: 'cambios', id: 7, nombre: 'Cabañas El Río', slug: 'cabanas-el-rio', estado: 'aprobado',
    prestador: 'Cabañas El Río', municipio: 'Jalpan de Serra', categoria: 'Hospedaje', enviadoAt: '2026-11-15T10:00:00Z',
    motivoRevision: null, faltantes: [], cambios: [{ campo: 'horario', actual: '9 a 18 h', propuesto: '8 a 20 h' }],
  },
  {
    tipo: 'servicio', solicitud: 'nuevo', id: 8, nombre: 'Tours El Chuveje', slug: 'tours-el-chuveje', estado: 'en_revision',
    prestador: 'Ecotours Pinal', municipio: 'Pinal de Amoles', categoria: 'Naturaleza', enviadoAt: '2026-11-16T10:00:00Z',
    motivoRevision: null, faltantes: ['fuente de verificación'], cambios: [],
  },
];

test.describe('Administrador: bandeja de moderación y reportes', () => {
  test('aprobar cambios, rechazar con motivo y eliminar con confirmación', async ({ page }) => {
    await mockApi(page);
    await signIn(page, 'administrador');
    const calls: string[] = [];
    await page.route('**/api/admin/moderacion', (route) => route.fulfill({ json: { data: queue } }));
    await page.route('**/api/admin/moderacion/*/*/*', async (route) => {
      calls.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      if (route.request().url().endsWith('/rechazar')) expect(route.request().postDataJSON()).toEqual({ motivo: 'Falta la fuente oficial' });
      await route.fulfill({ json: { data: { id: 1 } } });
    });
    await page.route('**/api/admin/contenido/*/*', async (route) => {
      calls.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      await route.fulfill({ json: { data: { id: 8, eliminado: true } } });
    });

    await page.goto('/admin/moderacion');
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes pendientes' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cambios a servicios 1/ })).toBeVisible();

    // Cambios: se ve lo publicado contra lo propuesto y se aprueba.
    await page.getByRole('row', { name: /Cabañas El Río/ }).getByRole('button', { name: 'Revisar' }).click();
    await expect(page.getByRole('cell', { name: '9 a 18 h', exact: true })).toBeVisible();
    await expect(page.getByRole('cell', { name: '8 a 20 h', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Aprobar y publicar cambios' }).click();
    await expect(page.getByText('Se publicaron los cambios de “Cabañas El Río”.')).toBeVisible();

    // Rechazar exige motivo en el modal.
    await page.getByRole('row', { name: /Tours El Chuveje/ }).getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Rechazar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '¿Rechazar la solicitud?' });
    await expect(dialog.getByRole('button', { name: 'Rechazar' })).toBeDisabled();
    await dialog.getByLabel(/Motivo/).fill('Falta la fuente oficial');
    await dialog.getByRole('button', { name: 'Rechazar' }).click();
    await expect(page.getByText('“Tours El Chuveje” se rechazó. El prestador verá el motivo.')).toBeVisible();

    // Eliminar pide confirmación explícita.
    await page.getByRole('row', { name: /Tours El Chuveje/ }).getByRole('button', { name: 'Revisar' }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.getByRole('dialog', { name: /Eliminar definitivamente/ }).getByRole('button', { name: 'Eliminar' }).click();
    await expect(page.getByText('“Tours El Chuveje” se eliminó.')).toBeVisible();

    expect(calls).toEqual([
      'POST /api/admin/moderacion/servicio/7/aprobar',
      'POST /api/admin/moderacion/servicio/8/rechazar',
      'DELETE /api/admin/contenido/servicio/8',
    ]);
  });

  test('exporta el reporte en Excel y CSV', async ({ page }) => {
    await mockApi(page);
    await signIn(page, 'administrador');
    await page.route('**/api/admin/**', (route) => route.fulfill({ json: { data: [] } }));
    await page.route('**/api/admin/estadisticas', (route) => route.fulfill({ json: { data: { totales: { lugares: 1, servicios: 1, prestadores: 1, eventos_proximos: 0, promociones_activas: 0, promociones_pendientes: 0, usuarios: 3, favoritos: 0, lugares_sin_coordenadas: 0 }, porMunicipio: [], porCategoria: [], topFavoritos: [], usuariosPorRol: [], generadoEn: new Date().toISOString() } } }));
    await page.route('**/api/admin/reportes', (route) => route.fulfill({ json: { data: {
      generadoEn: new Date().toISOString(),
      actividad: { usuarios: 3, favoritos: 0, promociones_activas: 0, eventos_proximos: 0, solicitudes_pendientes: 2 },
      prestadores: [{ prestador: 'Cabañas El Río', estado: 'aprobado', servicios: 1, publicados: 1, pendientes: 1 }],
      lugares: [{ nombre: 'Cañón del Paraíso', municipio: 'Peñamiller', categoria: 'Naturaleza', estado: 'aprobado', con_coordenadas: true, favoritos: 0 }],
      servicios: [], municipios: [{ municipio: 'Jalpan de Serra', lugares: 4, lugares_publicados: 4, servicios: 3, servicios_publicados: 2 }],
    } } }));

    await page.goto('/admin');
    await page.locator('#reportes').scrollIntoViewIfNeeded();
    const [xlsx] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#reportes').getByRole('listitem').filter({ hasText: 'Excel (.xlsx)' }).getByRole('button', { name: 'Descargar' }).click(),
    ]);
    expect(xlsx.suggestedFilename()).toMatch(/^xplorasg-reporte-\d{4}-\d{2}-\d{2}\.xlsx$/);

    const [csv] = await Promise.all([page.waitForEvent('download'), page.locator('#reportes').getByRole('button', { name: /^Prestadores/ }).click()]);
    expect(csv.suggestedFilename()).toMatch(/^xplorasg-prestadores-.*\.csv$/);
    const body = await (await csv.createReadStream())!.toArray();
    expect(Buffer.concat(body).toString('utf8')).toContain('Cabañas El Río,Publicado');
  });
});
