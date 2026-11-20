const test = require('node:test');
const assert = require('node:assert/strict');
const { createLimiter, clientKey, rateLimit } = require('../dist/middlewares/rateLimit');

test('la clave del límite ignora una cabecera x-forwarded-for inventada', () => {
  const req = { headers: { 'x-forwarded-for': '9.9.9.9' }, ip: '10.0.0.1', socket: { remoteAddress: '10.0.0.1' } };
  assert.equal(clientKey(req), '10.0.0.1');
  assert.equal(clientKey({ ...req, user: { id: 'u1' } }), 'u1');
});

test('bloquea al pasar el máximo y devuelve los segundos de espera', () => {
  const check = createLimiter({ windowMs: 60_000, max: 2 });
  assert.equal(check('a'), 0);
  assert.equal(check('a'), 0);
  const wait = check('a');
  assert.ok(wait > 0 && wait <= 60);
  assert.equal(check('b'), 0, 'otra clave no se afecta');
});

test('muchas claves nuevas no reinician el límite de una clave bloqueada', () => {
  const check = createLimiter({ windowMs: 60_000, max: 1, maxKeys: 50 });
  check('victima'); assert.ok(check('victima') > 0);
  for (let i = 0; i < 49; i += 1) check(`falsa-${i}`);
  assert.ok(check('victima') > 0, 'sigue bloqueada');
});

test('el middleware responde 429 con Retry-After', () => {
  const mw = rateLimit({ windowMs: 60_000, max: 1, message: 'alto' });
  const req = { headers: {}, ip: '1.2.3.4', socket: {} };
  let nexts = 0; let status = 0; const headers = {}; let body = null;
  const res = { setHeader: (k, v) => { headers[k] = v; }, status(code) { status = code; return this; }, json(b) { body = b; } };
  mw(req, res, () => { nexts += 1; });
  mw(req, res, () => { nexts += 1; });
  assert.equal(nexts, 1);
  assert.equal(status, 429);
  assert.ok(Number(headers['Retry-After']) > 0);
  assert.equal(body.error, 'alto');
});
