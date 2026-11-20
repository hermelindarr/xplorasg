const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  validateProviderService,
  mergeProposal,
  splitProposal,
  pickAdminFields,
  isAcceptableImageUrl,
  isUsableContact,
  slugify,
  ADMIN_SERVICE_FIELDS,
} = require('../dist/services/moderationService');

const longText = 'Cabañas de madera junto al río con desayuno serrano y fogata por la noche.';

test('un servicio nuevo exige nombre, municipio, tipo, descripción y contacto', () => {
  const { errors } = validateProviderService({}, { isNew: true });
  assert.deepEqual(Object.keys(errors).sort(), ['categoria_id', 'contacto', 'descripcion', 'municipio_id', 'nombre']);
});

test('un servicio nuevo válido pasa sin errores y conserva sólo los campos permitidos', () => {
  const { values, errors } = validateProviderService({
    nombre: '  Cabañas El Río  ',
    municipio_id: '3',
    categoria_id: 2,
    descripcion: longText,
    contacto: 'WhatsApp 441 123 4567',
    estado_aprobacion: 'aprobado', // intento de publicarse solo: se ignora
    prestador_id: 99,
  }, { isNew: true });
  assert.deepEqual(errors, {});
  assert.equal(values.nombre, 'Cabañas El Río');
  assert.equal(values.municipio_id, 3);
  assert.equal(values.categoria_id, 2);
  assert.equal('estado_aprobacion' in values, false);
});

test('descripción corta, contacto sin teléfono y foto no https se rechazan con mensajes claros', () => {
  const { errors } = validateProviderService({
    descripcion: 'Muy bonito',
    contacto: 'llámame',
    imagen_url: 'http://ejemplo.com/foto.jpg',
  }, { isNew: false });
  assert.match(errors.descripcion, /40 caracteres/);
  assert.match(errors.contacto, /10 dígitos/);
  assert.match(errors.imagen_url, /https/);
});

test('contactos y enlaces de foto aceptados', () => {
  assert.equal(isUsableContact('Tel. 441 296 0445'), true);
  assert.equal(isUsableContact('reservas@cabanas.mx'), true);
  assert.equal(isUsableContact('441 29'), false);
  assert.equal(isAcceptableImageUrl('https://midominio.mx/fotos/cabana.webp'), true);
  assert.equal(isAcceptableImageUrl('https://upload.wikimedia.org/wikipedia/commons/a/ab/Foto'), true);
  assert.equal(isAcceptableImageUrl('https://usuario:clave@sitio.mx/foto.jpg'), false);
  assert.equal(isAcceptableImageUrl('javascript:alert(1)'), false);
  assert.equal(isAcceptableImageUrl('https://sitio.mx/documento.pdf'), false);
});

test('la propuesta se une con la pendiente y descarta lo que ya está publicado igual', () => {
  const live = { descripcion: 'Igual', horario: '9 a 18 h', contacto: '4411234567' };
  const merged = mergeProposal({ horario: '8 a 20 h' }, { descripcion: 'Igual', contacto: '4419998888' }, live);
  assert.deepEqual(merged, { horario: '8 a 20 h', contacto: '4419998888' });
  // Volver al valor publicado retira ese campo de la propuesta; si no queda nada, no hay propuesta.
  assert.equal(mergeProposal({ horario: '8 a 20 h' }, { horario: '9 a 18 h' }, live), null);
});

test('al aprobar, la propuesta se divide en columnas del servicio y la foto', () => {
  const { columns, imageUrl } = splitProposal({ horario: '8 a 20 h', imagen_url: 'https://x.mx/a.jpg', nombre: 'no permitido' });
  assert.deepEqual(columns, { horario: '8 a 20 h' });
  assert.equal(imageUrl, 'https://x.mx/a.jpg');
  assert.deepEqual(splitProposal(null), { columns: {}, imageUrl: null });
});

test('el administrador sólo puede editar campos permitidos y el nombre no queda vacío', () => {
  const { values, errors } = pickAdminFields({ nombre: 'Ok', estado_aprobacion: 'aprobado', fuente_verificacion: 'Turismo Querétaro' }, ADMIN_SERVICE_FIELDS);
  assert.equal('estado_aprobacion' in values, false);
  assert.equal(values.fuente_verificacion, 'Turismo Querétaro');
  assert.match(errors.nombre, /3 caracteres/);
});

test('slug legible sin acentos', () => {
  assert.equal(slugify('Cabañas "El Río" — Jalpan'), 'cabanas-el-rio-jalpan');
  assert.equal(slugify('¡¡!!'), 'servicio');
});
