const test = require('node:test');
const assert = require('node:assert/strict');
const { runAssistantEngine, detectIntents, detectMunicipality, weatherMood } = require('../dist/services/assistantEngine');

const base = { tipo: 'lugar', slug: null, actividades: null, horarios: null, contacto: null, precio: null, latitud: null, longitud: null };
const items = [
  { ...base, id: 1, nombre: 'Cascada El Chuveje', municipio: 'Pinal de Amoles', categoria: 'Naturaleza', descripcion: 'Cascada en el bosque.' },
  { ...base, id: 2, nombre: 'Misión de Santiago Apóstol de Jalpan', municipio: 'Jalpan de Serra', categoria: 'Cultura y Arqueología', descripcion: 'Misión franciscana.' },
  { ...base, id: 3, nombre: 'Zona Arqueológica de Ranas', municipio: 'San Joaquín', categoria: 'Cultura y Arqueología', descripcion: 'Sitio prehispánico.', horarios: 'CERRADO al público hasta nuevo aviso.' },
  { ...base, id: 4, tipo: 'servicio', nombre: 'Hotel Misión Jalpan', municipio: 'Jalpan de Serra', categoria: 'Hospedaje', descripcion: 'Hotel colonial.', contacto: 'Tel. 441 296 0445', precio: 'Desde $1,800' },
];
const municipalities = ['Jalpan de Serra', 'Pinal de Amoles', 'San Joaquín'];
const rain = { municipio: 'Jalpan de Serra', temperatura: 18, condicion: 'Lluvia moderada', codigo: 63, maxima: 22, minima: 15, probabilidadLluvia: 80 };
const run = (question, extra = {}) => runAssistantEngine({ question, items, municipalities, weather: null, events: [], origin: null, firstMessage: false, ...extra });

test('detecta intenciones y municipios con alias', () => {
  assert.ok(detectIntents('¿Dónde me hospedo?').includes('hospedaje'));
  assert.equal(detectMunicipality('algo en landa', ['Landa de Matamoros']), 'Landa de Matamoros');
});

test('con lluvia prioriza planes culturales y advierte sobre cascadas', () => {
  assert.equal(weatherMood(rain), 'lluvia');
  const result = run('¿Qué hago hoy según el clima?', { weather: rain });
  assert.match(result.respuesta, /lluvia/i);
  assert.equal(result.referencias[0].nombre, 'Misión de Santiago Apóstol de Jalpan');
});

test('nunca recomienda lugares cerrados y avisa del cierre', () => {
  const result = run('¿Puedo visitar la zona arqueológica de Ranas?');
  assert.ok(!result.referencias.some((item) => item.id === 3));
  assert.match(result.respuesta, /cerrado temporalmente/i);
});

test('filtra hospedaje por municipio e incluye contacto', () => {
  const result = run('¿Dónde me hospedo en Jalpan?');
  assert.deepEqual(result.referencias.map((item) => item.id), [4]);
  assert.match(result.respuesta, /441 296 0445/);
});

test('saluda en el primer mensaje', () => {
  assert.match(run('Hola', { firstMessage: true }).respuesta, /Soy Chatboot, la guía de XploraSG/);
});

test('la voz de la guía no usa emojis ni signos de exclamación de cortesía', () => {
  const answers = ['Hola', '¿Qué hago hoy según el clima?', '¿Dónde me hospedo en Jalpan?', 'gracias', 'Ruta para hoy']
    .map((q) => run(q, { firstMessage: true, weather: rain }).respuesta);
  for (const text of answers) {
    assert.doesNotMatch(text, /\p{Extended_Pictographic}/u);
    assert.doesNotMatch(text, /¡/);
  }
});

test('"Lugares sin señal" no inventa cobertura y sólo lista lugares con acceso por terracería', () => {
  const extra = [{ ...base, id: 9, nombre: 'Mirador Lejano', municipio: 'Pinal de Amoles', categoria: 'Naturaleza', descripcion: 'Mirador.', acceso: 'Último tramo de terracería.' }];
  const result = runAssistantEngine({ question: 'Lugares sin señal', items: [...items, ...extra], municipalities, weather: null, events: [], origin: null, firstMessage: false });
  assert.match(result.respuesta, /No tengo datos verificados de cobertura/);
  assert.deepEqual(result.referencias.map((item) => item.id), [9]);
  assert.equal(result.referencias[0].enMapa, false);
});

test('"Comida cercana" sin ubicación pide activarla y "Ruta para hoy" arma un recorrido', () => {
  const food = run('Comida cercana');
  assert.ok(detectIntents('Comida cercana').includes('comida'));
  const route = run('Ruta para hoy', { weather: rain });
  assert.ok(detectIntents('Ruta para hoy').includes('itinerario'));
  assert.ok(!detectIntents('Ruta para hoy').includes('ruta'));
  assert.match(route.respuesta, /Ruta propuesta/);
  assert.ok(food.referencias.every((item) => item.tipo === 'servicio' || item.tipo === 'lugar'));
});

test('las referencias de servicios traen el contacto para el botón Contactar', () => {
  const result = run('¿Dónde me hospedo en Jalpan?');
  assert.equal(result.referencias[0].contacto, 'Tel. 441 296 0445');
});

test('el texto para la interfaz omite la lista (va en tarjetas) y conserva la respuesta completa', () => {
  const result = run('¿Dónde me hospedo en Jalpan?');
  assert.match(result.respuesta, /Hotel Misión Jalpan/);
  assert.doesNotMatch(result.texto, /Hotel Misión Jalpan/);
  assert.match(result.texto, /Para dormir en Jalpan de Serra:/);
  assert.equal(result.referencias[0].detalle, 'Desde $1,800');
});

// Reglas de los lugares: Chatboot nunca debe sugerir una actividad que la ficha prohíbe.
const rules = [
  { ...base, id: 10, nombre: 'Cascada El Chuveje', municipio: 'Pinal de Amoles', categoria: 'Naturaleza', descripcion: 'Cascada con pozas naturales.', actividades: 'Senderismo ligero, fotografía', recomendaciones: 'ESTÁ PROHIBIDO NADAR (es reserva natural para proteger fauna endémica como el ajolote). No introducir bebidas alcohólicas ni mascotas.' },
  { ...base, id: 11, nombre: 'Grutas de los Herrera', municipio: 'San Joaquín', categoria: 'Naturaleza', descripcion: 'Cavernas con estalactitas.', actividades: 'Exploración de cavernas' },
  { ...base, id: 12, nombre: 'Balneario El Oasis', municipio: 'Peñamiller', categoria: 'Naturaleza', descripcion: 'Balneario de manantial.', actividades: 'Natación en albercas, campismo' },
];
const runRules = (question) => runAssistantEngine({ question, items: rules, municipalities: ['Pinal de Amoles', 'San Joaquín', 'Peñamiller'], weather: null, events: [], origin: null, firstMessage: false });

test('avisa que está prohibido nadar cuando se nombra el lugar', () => {
  const result = runRules('quiero ir a la cascada el chuveje a nadar');
  assert.match(result.texto, /^Importante, sobre Cascada El Chuveje: ESTÁ PROHIBIDO NADAR/);
  assert.ok(!result.referencias.some((item) => item.id === 10));
  assert.deepEqual(result.referencias.map((item) => item.id), [12]);
});

test('para nadar sólo sugiere lugares cuya ficha lo permite', () => {
  const result = runRules('¿Dónde puedo nadar?');
  assert.deepEqual(result.referencias.map((item) => item.id), [12]);
  assert.ok(!/Grutas/.test(result.respuesta));
});

test('avisa de mascotas prohibidas', () => {
  const result = runRules('¿puedo llevar a mi perro al chuveje?');
  assert.match(result.texto, /^Importante, sobre Cascada El Chuveje: .*mascotas/);
});

test('dice que no tiene el dato cuando la pregunta está fuera de las fichas', () => {
  const result = run('¿Cuánto cuesta el uber de Querétaro a Jalpan?');
  assert.match(result.texto, /^No tengo ese dato/);
  assert.equal(result.referencias.length, 0);
});

test('una pregunta con un lugar del catálogo sí responde', () => {
  const result = run('háblame del chuveje');
  assert.ok(result.referencias.some((item) => item.id === 1));
});

test('no confunde fragmentos de palabras ni preguntas generales', () => {
  const extra = [...items, { ...base, id: 9, nombre: 'Mirador', municipio: 'Pinal de Amoles', categoria: 'Naturaleza', descripcion: 'Descubre la vista de la sierra.' }];
  const out = runAssistantEngine({ question: '¿Cuánto cuesta un uber a Jalpan?', items: extra, municipalities, weather: null, events: [], origin: null, firstMessage: false });
  assert.match(out.texto, /^No tengo ese dato/);
  const general = run('¿qué hago en Pinal de Amoles?');
  assert.ok(general.referencias.length > 0);
});

test('avisa cuando una preferencia de comida u hospedaje no aparece en las fichas', () => {
  const vegano = run('restaurante vegano en Jalpan');
  assert.match(vegano.texto, /no mencionan “vegano”/);
  const normal = run('¿dónde dormir en Jalpan?');
  assert.doesNotMatch(normal.texto, /no mencionan/);
});
